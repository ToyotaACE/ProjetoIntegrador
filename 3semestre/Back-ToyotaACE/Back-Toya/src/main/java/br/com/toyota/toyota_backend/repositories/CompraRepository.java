package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.Compra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findByClienteId(Long clienteId);

    void deleteByClienteId(Long clienteId);
}