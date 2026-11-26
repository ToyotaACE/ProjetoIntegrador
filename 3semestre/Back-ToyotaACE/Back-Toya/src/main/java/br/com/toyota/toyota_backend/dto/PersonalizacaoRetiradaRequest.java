package br.com.toyota.toyota_backend.dto;

import lombok.Data;

@Data
public class PersonalizacaoRetiradaRequest {
    private Long clienteId;
    private Boolean laco;
    private String corLaco;
    private Boolean baloes;
    private String corBaloes;
    private Boolean confetes;
    private String corConfetes;
    private String mensagemVideo;
    private String corMensagemVideo;
}
