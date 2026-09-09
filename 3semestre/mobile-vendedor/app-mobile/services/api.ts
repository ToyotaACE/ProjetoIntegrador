const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";
/*
  IMPORTANTE:

  Se estiver rodando no Expo Web ou emulador que acessa o localhost,
  pode manter:

  Se estiver rodando no celular físico pelo Expo Go,
  troque localhost pelo IP da sua máquina na mesma rede.

  Exemplo:
  const API_BASE_URL = "http://192.168.0.15:8083/api";
*/

type RequestOptions = RequestInit & {
  body?: BodyInit | null;
};

async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ${response.status}`;

    try {
      const errorText = await response.text();

      if (errorText) {
        errorMessage = errorText;
      }
    } catch {
      errorMessage = `Erro ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => {
    return apiFetch<T>(path, {
      method: "GET",
    });
  },

  post: <T>(path: string, body: unknown) => {
    return apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put: <T>(path: string, body: unknown) => {
    return apiFetch<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete: <T>(path: string) => {
    return apiFetch<T>(path, {
      method: "DELETE",
    });
  },
};

export const endpoints = {
  clientes: "/clientes",
  cadastroCliente: "/clientes/cadastro",
  loginCliente: "/clientes/login",

  veiculos: "/veiculos",
  veiculosPorCliente: (clienteId: number | string) =>
    `/veiculos/cliente/${clienteId}`,
  veiculoPorId: (veiculoId: number | string) => `/veiculos/${veiculoId}`,

  agendamentos: "/agendamentos",
  agendamentosPorCliente: (clienteId: number | string) =>
    `/agendamentos/cliente/${clienteId}`,
  agendamentoPorId: (agendamentoId: number | string) =>
    `/agendamentos/${agendamentoId}`,

  usuarios: "/usuarios",
  loginUsuario: "/usuarios/login",
  usuarioPorId: (usuarioId: number | string) => `/usuarios/${usuarioId}`,
};

export default api;