package br.com.toyota.toyota_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record CatalogoVeiculoResponse(
        Long id,
        String modelo,
        String categoria,
        Integer ano,
        BigDecimal precoBase,
        String motor,
        String combustivel,
        String cambio,
        String fotoCarroUrl,
        List<Versao> versoes,
        List<Cor> cores,
        List<Opcional> opcionais
) {
    public record Versao(String nome, String motor, BigDecimal preco) {}
    public record Cor(String nome, String hexadecimal) {}
    public record Opcional(String nome, BigDecimal preco) {}
}
