package br.com.toyota.toyota_backend.dto;

import br.com.toyota.toyota_backend.models.VehicleDocument;

import java.time.Instant;

public record VehicleDocumentResponse(
        String id,
        String nome,
        String tipo,
        long tamanho,
        Instant dataCriacao
) {
    public static VehicleDocumentResponse from(VehicleDocument document) {
        return new VehicleDocumentResponse(
                document.getId(),
                document.getNome(),
                document.getTipo().name().toLowerCase(),
                document.getTamanho(),
                document.getDataCriacao()
        );
    }
}
