export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";

export type Cliente = {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
};

export type Veiculo = {
  id?: number;

  modeloVeiculo?: string;
  marcaVeiculo?: string;
  anoVeiculo?: string;
  corVeiculo?: string;
  placaVeiculo?: string;
  chassiVeiculo?: string;
  motorVeiculo?: string;
  combustivelVeiculo?: string;
  cambioVeiculo?: string;
  fotoCarroUrl?: string;
  statusVeiculo?: string;
  progressoVeiculo?: number;

  valorTotal?: number;
  valorEntrada?: number;
  valorFinanciado?: number;
  parcelasTotais?: number;
  parcelasPagas?: number;
  parcelasRestantes?: number;
  valorParcela?: number;
  taxaJuros?: number;
  statusFinanciamento?: string;
  statusGarantia?: string;
  dataProximaRevisao?: string;

  acessorios?: string;
  vinIot?: string;
};

export type Compra = {
  id?: number;
  produto: string;
  quantidade: number;
  preco: number;
  total: number;
  metodoPagamento: string;
  statusPedido?: string;
  dataCompra?: string;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type CadastroRequest = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
};

export type AgendamentoRequest = {
  clienteId?: number;
  email?: string;
  data: string;
  horario: string;
  tipoServico: string;
  observacao?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Não foi possível conectar ao servidor.";

    try {
      const data = await response.json();
      message = data?.message || data?.erro || data?.error || message;
    } catch {
      try {
        message = await response.text();
      } catch {}
    }

    throw new Error(message || `Erro ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  login: (dados: LoginRequest) =>
    request<Cliente>("/clientes/login", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  cadastrar: (dados: CadastroRequest) =>
    request<Cliente>("/clientes/cadastro", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  buscarClientePorEmail: (email: string) =>
    request<Cliente>(`/clientes/${encodeURIComponent(email)}`),

  atualizarCliente: (id: number, dados: Partial<Cliente>) =>
    request<Cliente>(`/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  atualizarVeiculo: (veiculoId: number, dados: Partial<Veiculo>) =>
    request<Veiculo>(`/veiculos/${veiculoId}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  listarVeiculosCliente: (clienteId: number) =>
    request<Veiculo[]>(`/veiculos/cliente/${clienteId}`),

  buscarVeiculo: (veiculoId: number) =>
    request<Veiculo>(`/veiculos/${veiculoId}`),

  criarCompra: (dados: {
    clienteId: number;
    produto: string;
    quantidade: number;
    preco: number;
    total: number;
    metodoPagamento: string;
  }) =>
    request<Compra>("/compras", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  listarComprasCliente: (clienteId: number) =>
    request<Compra[]>(`/compras/cliente/${clienteId}`),

  limparComprasCliente: (clienteId: number) =>
    request<void>(`/compras/cliente/${clienteId}`, {
      method: "DELETE",
    }),
    
  agendar: (dados: AgendamentoRequest) =>
    request("/agendamentos", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  buscarAgendamentosCliente: (clienteId: number) =>
    request(`/agendamentos/cliente/${clienteId}`),

  listarAgendamentos: (clienteId: number) =>
    request(`/agendamentos/cliente/${clienteId}`),

  listarTodosAgendamentos: () =>
    request("/agendamentos"),

  deletarAgendamento: (id: number) =>
    request(`/agendamentos/${id}`, {
      method: "DELETE",
    }),
};

export const getAcompanhamento = api.buscarClientePorEmail;