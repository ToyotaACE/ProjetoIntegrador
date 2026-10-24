package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.ClienteSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface ClienteSessionRepository extends JpaRepository<ClienteSession, String> {
    Optional<ClienteSession> findByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);
    long deleteByExpiresAtBefore(Instant now);
}
