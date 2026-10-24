package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.VehicleDocumentResponse;
import br.com.toyota.toyota_backend.models.VehicleDocument;
import br.com.toyota.toyota_backend.services.ClienteSessionService;
import br.com.toyota.toyota_backend.services.VehicleDocumentService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/veiculos/{vehicleId}/documentos")
@CrossOrigin(origins = "*", exposedHeaders = {HttpHeaders.CONTENT_DISPOSITION})
public class VehicleDocumentController {
    private final VehicleDocumentService documentService;
    private final ClienteSessionService sessionService;

    public VehicleDocumentController(
            VehicleDocumentService documentService,
            ClienteSessionService sessionService
    ) {
        this.documentService = documentService;
        this.sessionService = sessionService;
    }

    @GetMapping
    public List<VehicleDocumentResponse> listar(
            @PathVariable Long vehicleId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        Long clienteId = sessionService.autenticar(authorization);
        return documentService.listar(clienteId, vehicleId).stream()
                .map(VehicleDocumentResponse::from)
                .toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VehicleDocumentResponse> enviar(
            @PathVariable Long vehicleId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestPart(value = "arquivo", required = false) MultipartFile arquivo,
            @RequestParam(value = "tipo", required = false) String tipo
    ) {
        Long clienteId = sessionService.autenticar(authorization);
        VehicleDocument saved = documentService.salvar(clienteId, vehicleId, arquivo, tipo);
        return ResponseEntity.status(201).body(VehicleDocumentResponse.from(saved));
    }

    @GetMapping("/{documentId}/arquivo")
    public ResponseEntity<byte[]> obterArquivo(
            @PathVariable Long vehicleId,
            @PathVariable String documentId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(defaultValue = "false") boolean download
    ) {
        Long clienteId = sessionService.autenticar(authorization);
        VehicleDocument document = documentService.buscarDocumentoProprietario(clienteId, vehicleId, documentId);
        byte[] bytes = documentService.obterArquivo(clienteId, vehicleId, documentId);
        ContentDisposition disposition = ContentDisposition.builder(download ? "attachment" : "inline")
                .filename("documento-" + document.getId() + ".pdf", StandardCharsets.US_ASCII)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(bytes.length)
                .cacheControl(CacheControl.noStore().cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "sandbox")
                .body(bytes);
    }

    @DeleteMapping("/{documentId}/arquivo")
    public ResponseEntity<Void> excluir(
            @PathVariable Long vehicleId,
            @PathVariable String documentId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        Long clienteId = sessionService.autenticar(authorization);
        documentService.excluir(clienteId, vehicleId, documentId);
        return ResponseEntity.noContent().build();
    }
}
