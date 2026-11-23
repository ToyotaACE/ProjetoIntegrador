package br.com.toyota.toyota_backend.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "usuarios_internos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioInterno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(unique = true, nullable = false, length = 120)
    private String email;

    // Segurança: a senha é aceita nas requisições, mas nunca devolvida nas respostas
    @Column(nullable = false, length = 120)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PerfilUsuario perfil;

    @Column(nullable = false)
    private Boolean ativo = true;

    private LocalDate createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDate.now();
        }

        if (ativo == null) {
            ativo = true;
        }
    }
}