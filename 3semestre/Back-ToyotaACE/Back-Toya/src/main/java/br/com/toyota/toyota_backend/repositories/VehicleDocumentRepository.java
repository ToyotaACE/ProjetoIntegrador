package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.VehicleDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleDocumentRepository extends JpaRepository<VehicleDocument, String> {
    List<VehicleDocument> findByVeiculo_IdOrderByDataCriacaoDesc(Long veiculoId);
    Optional<VehicleDocument> findByIdAndVeiculo_Id(String id, Long veiculoId);
}
