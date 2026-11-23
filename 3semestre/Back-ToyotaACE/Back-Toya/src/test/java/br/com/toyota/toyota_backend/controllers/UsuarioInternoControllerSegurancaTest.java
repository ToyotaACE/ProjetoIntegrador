package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.UsuarioInternoLoginRequest;
import br.com.toyota.toyota_backend.models.PerfilUsuario;
import br.com.toyota.toyota_backend.models.UsuarioInterno;
import br.com.toyota.toyota_backend.repositories.UsuarioInternoRepository;
import br.com.toyota.toyota_backend.services.TentativasLoginService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UsuarioInternoControllerSegurancaTest {

    private UsuarioInternoRepository repository;
    private PasswordEncoder passwordEncoder;
    private UsuarioInternoController controller;

    @BeforeEach
    void setUp() {
        repository = mock(UsuarioInternoRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        when(repository.save(any(UsuarioInterno.class))).thenAnswer(inv -> inv.getArgument(0));

        controller = new UsuarioInternoController(repository, new TentativasLoginService(), passwordEncoder);
    }

    private static UsuarioInterno usuario(String senhaArmazenada) {
        UsuarioInterno u = new UsuarioInterno();
        u.setId(1L);
        u.setNome("Vendedor Teste");
        u.setEmail("vendedor@toyota.com");
        u.setSenha(senhaArmazenada);
        u.setPerfil(PerfilUsuario.VENDEDOR);
        u.setAtivo(true);
        return u;
    }

    private static UsuarioInternoLoginRequest login(String email, String senha) {
        UsuarioInternoLoginRequest req = new UsuarioInternoLoginRequest();
        req.setEmail(email);
        req.setSenha(senha);
        return req;
    }

    @Test
    void respostaJsonNaoContemASenha() throws Exception {
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(usuario("qualquer"));

        assertFalse(json.contains("senha"), "a senha não pode sair nas respostas da API");
    }

    @Test
    void loginComSenhaBcryptCorretaFunciona() {
        when(repository.findByEmail("vendedor@toyota.com"))
                .thenReturn(Optional.of(usuario(passwordEncoder.encode("Senha@123"))));

        ResponseEntity<UsuarioInterno> resposta = controller.login(login("vendedor@toyota.com", "Senha@123"));

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
    }

    @Test
    void senhaAntigaEmTextoPuroEhConvertidaParaBcryptNoPrimeiroLogin() {
        UsuarioInterno u = usuario("123456");
        when(repository.findByEmail("vendedor@toyota.com")).thenReturn(Optional.of(u));

        ResponseEntity<UsuarioInterno> resposta = controller.login(login("vendedor@toyota.com", "123456"));

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        assertTrue(u.getSenha().startsWith("$2"), "a senha deve ter sido convertida para BCrypt");
        assertTrue(passwordEncoder.matches("123456", u.getSenha()));
        verify(repository).save(u);
    }

    @Test
    void oProprioHashNaoFuncionaComoSenha() {
        String hash = passwordEncoder.encode("Senha@123");
        when(repository.findByEmail("vendedor@toyota.com")).thenReturn(Optional.of(usuario(hash)));

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> controller.login(login("vendedor@toyota.com", hash)));

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatusCode());
    }

    @Test
    void senhaErradaResponde401() {
        when(repository.findByEmail("vendedor@toyota.com"))
                .thenReturn(Optional.of(usuario(passwordEncoder.encode("Senha@123"))));

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> controller.login(login("vendedor@toyota.com", "Errada@123")));

        assertEquals(HttpStatus.UNAUTHORIZED, erro.getStatusCode());
    }

    @Test
    void criarUsuarioGravaSenhaComHash() {
        when(repository.existsByEmail("novo@toyota.com")).thenReturn(false);
        UsuarioInterno dados = usuario("Nova@123");
        dados.setEmail("novo@toyota.com");

        controller.criar(dados);

        ArgumentCaptor<UsuarioInterno> salvo = ArgumentCaptor.forClass(UsuarioInterno.class);
        verify(repository).save(salvo.capture());
        assertNotEquals("Nova@123", salvo.getValue().getSenha());
        assertTrue(passwordEncoder.matches("Nova@123", salvo.getValue().getSenha()));
    }

    @Test
    void criarUsuarioSemSenhaResponde400() {
        when(repository.existsByEmail("novo@toyota.com")).thenReturn(false);
        UsuarioInterno dados = usuario(null);
        dados.setEmail("novo@toyota.com");

        ResponseStatusException erro = assertThrows(ResponseStatusException.class, () -> controller.criar(dados));

        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void atualizarSenhaGravaComHash() {
        UsuarioInterno existente = usuario(passwordEncoder.encode("Antiga@123"));
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        UsuarioInterno dados = new UsuarioInterno();
        dados.setSenha("Nova@456");

        controller.atualizar(1L, dados);

        assertTrue(passwordEncoder.matches("Nova@456", existente.getSenha()));
    }

    @Test
    void atualizarSemSenhaMantemASenhaAtual() {
        String hashAtual = passwordEncoder.encode("Antiga@123");
        UsuarioInterno existente = usuario(hashAtual);
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        UsuarioInterno dados = new UsuarioInterno();
        dados.setNome("Nome Novo");

        controller.atualizar(1L, dados);

        assertEquals(hashAtual, existente.getSenha());
        assertEquals("Nome Novo", existente.getNome());
    }
}
