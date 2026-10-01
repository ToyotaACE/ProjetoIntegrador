package br.com.toyota.toyota_backend.repositories;

import br.com.toyota.toyota_backend.models.Agendamento;
import br.com.toyota.toyota_backend.dto.AgendamentoDisponibilidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findByClienteIdOrderByDataAscHorarioAsc(Long clienteId);

    List<Agendamento> findAllByOrderByDataAscHorarioAsc();

    boolean existsByDataAndHorario(LocalDate data, LocalTime horario);

    @Query("select new br.com.toyota.toyota_backend.dto.AgendamentoDisponibilidade(a.data, a.horario) from Agendamento a")
    List<AgendamentoDisponibilidade> findAllHorariosOcupados();
}