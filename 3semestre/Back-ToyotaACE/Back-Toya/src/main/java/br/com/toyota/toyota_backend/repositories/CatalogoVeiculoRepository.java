package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.CatalogoVeiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogoVeiculoRepository extends JpaRepository<CatalogoVeiculo, Long> {
    List<CatalogoVeiculo> findAllByOrderByModeloAsc();
}
