package br.com.toyota.toyota_backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicle_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDocument {
    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @Column(nullable = false, length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TipoDocumento tipo;

    @Column(nullable = false)
    private long tamanho;

    @Column(name = "data_criacao", nullable = false)
    private Instant dataCriacao;

    public enum TipoDocumento {
        MANUAL,
        DOCUMENTO
    }

    public static String novoId() {
        return UUID.randomUUID().toString();
    }
}
