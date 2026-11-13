import Constants from "expo-constants";
import { Platform } from "react-native";

const expoHost = Constants.expoConfig?.hostUri;
const developmentHost = expoHost
  ? new URL(`http://${expoHost}`).hostname
  : null;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS !== "web" && developmentHost
    ? `http://${developmentHost}:8083/api`
    : "http://localhost:8083/api");

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