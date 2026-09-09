import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

type User = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  veiculos?: any[];
};

type AuthContextType = {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  user: User | null;
  loadingAuth: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const carregarUsuarioSalvo = async () => {
      try {
        const userSalvo = await AsyncStorage.getItem("@toyota_ace:user");

        if (userSalvo) {
          const userParseado = JSON.parse(userSalvo);

          setUser(userParseado);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("Erro ao carregar usuário salvo:", error);
      } finally {
        setLoadingAuth(false);
      }
    };

    carregarUsuarioSalvo();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/clientes/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha: password,
      }),
    });

    if (!response.ok) {
      setIsAuthenticated(false);
      setUser(null);
      await AsyncStorage.removeItem("@toyota_ace:user");
      throw new Error("E-mail ou senha inválidos.");
    }

    const data: User = await response.json();

    setUser(data);
    setIsAuthenticated(true);

    await AsyncStorage.setItem("@toyota_ace:user", JSON.stringify(data));

    return data;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    await AsyncStorage.removeItem("@toyota_ace:user");
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        user,
        loadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }

  return context;
};