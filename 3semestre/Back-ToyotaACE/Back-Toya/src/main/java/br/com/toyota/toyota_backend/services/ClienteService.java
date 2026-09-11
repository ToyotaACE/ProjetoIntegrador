package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.dto.FinanciamentoRequest;
import br.com.toyota.toyota_backend.dto.VeiculoRequest;
import br.com.toyota.toyota_backend.models.Cliente;
import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ClienteService {

    // ============================================================
    // REPOSITÓRIOS E SERVIÇOS UTILIZADOS
    // ============================================================

    private final MqttPedidoSimulatorService mqttPedidoSimulatorService;
    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final PasswordEncoder passwordEncoder;

    // ============================================================
    // VALIDAÇÃO DO E-MAIL
    // ============================================================

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
    );

    // ============================================================
    // VALIDAÇÃO DA SENHA
    // ============================================================

    private static final Pattern SENHA_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$"
    );

    // ============================================================
    // CONSTRUTOR
    // ============================================================

    public ClienteService(
            ClienteRepository clienteRepository,
            VeiculoRepository veiculoRepository,
            MqttPedidoSimulatorService mqttPedidoSimulatorService,
            PasswordEncoder passwordEncoder
    ) {
        this.clienteRepository = clienteRepository;
        this.veiculoRepository = veiculoRepository;
        this.mqttPedidoSimulatorService = mqttPedidoSimulatorService;
        this.passwordEncoder = passwordEncoder;
    }

    // ============================================================
    // BUSCAR CLIENTE POR ID
    // ============================================================

    public Cliente buscarPorId(Long id) {

        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cliente não encontrado"
                ));
    }

    // ============================================================
    // BUSCAR CLIENTE POR E-MAIL
    // ============================================================

    public Cliente buscarPorEmail(String email) {

        return clienteRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cliente não encontrado"
                ));
    }

    // ============================================================
    // CADASTRAR NOVO CLIENTE
    // ============================================================

    public Cliente cadastrar(Cliente cliente) {

        // ========================================================
        // 1. VALIDAÇÃO DO E-MAIL
        // ========================================================

        if (cliente.getEmail() == null || cliente.getEmail().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "E-mail é obrigatório"
            );
        }

        String email = cliente.getEmail().trim();

        if (!EMAIL_PATTERN.matcher(email).matches()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "E-mail inválido. Informe um e-mail válido, como exemplo@email.com"
            );
        }

        cliente.setEmail(email);

        // ========================================================
        // 2. VERIFICAR E-MAIL DUPLICADO
        // ========================================================

        if (clienteRepository.existsByEmail(email)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "E-mail já cadastrado"
            );
        }

        // ========================================================
        // 3. VALIDAÇÃO DO CPF
        // ========================================================

        if (cliente.getCpf() == null || cliente.getCpf().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CPF é obrigatório"
            );
        }

        String cpf = cliente.getCpf().trim();

        // ========================================================
        // 4. VALIDAR FORMATO DO CPF
        // ========================================================

        if (!cpf.matches("\\d{11}")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CPF deve conter exatamente 11 números, sem pontos, hífen ou letras"
            );
        }

        cliente.setCpf(cpf);

        // ========================================================
        // 5. VERIFICAR CPF DUPLICADO
        // ========================================================

        if (clienteRepository.existsByCpf(cpf)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "CPF já cadastrado"
            );
        }

        // ========================================================
        // 6. VALIDAÇÃO DA SENHA
        // ========================================================

        if (cliente.getSenha() == null || cliente.getSenha().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Senha é obrigatória"
            );
        }

        // ========================================================
        // 7. VERIFICAR FORÇA DA SENHA
        // ========================================================

        if (!SENHA_PATTERN.matcher(cliente.getSenha()).matches()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve ter no mínimo 8 caracteres, contendo letra maiúscula, letra minúscula, número e caractere especial"
            );
        }

        cliente.setSenha(passwordEncoder.encode(cliente.getSenha()));

        return clienteRepository.save(cliente);
    }

    // ============================================================
    // LOGIN DO CLIENTE
    // ============================================================

    public Cliente login(String email, String senha) {

        if (email == null || email.isBlank()
                || senha == null || senha.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "E-mail e senha são obrigatórios"
            );
        }

        Cliente cliente = buscarPorEmail(email);

        boolean senhaValida = passwordEncoder.matches(senha, cliente.getSenha());

        // Converte senhas antigas em texto puro no primeiro login válido.
        if (!senhaValida && cliente.getSenha().equals(senha)) {
            senhaValida = true;
            cliente.setSenha(passwordEncoder.encode(senha));
            clienteRepository.save(cliente);
        }

        if (!senhaValida) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "E-mail ou senha incorretos"
            );
        }

        return cliente;
    }

    // ============================================================
    // ATUALIZAR DADOS DO CLIENTE
    // ============================================================

    public Cliente atualizar(Long id, Cliente dados) {

        Cliente cliente = buscarPorId(id);

        if (dados.getNome() != null)
            cliente.setNome(dados.getNome());

        if (dados.getEmail() != null)
            cliente.setEmail(dados.getEmail());

        if (dados.getSenha() != null && !dados.getSenha().isBlank()) {
            if (!SENHA_PATTERN.matcher(dados.getSenha()).matches()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A senha deve ter no mínimo 8 caracteres, contendo letra maiúscula, letra minúscula, número e caractere especial"
                );
            }
            cliente.setSenha(passwordEncoder.encode(dados.getSenha()));
        }

        if (dados.getCpf() != null)
            cliente.setCpf(dados.getCpf());

        if (dados.getTelefone() != null)
            cliente.setTelefone(dados.getTelefone());

        if (dados.getEndereco() != null)
            cliente.setEndereco(dados.getEndereco());

        return clienteRepository.save(cliente);
    }

    // ============================================================
    // LISTAR VEÍCULOS DO CLIENTE
    // ============================================================

    public List<Veiculo> listarVeiculosCliente(Long clienteId) {

        buscarPorId(clienteId);

        return veiculoRepository.findByClienteId(clienteId);
    }

    // ============================================================
    // BUSCAR VEÍCULO POR ID
    // ============================================================

    public Veiculo buscarVeiculoPorId(Long id) {

        return veiculoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Veículo não encontrado"
                ));
    }

    // ============================================================
    // CADASTRAR VEÍCULO
    // ============================================================

    public Veiculo cadastrarVeiculo(VeiculoRequest dados) {

        Cliente cliente = buscarPorId(dados.getClienteId());

        Veiculo veiculo = new Veiculo();

        preencherDadosVeiculo(veiculo, dados);

        veiculo.setCliente(cliente);

        Veiculo salvo = veiculoRepository.save(veiculo);

        mqttPedidoSimulatorService.iniciarFluxo(salvo);

        return salvo;
    }

    // ============================================================
    // ATUALIZAR VEÍCULO
    // ============================================================

    public Veiculo atualizarVeiculoNovo(Long id, VeiculoRequest dados) {

        Veiculo veiculo = buscarVeiculoPorId(id);

        preencherDadosVeiculo(veiculo, dados);

        return veiculoRepository.save(veiculo);
    }

    // ============================================================
    // DELETAR VEÍCULO
    // ============================================================

    public void deletarVeiculo(Long id) {

        Veiculo veiculo = buscarVeiculoPorId(id);

        veiculoRepository.delete(veiculo);
    }

    // ============================================================
    // ATUALIZAR / CADASTRAR VEÍCULO PARA CLIENTE
    // ============================================================

    public Cliente atualizarVeiculo(Long id, VeiculoRequest dados) {

        Cliente cliente = buscarPorId(id);

        Veiculo veiculo = new Veiculo();

        preencherDadosVeiculo(veiculo, dados);

        veiculo.setCliente(cliente);

        veiculoRepository.save(veiculo);

        return cliente;
    }

    // ============================================================
    // ATUALIZAR FINANCIAMENTO
    // ============================================================

    public Cliente atualizarFinanciamento(
            Long id,
            FinanciamentoRequest dados
    ) {

        Cliente cliente = buscarPorId(id);

        if (!cliente.getVeiculos().isEmpty()) {

            Veiculo veiculo = cliente.getVeiculos()
                    .get(cliente.getVeiculos().size() - 1);

            if (dados.getValorTotal() != null)
                veiculo.setValorTotal(dados.getValorTotal());

            if (dados.getValorEntrada() != null)
                veiculo.setValorEntrada(dados.getValorEntrada());

            if (dados.getValorFinanciado() != null)
                veiculo.setValorFinanciado(dados.getValorFinanciado());

            if (dados.getParcelasTotais() != null)
                veiculo.setParcelasTotais(dados.getParcelasTotais());

            if (dados.getParcelasPagas() != null)
                veiculo.setParcelasPagas(dados.getParcelasPagas());

            if (dados.getParcelasRestantes() != null)
                veiculo.setParcelasRestantes(dados.getParcelasRestantes());

            if (dados.getValorParcela() != null)
                veiculo.setValorParcela(dados.getValorParcela());

            if (dados.getTaxaJuros() != null)
                veiculo.setTaxaJuros(dados.getTaxaJuros());

            if (dados.getStatusFinanciamento() != null)
                veiculo.setStatusFinanciamento(
                        dados.getStatusFinanciamento()
                );

            if (dados.getStatusGarantia() != null)
                veiculo.setStatusGarantia(
                        dados.getStatusGarantia()
                );

            if (dados.getDataProximaRevisao() != null)
                veiculo.setDataProximaRevisao(
                        dados.getDataProximaRevisao()
                );

            veiculoRepository.save(veiculo);
        }

        return cliente;
    }

    // ============================================================
    // PREENCHER DADOS DO VEÍCULO
    // ============================================================

    private void preencherDadosVeiculo(
            Veiculo veiculo,
            VeiculoRequest dados
    ) {

        // ========================================================
        // DADOS BÁSICOS DO VEÍCULO
        // ========================================================

        if (dados.getModeloVeiculo() != null)
            veiculo.setModeloVeiculo(dados.getModeloVeiculo());

        if (dados.getMarcaVeiculo() != null)
            veiculo.setMarcaVeiculo(dados.getMarcaVeiculo());

        if (dados.getAnoVeiculo() != null)
            veiculo.setAnoVeiculo(dados.getAnoVeiculo());

        if (dados.getCorVeiculo() != null)
            veiculo.setCorVeiculo(dados.getCorVeiculo());

        if (dados.getPlacaVeiculo() != null)
            veiculo.setPlacaVeiculo(dados.getPlacaVeiculo());

        // ========================================================
        // GERAÇÃO AUTOMÁTICA DO CHASSI
        // ========================================================

        if (veiculo.getChassiVeiculo() == null
                || veiculo.getChassiVeiculo().isBlank()) {

            String chassi;

            do {

                chassi = "9BR" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 14)
                        .toUpperCase();

            } while (veiculoRepository.existsByChassiVeiculo(chassi));

            veiculo.setChassiVeiculo(chassi);
        }

        // ========================================================
        // DADOS MECÂNICOS
        // ========================================================

        if (dados.getMotorVeiculo() != null)
            veiculo.setMotorVeiculo(dados.getMotorVeiculo());

        if (dados.getCombustivelVeiculo() != null)
            veiculo.setCombustivelVeiculo(
                    dados.getCombustivelVeiculo()
            );

        if (dados.getCambioVeiculo() != null)
            veiculo.setCambioVeiculo(
                    dados.getCambioVeiculo()
            );

        // ========================================================
        // FOTO E STATUS DO VEÍCULO
        // ========================================================

        if (dados.getFotoCarroUrl() != null)
            veiculo.setFotoCarroUrl(
                    dados.getFotoCarroUrl()
            );

        if (dados.getStatusVeiculo() != null)
            veiculo.setStatusVeiculo(
                    dados.getStatusVeiculo()
            );

        if (dados.getProgressoVeiculo() != null)
            veiculo.setProgressoVeiculo(
                    dados.getProgressoVeiculo()
            );

        // ========================================================
        // DADOS FINANCEIROS DO VEÍCULO
        // ========================================================

        if (dados.getValorTotal() != null)
            veiculo.setValorTotal(dados.getValorTotal());

        if (dados.getValorEntrada() != null)
            veiculo.setValorEntrada(dados.getValorEntrada());

        if (dados.getValorFinanciado() != null)
            veiculo.setValorFinanciado(dados.getValorFinanciado());

        if (dados.getParcelasTotais() != null)
            veiculo.setParcelasTotais(dados.getParcelasTotais());

        if (dados.getParcelasPagas() != null)
            veiculo.setParcelasPagas(dados.getParcelasPagas());

        if (dados.getParcelasRestantes() != null)
            veiculo.setParcelasRestantes(dados.getParcelasRestantes());

        if (dados.getValorParcela() != null)
            veiculo.setValorParcela(dados.getValorParcela());

        if (dados.getTaxaJuros() != null)
            veiculo.setTaxaJuros(dados.getTaxaJuros());

        // ========================================================
        // STATUS DO FINANCIAMENTO E GARANTIA
        // ========================================================

        if (dados.getStatusFinanciamento() != null)
            veiculo.setStatusFinanciamento(
                    dados.getStatusFinanciamento()
            );

        if (dados.getStatusGarantia() != null)
            veiculo.setStatusGarantia(
                    dados.getStatusGarantia()
            );

        // ========================================================
        // REVISÃO
        // ========================================================

        if (dados.getDataProximaRevisao() != null)
            veiculo.setDataProximaRevisao(
                    dados.getDataProximaRevisao()
            );

        // ========================================================
        // OUTROS DADOS
        // ========================================================

        if (dados.getAcessorios() != null)
            veiculo.setAcessorios(dados.getAcessorios());

        if (dados.getVinIot() != null)
            veiculo.setVinIot(dados.getVinIot());
    }
}