package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

    List<Veiculo> findByClienteId(Long clienteId);

    Optional<Veiculo> findByIdAndClienteId(Long id, Long clienteId);

    boolean existsByChassiVeiculo(String chassiVeiculo);

    boolean existsByPlacaVeiculo(String placaVeiculo);

    Optional<Veiculo> findByChassiVeiculo(String chassiVeiculo);
}