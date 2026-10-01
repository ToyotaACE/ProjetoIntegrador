package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.AgendamentoRequest;
import br.com.toyota.toyota_backend.dto.AgendamentoDisponibilidade;
import br.com.toyota.toyota_backend.models.Agendamento;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.repositories.AgendamentoRepository;
import br.com.toyota.toyota_backend.services.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;

    public AgendamentoController(
            AgendamentoRepository agendamentoRepository,
            ClienteService clienteService
    ) {
        this.agendamentoRepository = agendamentoRepository;
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<?> agendar(@RequestBody AgendamentoRequest request) {
        if (agendamentoRepository.existsByDataAndHorario(request.getData(), request.getHorario())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Este horário já está reservado. Escolha outro."));
        }

        Cliente cliente;

        if (request.getClienteId() != null) {
            cliente = clienteService.buscarPorId(request.getClienteId());
        } else {
            cliente = clienteService.buscarPorEmail(request.getEmail());
        }

        Agendamento agendamento = new Agendamento();
        agendamento.setCliente(cliente);
        agendamento.setData(request.getData());
        agendamento.setHorario(request.getHorario());
        agendamento.setTipoServico(request.getTipoServico());
        agendamento.setObservacao(request.getObservacao());
        agendamento.setStatus("AGENDADO");

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        return ResponseEntity.ok(agendamentoSalvo);
    }

    @GetMapping
    public ResponseEntity<List<Agendamento>> listarTodos() {
        List<Agendamento> agendamentos = agendamentoRepository.findAllByOrderByDataAscHorarioAsc();
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/horarios-ocupados")
    public ResponseEntity<List<AgendamentoDisponibilidade>> listarHorariosOcupados() {
        return ResponseEntity.ok(agendamentoRepository.findAllHorariosOcupados());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Agendamento>> listarPorCliente(@PathVariable Long clienteId) {
        List<Agendamento> agendamentos = agendamentoRepository.findByClienteIdOrderByDataAscHorarioAsc(clienteId);
        return ResponseEntity.ok(agendamentos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAgendamento(@PathVariable Long id) {
        if (!agendamentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        agendamentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}