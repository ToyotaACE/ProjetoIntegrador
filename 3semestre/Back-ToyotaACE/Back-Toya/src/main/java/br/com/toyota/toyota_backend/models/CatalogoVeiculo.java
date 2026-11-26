package br.com.toyota.toyota_backend.models;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "catalogo_veiculos")
@Data
@NoArgsConstructor
public class CatalogoVeiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String modelo;

    @Column(nullable = false, length = 40)
    private String categoria;

    @Column(nullable = false)
    private Integer ano;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoBase;

    @Column(nullable = false, length = 100)
    private String motor;

    @Column(nullable = false, length = 50)
    private String combustivel;

    @Column(nullable = false, length = 80)
    private String cambio;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fotoCarroUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "catalogo_veiculo_versoes",
            joinColumns = @JoinColumn(name = "catalogo_veiculo_id")
    )
    @OrderColumn(name = "posicao")
    private List<VersaoCatalogoVeiculo> versoes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "catalogo_veiculo_cores",
            joinColumns = @JoinColumn(name = "catalogo_veiculo_id")
    )
    @OrderColumn(name = "posicao")
    private List<CorCatalogoVeiculo> cores = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "catalogo_veiculo_opcionais",
            joinColumns = @JoinColumn(name = "catalogo_veiculo_id")
    )
    @OrderColumn(name = "posicao")
    private List<OpcionalCatalogoVeiculo> opcionais = new ArrayList<>();
}
