package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ClienteServiceSegurancaTest {

    private ClienteRepository clienteRepository;
    private PasswordEncoder passwordEncoder;
    private ClienteService service;

    @BeforeEach
    void setUp() {
        clienteRepository = mock(ClienteRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.encode(anyString())).thenReturn("hash-bcrypt");
        when(clienteRepository.save(any(Cliente.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service = new ClienteService(
                clienteRepository,
                mock(VeiculoRepository.class),
                mock(MqttPedidoSimulatorService.class),
                passwordEncoder,
                mock(VehicleDocumentService.class),
                new TentativasLoginService()
        );
    }

    private static Cliente novoCliente() {
        Cliente cliente = new Cliente();
        cliente.setNome("Invasor");
        cliente.setEmail("invasor@teste.com");
        cliente.setSenha("Invasor@123");
        cliente.setCpf("99999999999");
        return cliente;
    }

    @Test
    void cadastroIgnoraIdEVeiculosEnviadosNoJson() {
        Cliente cliente = novoCliente();
        cliente.setId(1L);
        cliente.setVeiculos(new ArrayList<>(List.of(new Veiculo())));

        service.cadastrar(cliente);

        ArgumentCaptor<Cliente> salvo = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(salvo.capture());
        assertNull(salvo.getValue().getId(), "o id enviado não pode sobrescrever outro cliente");
        assertTrue(salvo.getValue().getVeiculos().isEmpty());
        assertEquals("hash-bcrypt", salvo.getValue().getSenha());
    }

    @Test
    void loginComEmailInexistenteResponde401ComAMesmaMensagem() {
        when(clienteRepository.findByEmail("naoexiste@teste.com")).thenReturn(Optional.empty());

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.login("naoexiste@teste.com", "Qualquer@123")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatusCode());
        assertEquals("E-mail ou senha incorretos", erro.getReason());
    }

    @Test
    void loginComSenhaErradaResponde401ComAMesmaMensagem() {
        Cliente cliente = novoCliente();
        cliente.setSenha("$2a$10$hashquenaoconfere");
        when(clienteRepository.findByEmail("invasor@teste.com")).thenReturn(Optional.of(cliente));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.login("invasor@teste.com", "Errada@123")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatusCode());
        assertEquals("E-mail ou senha incorretos", erro.getReason());
    }

    @Test
    void loginBloqueiaComHttp429AposCincoFalhas() {
        when(clienteRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        for (int i = 0; i < 5; i++) {
            assertThrows(ResponseStatusException.class,
                    () -> service.login("alvo@teste.com", "Tentativa@123"));
        }

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.login("alvo@teste.com", "Tentativa@123")
        );
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, erro.getStatusCode());
    }

    @Test
    void atualizarComEmailDeOutroClienteResponde409() {
        Cliente existente = novoCliente();
        existente.setId(5L);
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(existente));
        when(clienteRepository.existsByEmail("vitima@teste.com")).thenReturn(true);

        Cliente dados = new Cliente();
        dados.setEmail("vitima@teste.com");

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.atualizar(5L, dados)
        );
        assertEquals(HttpStatus.CONFLICT, erro.getStatusCode());
        verify(clienteRepository, never()).save(any());
    }
}
