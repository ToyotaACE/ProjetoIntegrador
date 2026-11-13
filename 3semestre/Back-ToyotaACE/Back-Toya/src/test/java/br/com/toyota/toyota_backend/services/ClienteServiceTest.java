package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.repositories.AgendamentoRepository;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.repositories.ClienteSessionRepository;
import br.com.toyota.toyota_backend.repositories.CompraRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {
    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private VeiculoRepository veiculoRepository;

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private CompraRepository compraRepository;

    @Mock
    private ClienteSessionRepository clienteSessionRepository;

    @Mock
    private MqttPedidoSimulatorService mqttPedidoSimulatorService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private VehicleDocumentService vehicleDocumentService;

    @InjectMocks
    private ClienteService clienteService;

    @Test
    void deletarRemoveDadosRelacionadosAntesDoCliente() {
        long clienteId = 42L;
        Veiculo veiculo = new Veiculo();
        veiculo.setId(7L);
        Cliente cliente = new Cliente();
        cliente.setId(clienteId);
        cliente.setVeiculos(List.of(veiculo));
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));

        clienteService.deletar(clienteId);

        InOrder deletionOrder = inOrder(
                agendamentoRepository,
                compraRepository,
                clienteSessionRepository,
                vehicleDocumentService,
                clienteRepository
        );
        deletionOrder.verify(agendamentoRepository).deleteByClienteId(clienteId);
        deletionOrder.verify(compraRepository).deleteByClienteId(clienteId);
        deletionOrder.verify(clienteSessionRepository).deleteByClienteId(clienteId);
        deletionOrder.verify(vehicleDocumentService).excluirTodosDoVeiculo(7L);
        deletionOrder.verify(clienteRepository).delete(cliente);
    }
}
