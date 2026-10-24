import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { api, Cliente } from "@/services/api";

interface AuthContextType {
  user: Cliente | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Cliente | null) => void;
  accessToken: string | null;
  login: (email: string, senha: string) => Promise<Cliente>;
  register: (dados: { nome: string; email: string; senha: string; cpf?: string; telefone?: string; endereco?: string }) => Promise<Cliente>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "toyota-auth";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<Cliente | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedUser = JSON.parse(saved);
        userRef.current = savedUser;
        setUserState(savedUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = useCallback((userData: Cliente | null) => {
    if (!userData) {
      userRef.current = null;
      setUserState(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const currentUser = userRef.current;
    const sameUser = !!currentUser && (
      (userData.id !== undefined && userData.id === currentUser.id) ||
      userData.email === currentUser.email
    );
    const nextUser = sameUser && !userData.accessToken
      ? { ...userData, accessToken: currentUser.accessToken }
      : userData;
    userRef.current = nextUser;
    setUserState(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const cliente = await api.login({ email, senha });
    setUser(cliente);
    return cliente;
  }, [setUser]);

  const register = useCallback(async (dados: { nome: string; email: string; senha: string; cpf?: string; telefone?: string; endereco?: string }) => {
    await api.cadastrar(dados);
    const cliente = await api.login({ email: dados.email, senha: dados.senha });
    setUser(cliente);
    return cliente;
  }, [setUser]);

  const refreshUser = useCallback(async () => {
    if (!user?.email) return;
    const clienteAtualizado = await api.buscarClientePorEmail(user.email);
    setUser(clienteAtualizado);
  }, [setUser, user?.email]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, accessToken: user?.accessToken || null, isAuthenticated: !!user?.accessToken, isLoading, setUser, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
