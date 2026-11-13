package br.com.toyota.toyota_backend.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Evita que detalhes internos do banco (nomes de tabela, constraints, SQL)
 * apareçam nas respostas de erro da API.
 */
@RestControllerAdvice
public class TratadorErros {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> violacaoIntegridade(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "status", 409,
                "error", "Conflict",
                "message", "Não foi possível salvar: dado duplicado ou inválido."
        ));
    }
}
