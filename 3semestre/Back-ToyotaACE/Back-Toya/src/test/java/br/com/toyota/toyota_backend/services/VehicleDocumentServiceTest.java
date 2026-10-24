package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.models.VehicleDocument;
import br.com.toyota.toyota_backend.repositories.VehicleDocumentRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VehicleDocumentServiceTest {
    private static final Long CLIENT_ID = 12L;
    private static final Long VEHICLE_ID = 34L;
    private static final Path STORAGE_DIRECTORY = Path.of("target", "document-service-tests").toAbsolutePath();
    private static final byte[] VALID_PDF = "%PDF-1.7\n1 0 obj<</Type /Catalog>>endobj\n%%EOF\n"
            .getBytes(java.nio.charset.StandardCharsets.US_ASCII);

    private VehicleDocumentRepository documentRepository;
    private VeiculoRepository veiculoRepository;
    private VehicleDocumentService service;

    @BeforeEach
    void setUp() throws IOException {
        deleteStorageDirectory();
        Files.createDirectories(STORAGE_DIRECTORY);
        documentRepository = mock(VehicleDocumentRepository.class);
        veiculoRepository = mock(VeiculoRepository.class);
        when(veiculoRepository.findByIdAndClienteId(VEHICLE_ID, CLIENT_ID))
                .thenReturn(Optional.of(new Veiculo()));
        when(documentRepository.save(any(VehicleDocument.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        service = new VehicleDocumentService(
                documentRepository,
                veiculoRepository,
                STORAGE_DIRECTORY.toString()
        );
    }

    @AfterEach
    void tearDown() throws IOException {
        deleteStorageDirectory();
    }

    @Test
    void savesPdfUnderGeneratedIdAndSanitizesSubmittedName() throws IOException {
        MockMultipartFile upload = new MockMultipartFile(
                "arquivo",
                "C:\\Users\\outside\\..\\manual.pdf",
                "application/pdf",
                VALID_PDF
        );

        VehicleDocument saved = service.salvar(CLIENT_ID, VEHICLE_ID, upload, "manual");

        assertEquals("manual.pdf", saved.getNome());
        assertEquals(VehicleDocument.TipoDocumento.MANUAL, saved.getTipo());
        assertEquals(VALID_PDF.length, saved.getTamanho());
        assertTrue(Files.exists(STORAGE_DIRECTORY.resolve(saved.getId() + ".pdf")));
        try (var files = Files.list(STORAGE_DIRECTORY)) {
            assertEquals(List.of(saved.getId() + ".pdf"), files
                    .map(path -> path.getFileName().toString())
                    .toList());
        }
    }

    @Test
    void rejectsNonPdfMimeTypeAndInvalidPdfSignature() {
        ResponseStatusException mimeError = assertThrows(
                ResponseStatusException.class,
                () -> service.salvar(CLIENT_ID, VEHICLE_ID,
                        new MockMultipartFile("arquivo", "manual.pdf", "text/plain", VALID_PDF),
                        "manual")
        );
        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, mimeError.getStatusCode());

        ResponseStatusException signatureError = assertThrows(
                ResponseStatusException.class,
                () -> service.salvar(CLIENT_ID, VEHICLE_ID,
                        new MockMultipartFile("arquivo", "manual.pdf", "application/pdf", "not a pdf".getBytes()),
                        "manual")
        );
        assertEquals(HttpStatus.BAD_REQUEST, signatureError.getStatusCode());
    }

    @Test
    void rejectsUnsupportedTypeAndVehiclesOutsideAuthenticatedAccount() {
        ResponseStatusException typeError = assertThrows(
                ResponseStatusException.class,
                () -> service.salvar(CLIENT_ID, VEHICLE_ID,
                        new MockMultipartFile("arquivo", "manual.pdf", "application/pdf", VALID_PDF),
                        "outro")
        );
        assertEquals(HttpStatus.BAD_REQUEST, typeError.getStatusCode());

        when(veiculoRepository.findByIdAndClienteId(VEHICLE_ID, CLIENT_ID)).thenReturn(Optional.empty());
        ResponseStatusException ownershipError = assertThrows(
                ResponseStatusException.class,
                () -> service.listar(CLIENT_ID, VEHICLE_ID)
        );
        assertEquals(HttpStatus.NOT_FOUND, ownershipError.getStatusCode());
        verify(documentRepository, never()).findByVeiculo_IdOrderByDataCriacaoDesc(any());
    }

    private static void deleteStorageDirectory() throws IOException {
        if (!Files.exists(STORAGE_DIRECTORY)) {
            return;
        }
        try (var paths = Files.walk(STORAGE_DIRECTORY)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException exception) {
                    throw new IllegalStateException(exception);
                }
            });
        }
    }
}
