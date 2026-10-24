package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.ClienteSession;
import br.com.toyota.toyota_backend.repositories.ClienteSessionRepository;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class ClienteSessionService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long TOKEN_LIFETIME_HOURS = 12;

    private final ClienteSessionRepository sessionRepository;
    private final ClienteRepository clienteRepository;

    public ClienteSessionService(
            ClienteSessionRepository sessionRepository,
            ClienteRepository clienteRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.clienteRepository = clienteRepository;
    }

    public String criarToken(Long clienteId) {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Instant now = Instant.now();
        sessionRepository.deleteByExpiresAtBefore(now);
        sessionRepository.save(new ClienteSession(hash(token), clienteId, now.plus(TOKEN_LIFETIME_HOURS, ChronoUnit.HOURS)));
        return token;
    }

    public Long autenticar(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw unauthorized();
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isEmpty() || token.length() > 128) {
            throw unauthorized();
        }

        return sessionRepository.findByTokenHashAndExpiresAtAfter(hash(token), Instant.now())
                .map(ClienteSession::getClienteId)
                .filter(clienteRepository::existsById)
                .orElseThrow(ClienteSessionService::unauthorized);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de acesso ausente, inválido ou expirado.");
    }
}
