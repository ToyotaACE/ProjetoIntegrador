package br.com.toyota.toyota_backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AgendamentoRequest {
    private Long clienteId;
    private Long veiculoId;
    private String concessionaria;
    private String email;
    private LocalDate data;
    private LocalTime horario;
    private String tipoServico;
    private String observacao;
}
