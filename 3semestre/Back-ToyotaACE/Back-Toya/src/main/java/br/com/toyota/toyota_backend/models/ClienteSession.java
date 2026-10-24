package br.com.toyota.toyota_backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "cliente_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteSession {
    @Id
    @Column(name = "token_hash", length = 64, nullable = false)
    private String tokenHash;

    @Column(name = "cliente_id", nullable = false)
    private Long clienteId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
