export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

export type LoginRequest = {
  email: string;
  senha: string;
};

export async function loginVendedor(dados: LoginRequest) {
  const response = await fetch(`${API_URL}/clientes/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error("E-mail ou senha incorretos.");
  }

  return response.json();
}