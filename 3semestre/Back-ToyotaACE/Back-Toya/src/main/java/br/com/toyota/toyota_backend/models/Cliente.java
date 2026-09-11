package br.com.toyota.toyota_backend.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // DADOS CLIENTE
    // =========================

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(unique = true, nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 120)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @Column(unique = true, length = 20)
    private String cpf;

    private String telefone;

    private String endereco;

    // =========================
    // VEÍCULOS
    // =========================

    @OneToMany(
        mappedBy = "cliente",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.EAGER
)
    @JsonManagedReference
    private List<Veiculo> veiculos = new ArrayList<>();
}