package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.UsuarioInternoLoginRequest;
import br.com.toyota.toyota_backend.models.PerfilUsuario;
import br.com.toyota.toyota_backend.models.UsuarioInterno;
import br.com.toyota.toyota_backend.repositories.UsuarioInternoRepository;
import br.com.toyota.toyota_backend.services.TentativasLoginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioInternoController {

    private final UsuarioInternoRepository usuarioRepository;
    private final TentativasLoginService tentativasLoginService;

    public UsuarioInternoController(
            UsuarioInternoRepository usuarioRepository,
            TentativasLoginService tentativasLoginService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.tentativasLoginService = tentativasLoginService;
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioInterno> login(@RequestBody UsuarioInternoLoginRequest loginRequest) {
        String email = loginRequest.getEmail() == null
                ? ""
                : loginRequest.getEmail().trim().toLowerCase();

        String senha = loginRequest.getSenha() == null
                ? ""
                : loginRequest.getSenha();

        // Segurança: limite de tentativas contra força bruta
        String chave = "usuario:" + email;
        tentativasLoginService.verificarBloqueio(chave);

        UsuarioInterno usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null || !usuario.getSenha().equals(senha)) {
            tentativasLoginService.registrarFalha(chave);
            throw new ResponseStatusException(UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        if (usuario.getAtivo() == null || !usuario.getAtivo()) {
            throw new ResponseStatusException(FORBIDDEN, "Usuário desativado. Fale com o administrador.");
        }

        tentativasLoginService.registrarSucesso(chave);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioInterno>> listar() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioInterno> buscarPorId(@PathVariable Long id) {
        UsuarioInterno usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuário não encontrado."));

        return ResponseEntity.ok(usuario);
    }

    @PostMapping
    public ResponseEntity<UsuarioInterno> criar(@RequestBody UsuarioInterno dados) {
        String email = normalizarEmail(dados.getEmail());

        if (email.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "E-mail é obrigatório.");
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "Já existe um usuário com este e-mail.");
        }

        UsuarioInterno usuario = new UsuarioInterno();
        usuario.setNome(dados.getNome());
        usuario.setEmail(email);
        usuario.setSenha(dados.getSenha());
        usuario.setPerfil(dados.getPerfil() == null ? PerfilUsuario.VENDEDOR : dados.getPerfil());
        usuario.setAtivo(dados.getAtivo() == null ? true : dados.getAtivo());
        usuario.setCreatedAt(LocalDate.now());

        return ResponseEntity.status(CREATED).body(usuarioRepository.save(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioInterno> atualizar(
            @PathVariable Long id,
            @RequestBody UsuarioInterno dados
    ) {
        UsuarioInterno usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuário não encontrado."));

        String emailNovo = normalizarEmail(dados.getEmail());

        if (!emailNovo.isBlank() && !emailNovo.equals(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(emailNovo)) {
                throw new ResponseStatusException(CONFLICT, "Já existe um usuário com este e-mail.");
            }

            usuario.setEmail(emailNovo);
        }

        if (dados.getNome() != null) {
            usuario.setNome(dados.getNome());
        }

        if (dados.getSenha() != null && !dados.getSenha().isBlank()) {
            usuario.setSenha(dados.getSenha());
        }

        if (dados.getPerfil() != null) {
            usuario.setPerfil(dados.getPerfil());
        }

        if (dados.getAtivo() != null) {
            usuario.setAtivo(dados.getAtivo());
        }

        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        UsuarioInterno usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuário não encontrado."));

        usuario.setAtivo(false);
        usuarioRepository.save(usuario);

        return ResponseEntity.noContent().build();
    }

    private String normalizarEmail(String email) {
        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }
}