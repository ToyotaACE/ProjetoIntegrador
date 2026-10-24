package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.LoginRequest;
import br.com.toyota.toyota_backend.dto.ClienteLoginResponse;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.services.ClienteSessionService;
import br.com.toyota.toyota_backend.services.ClienteService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/clientes", "/api/acompanhamento"})
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteRepository clienteRepository;

    private final ClienteService clienteService;
    private final ClienteSessionService clienteSessionService;

    public ClienteController(
            ClienteRepository clienteRepository,
            ClienteService clienteService,
            ClienteSessionService clienteSessionService
    ) {
        this.clienteRepository = clienteRepository;
        this.clienteService = clienteService;
        this.clienteSessionService = clienteSessionService;
    }

    @PostMapping({"/cadastro", "/cadastrar"})
    public ResponseEntity<Cliente> cadastrar(
            @RequestBody Cliente cliente
    ) {
        return ResponseEntity.ok(
                clienteService.cadastrar(cliente)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ClienteLoginResponse> login(
            @RequestBody LoginRequest dadosLogin
    ) {
        Cliente cliente = clienteService.login(dadosLogin.getEmail(), dadosLogin.getSenha());
        return ResponseEntity.ok(ClienteLoginResponse.from(
                cliente,
                clienteSessionService.criarToken(cliente.getId())
        ));
    }

    @GetMapping
    public ResponseEntity<List<Cliente>> listar() {
        return ResponseEntity.ok(
                clienteRepository.findAll()
        );
    }

    @GetMapping("/{email}")
    public ResponseEntity<Cliente> buscarPorEmail(
            @PathVariable String email
    ) {
        return ResponseEntity.ok(
                clienteService.buscarPorEmail(email)
        );
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<Cliente> buscarPorId(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                clienteService.buscarPorId(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizar(
            @PathVariable Long id,
            @RequestBody Cliente dados
    ) {
        return ResponseEntity.ok(
                clienteService.atualizar(id, dados)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id
    ) {
        clienteService.deletar(id);

        return ResponseEntity.noContent().build();
    }
}