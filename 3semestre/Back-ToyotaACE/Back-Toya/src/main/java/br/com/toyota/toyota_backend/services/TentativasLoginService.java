package br.com.toyota.toyota_backend.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Proteção contra força bruta no login: após 5 falhas para a mesma conta,
 * bloqueia novas tentativas por 15 minutos (HTTP 429).
 * O controle fica em memória (por instância do back-end).
 */
@Service
public class TentativasLoginService {

    private static final int MAX_FALHAS = 5;
    private static final Duration JANELA = Duration.ofMinutes(15);

    private record Registro(int falhas, Instant inicio) {}

    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    public void verificarBloqueio(String chave) {
        Registro registro = registros.get(chave);

        if (registro == null) {
            return;
        }

        if (Instant.now().isAfter(registro.inicio().plus(JANELA))) {
            registros.remove(chave);
            return;
        }

        if (registro.falhas() >= MAX_FALHAS) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas tentativas de login. Tente novamente em 15 minutos."
            );
        }
    }

    public void registrarFalha(String chave) {
        Instant agora = Instant.now();

        registros.merge(chave, new Registro(1, agora), (atual, novo) ->
                agora.isAfter(atual.inicio().plus(JANELA))
                        ? novo
                        : new Registro(atual.falhas() + 1, atual.inicio()));
    }

    public void registrarSucesso(String chave) {
        registros.remove(chave);
    }
}
