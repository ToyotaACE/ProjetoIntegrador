package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.AgendamentoRequest;
import br.com.toyota.toyota_backend.dto.AgendamentoDisponibilidade;
import br.com.toyota.toyota_backend.dto.PersonalizacaoRetiradaRequest;
import br.com.toyota.toyota_backend.models.Agendamento;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.repositories.AgendamentoRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import br.com.toyota.toyota_backend.services.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final VeiculoRepository veiculoRepository;

    public AgendamentoController(
            AgendamentoRepository agendamentoRepository,
            ClienteService clienteService,
            VeiculoRepository veiculoRepository
    ) {
        this.agendamentoRepository = agendamentoRepository;
        this.clienteService = clienteService;
        this.veiculoRepository = veiculoRepository;
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
        if (request.getVeiculoId() != null) {
            agendamento.setVeiculo(veiculoRepository
                    .findByIdAndClienteId(request.getVeiculoId(), cliente.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "O veículo selecionado não pertence ao cliente."
                    )));
        }
        agendamento.setData(request.getData());
        agendamento.setHorario(request.getHorario());
        agendamento.setConcessionaria(request.getConcessionaria());
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

    @PutMapping("/{id}/personalizacao-retirada")
    public ResponseEntity<Agendamento> personalizarRetirada(
            @PathVariable Long id,
            @RequestBody PersonalizacaoRetiradaRequest request
    ) {
        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado."));

        if (request.getClienteId() == null
                || !request.getClienteId().equals(agendamento.getCliente().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este agendamento não pertence ao cliente informado.");
        }

        if (agendamento.getTipoServico() == null
                || !agendamento.getTipoServico().toLowerCase(Locale.ROOT).contains("retirada")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A personalização está disponível apenas para retiradas.");
        }

        boolean laco = Boolean.TRUE.equals(request.getLaco());
        boolean baloes = Boolean.TRUE.equals(request.getBaloes());
        boolean confetes = Boolean.TRUE.equals(request.getConfetes());
        String mensagemVideo = request.getMensagemVideo() == null ? "" : request.getMensagemVideo().trim();

        if (mensagemVideo.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A mensagem do vídeo deve ter no máximo 100 caracteres.");
        }

        String corLaco = validarCor(request.getCorLaco(), laco, "laço");
        String corBaloes = validarCor(request.getCorBaloes(), baloes, "balões");
        String corConfetes = validarCor(request.getCorConfetes(), confetes, "confetes");
        String corMensagemVideo = validarCor(
                request.getCorMensagemVideo(),
                !mensagemVideo.isEmpty(),
                "mensagem do vídeo"
        );

        agendamento.setRetiradaLaco(laco);
        agendamento.setRetiradaCorLaco(corLaco);
        agendamento.setRetiradaBaloes(baloes);
        agendamento.setRetiradaCorBaloes(corBaloes);
        agendamento.setRetiradaConfetes(confetes);
        agendamento.setRetiradaCorConfetes(corConfetes);
        agendamento.setRetiradaMensagemVideo(mensagemVideo.isEmpty() ? null : mensagemVideo);
        agendamento.setRetiradaCorMensagemVideo(corMensagemVideo);
        agendamento.setRetiradaPersonalizada(true);

        return ResponseEntity.ok(agendamentoRepository.save(agendamento));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAgendamento(@PathVariable Long id) {
        if (!agendamentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        agendamentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validarCor(String cor, boolean obrigatoria, String opcao) {
        if (!obrigatoria) {
            return null;
        }

        if (cor == null || !HEX_COLOR.matcher(cor).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selecione uma cor válida para " + opcao + "."
            );
        }

        return cor.toUpperCase(Locale.ROOT);
    }
}