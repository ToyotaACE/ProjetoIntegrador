package br.com.toyota.toyota_backend.models;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Embeddable
@Data
@NoArgsConstructor
public class VersaoCatalogoVeiculo {
    private String nome;
    private String motor;
    private BigDecimal preco;
}
