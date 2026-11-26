package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.PersonalizacaoRetiradaRequest;
import br.com.toyota.toyota_backend.models.Agendamento;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.repositories.AgendamentoRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import br.com.toyota.toyota_backend.services.ClienteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AgendamentoPersonalizacaoRetiradaTest {

    private AgendamentoRepository agendamentoRepository;
    private AgendamentoController controller;
    private Agendamento agendamento;

    @BeforeEach
    void setUp() {
        agendamentoRepository = mock(AgendamentoRepository.class);
        controller = new AgendamentoController(
                agendamentoRepository,
                mock(ClienteService.class),
                mock(VeiculoRepository.class)
        );

        Cliente cliente = new Cliente();
        cliente.setId(5L);

        agendamento = new Agendamento();
        agendamento.setId(10L);
        agendamento.setCliente(cliente);
        agendamento.setTipoServico("Retirada");

        when(agendamentoRepository.findById(10L)).thenReturn(Optional.of(agendamento));
        when(agendamentoRepository.save(any(Agendamento.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void salvaPersonalizacaoParaAgendamentoDeRetiradaDoCliente() {
        PersonalizacaoRetiradaRequest request = new PersonalizacaoRetiradaRequest();
        request.setClienteId(5L);
        request.setLaco(true);
        request.setCorLaco("#dc2626");
        request.setMensagemVideo("Parabéns!");
        request.setCorMensagemVideo("#111827");

        ResponseEntity<Agendamento> response = controller.personalizarRetirada(10L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getRetiradaPersonalizada());
        assertTrue(response.getBody().getRetiradaLaco());
        assertEquals("#DC2626", response.getBody().getRetiradaCorLaco());
        assertEquals("Parabéns!", response.getBody().getRetiradaMensagemVideo());
        assertNull(response.getBody().getRetiradaCorConfetes());
        verify(agendamentoRepository).save(agendamento);
    }

    @Test
    void naoPermitePersonalizacaoPorOutroCliente() {
        PersonalizacaoRetiradaRequest request = new PersonalizacaoRetiradaRequest();
        request.setClienteId(6L);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.personalizarRetirada(10L, request)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(agendamentoRepository, never()).save(any(Agendamento.class));
    }

    @Test
    void rejeitaMensagemDeVideoAcimaDoLimite() {
        PersonalizacaoRetiradaRequest request = new PersonalizacaoRetiradaRequest();
        request.setClienteId(5L);
        request.setMensagemVideo("a".repeat(101));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.personalizarRetirada(10L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(agendamentoRepository, never()).save(any(Agendamento.class));
    }
}
