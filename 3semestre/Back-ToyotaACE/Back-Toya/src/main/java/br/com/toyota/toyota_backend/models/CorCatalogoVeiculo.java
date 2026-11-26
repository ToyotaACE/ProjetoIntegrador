package br.com.toyota.toyota_backend.models;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
public class CorCatalogoVeiculo {
    private String nome;
    private String hexadecimal;
}
