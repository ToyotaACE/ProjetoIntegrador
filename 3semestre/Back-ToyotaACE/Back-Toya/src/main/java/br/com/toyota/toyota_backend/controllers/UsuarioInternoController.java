package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.UsuarioInternoLoginRequest;
import br.com.toyota.toyota_backend.models.PerfilUsuario;
import br.com.toyota.toyota_backend.models.UsuarioInterno;
import br.com.toyota.toyota_backend.repositories.UsuarioInternoRepository;
import br.com.toyota.toyota_backend.services.TentativasLoginService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    public UsuarioInternoController(
            UsuarioInternoRepository usuarioRepository,
            TentativasLoginService tentativasLoginService,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.tentativasLoginService = tentativasLoginService;
        this.passwordEncoder = passwordEncoder;
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

        boolean senhaValida = usuario != null && senhaConfere(usuario, senha);

        if (!senhaValida) {
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

        if (dados.getSenha() == null || dados.getSenha().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Senha é obrigatória.");
        }

        // Segurança: senha gravada com hash BCrypt
        usuario.setSenha(passwordEncoder.encode(dados.getSenha()));
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
            // Segurança: senha gravada com hash BCrypt
            usuario.setSenha(passwordEncoder.encode(dados.getSenha()));
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

    /**
     * Confere a senha com BCrypt. Senhas antigas, gravadas em texto puro antes desta
     * correção, são aceitas uma única vez e convertidas para BCrypt no mesmo login.
     * Um valor que já é hash nunca é comparado como texto, para que o próprio hash
     * não funcione como senha caso o banco vaze.
     */
    private boolean senhaConfere(UsuarioInterno usuario, String senhaDigitada) {
        String armazenada = usuario.getSenha();

        if (armazenada == null || senhaDigitada.isEmpty()) {
            return false;
        }

        if (ehHashBcrypt(armazenada)) {
            return passwordEncoder.matches(senhaDigitada, armazenada);
        }

        if (armazenada.equals(senhaDigitada)) {
            usuario.setSenha(passwordEncoder.encode(senhaDigitada));
            usuarioRepository.save(usuario);
            return true;
        }

        return false;
    }

    static boolean ehHashBcrypt(String valor) {
        return valor != null && valor.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    }

    private String normalizarEmail(String email) {
        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }
}