package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.CompraRequest;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.models.Compra;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.repositories.CompraRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/compras")
@CrossOrigin(origins = "*")
public class CompraController {

    private final CompraRepository compraRepository;
    private final ClienteRepository clienteRepository;

    public CompraController(
            CompraRepository compraRepository,
            ClienteRepository clienteRepository
    ) {
        this.compraRepository = compraRepository;
        this.clienteRepository = clienteRepository;
    }

    @PostMapping
    public ResponseEntity<Compra> criarCompra(
            @RequestBody CompraRequest request
    ) {

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        Compra compra = new Compra();

        compra.setCliente(cliente);
        compra.setProduto(request.getProduto());
        compra.setQuantidade(request.getQuantidade());
        compra.setPreco(request.getPreco());
        compra.setTotal(request.getTotal());
        compra.setMetodoPagamento(request.getMetodoPagamento());

        compra.setStatusPedido("PROCESSANDO");
        compra.setDataCompra(LocalDateTime.now());

        return ResponseEntity.ok(
                compraRepository.save(compra)
        );
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Compra>> listarComprasCliente(
            @PathVariable Long clienteId
    ) {
        return ResponseEntity.ok(
                compraRepository.findByClienteId(clienteId)
        );
    }
    @DeleteMapping("/cliente/{clienteId}")
    public ResponseEntity<Void> limparHistoricoCliente(@PathVariable Long clienteId) {
        List<Compra> compras = compraRepository.findByClienteId(clienteId);

        compraRepository.deleteAll(compras);

        return ResponseEntity.noContent().build();
    }
}