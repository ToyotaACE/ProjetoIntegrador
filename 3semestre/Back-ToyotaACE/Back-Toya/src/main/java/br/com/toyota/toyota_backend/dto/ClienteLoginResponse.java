package br.com.toyota.toyota_backend.dto;

import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.models.Veiculo;

import java.util.List;

public record ClienteLoginResponse(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        String endereco,
        List<Veiculo> veiculos,
        String accessToken
) {
    public static ClienteLoginResponse from(Cliente cliente, String accessToken) {
        return new ClienteLoginResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getCpf(),
                cliente.getTelefone(),
                cliente.getEndereco(),
                cliente.getVeiculos(),
                accessToken
        );
    }
}
