package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.models.VehicleDocument;
import br.com.toyota.toyota_backend.repositories.VehicleDocumentRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class VehicleDocumentService {
    public static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final int PDF_HEADER_SEARCH_BYTES = 1024;
    private static final int PDF_EOF_SEARCH_BYTES = 1024;

    private final VehicleDocumentRepository documentRepository;
    private final VeiculoRepository veiculoRepository;
    private final Path storageDirectory;

    public VehicleDocumentService(
            VehicleDocumentRepository documentRepository,
            VeiculoRepository veiculoRepository,
            @Value("${app.documents.storage-directory:./data/documents}") String storageDirectory
    ) {
        this.documentRepository = documentRepository;
        this.veiculoRepository = veiculoRepository;
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
    }

    public List<VehicleDocument> listar(Long clienteId, Long veiculoId) {
        verificarPropriedade(clienteId, veiculoId);
        return documentRepository.findByVeiculo_IdOrderByDataCriacaoDesc(veiculoId);
    }

    public VehicleDocument salvar(Long clienteId, Long veiculoId, MultipartFile file, String tipo) {
        Veiculo vehicle = verificarPropriedade(clienteId, veiculoId);
        VehicleDocument.TipoDocumento parsedType = parseType(tipo);
        byte[] bytes = validarEObterBytes(file);
        String id = VehicleDocument.novoId();
        String filename = sanitizeDisplayName(file.getOriginalFilename());
        Path filePath = pathFor(id);

        try {
            Files.createDirectories(storageDirectory);
            Files.write(filePath, bytes, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível armazenar o arquivo PDF.", exception);
        }

        VehicleDocument document = new VehicleDocument(
                id,
                vehicle,
                filename,
                parsedType,
                bytes.length,
                Instant.now()
        );
        try {
            return documentRepository.save(document);
        } catch (RuntimeException exception) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            throw exception;
        }
    }

    public byte[] obterArquivo(Long clienteId, Long veiculoId, String documentId) {
        VehicleDocument document = buscarDocumentoProprietario(clienteId, veiculoId, documentId);
        Path filePath = pathFor(document.getId());
        if (!Files.isRegularFile(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo PDF não encontrado no armazenamento.");
        }
        try {
            return Files.readAllBytes(filePath);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível ler o arquivo PDF.", exception);
        }
    }

    public VehicleDocument buscarDocumentoProprietario(Long clienteId, Long veiculoId, String documentId) {
        verificarPropriedade(clienteId, veiculoId);
        String normalizedId = normalizeId(documentId);
        return documentRepository.findByIdAndVeiculo_Id(normalizedId, veiculoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado para este veículo."));
    }

    public void excluir(Long clienteId, Long veiculoId, String documentId) {
        VehicleDocument document = buscarDocumentoProprietario(clienteId, veiculoId, documentId);
        excluirArquivoERegistro(document);
    }

    public void excluirTodosDoVeiculo(Long veiculoId) {
        for (VehicleDocument document : documentRepository.findByVeiculo_IdOrderByDataCriacaoDesc(veiculoId)) {
            excluirArquivoERegistro(document);
        }
    }

    private void excluirArquivoERegistro(VehicleDocument document) {
        try {
            Files.deleteIfExists(pathFor(document.getId()));
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível excluir o arquivo PDF.", exception);
        }
        documentRepository.delete(document);
    }

    private Veiculo verificarPropriedade(Long clienteId, Long veiculoId) {
        return veiculoRepository.findByIdAndClienteId(veiculoId, clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado para esta conta."));
    }

    private byte[] validarEObterBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O campo 'arquivo' é obrigatório e não pode estar vazio.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "O PDF excede o limite de 10 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !"application/pdf".equalsIgnoreCase(contentType.split(";", 2)[0].trim())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "O arquivo deve ser enviado com Content-Type application/pdf.");
        }

        final byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível ler o arquivo enviado.", exception);
        }
        if (!hasPdfSignatures(bytes)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O arquivo não possui uma assinatura PDF válida.");
        }
        return bytes;
    }

    private static boolean hasPdfSignatures(byte[] bytes) {
        if (bytes.length < 12) {
            return false;
        }
        byte[] header = "%PDF-".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        boolean validHeader = false;
        for (int start = 0; start <= Math.min(bytes.length - header.length, PDF_HEADER_SEARCH_BYTES - header.length); start++) {
            boolean matches = true;
            for (int i = 0; i < header.length; i++) {
                if (bytes[start + i] != header[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                validHeader = true;
                break;
            }
        }
        if (!validHeader) {
            return false;
        }

        byte[] eof = "%%EOF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        int start = Math.max(0, bytes.length - PDF_EOF_SEARCH_BYTES);
        for (int offset = start; offset <= bytes.length - eof.length; offset++) {
            boolean matches = true;
            for (int i = 0; i < eof.length; i++) {
                if (bytes[offset + i] != eof[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return true;
            }
        }
        return false;
    }

    private Path pathFor(String id) {
        UUID uuid = UUID.fromString(id);
        Path path = storageDirectory.resolve(uuid + ".pdf").normalize();
        if (!path.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de documento inválido.");
        }
        return path;
    }

    private static String normalizeId(String id) {
        try {
            return UUID.fromString(id).toString();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado para este veículo.");
        }
    }

    private static VehicleDocument.TipoDocumento parseType(String type) {
        if ("manual".equalsIgnoreCase(type)) {
            return VehicleDocument.TipoDocumento.MANUAL;
        }
        if ("documento".equalsIgnoreCase(type)) {
            return VehicleDocument.TipoDocumento.DOCUMENTO;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O campo 'tipo' deve ser 'manual' ou 'documento'.");
    }

    private static String sanitizeDisplayName(String submittedName) {
        String basename = submittedName == null ? "documento.pdf" : submittedName.replace('\\', '/');
        basename = basename.substring(basename.lastIndexOf('/') + 1);
        basename = Normalizer.normalize(basename, Normalizer.Form.NFKC)
                .replaceAll("[\\p{Cntrl}]", "")
                .replaceAll("[^\\p{L}\\p{N}._ -]", "_")
                .trim();
        basename = basename.replaceAll("^[. ]+|[. ]+$", "");
        if (basename.isBlank()) {
            basename = "documento";
        }
        if (!basename.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            basename += ".pdf";
        }
        return basename.length() > 120 ? basename.substring(0, 116) + ".pdf" : basename;
    }
}
