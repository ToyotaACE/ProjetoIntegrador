import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import logoT from "@/assets/logoT.png";

const RegisterPage = () => {
  const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cpfLimpo = cpf.trim();
    const emailLimpo = email.trim();

    if (!nome.trim() || !cpfLimpo || !emailLimpo || !password || !confirmPassword) {
      setError("Preencha nome, CPF, email e senha.");
      return;
    }

    if (!/^\d{11}$/.test(cpfLimpo)) {
      setError("O CPF deve conter exatamente 11 números.");
      return;
    }

    if (!senhaForte.test(password)) {
      setError("A senha deve ter 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await register({ nome: nome.trim(), cpf: cpfLimpo, telefone, email: emailLimpo, senha: password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[url('https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png')] bg-center bg-cover flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in backdrop-blur-xl bg-white/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-1">
            <img src={logoT} alt="Toyota Logo" className="w-24 h-24 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
          <CardDescription className="text-white">Cadastre-se para acompanhar seu veículo</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Nome</Label>
              <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-white">CPF</Label>
              <Input
                placeholder="00000000000"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => {
                  const cpfDigitado = e.target.value.replace(/\D/g, "");
                  setCpf(cpfDigitado);
                  setError(cpfDigitado.length > 11 ? "O CPF deve conter exatamente 11 números." : "");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Telefone</Label>
              <Input placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-white/80">
                Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Confirmar Senha</Label>
              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-200 bg-red-950/40 border border-red-300/30 rounded-md px-3 py-2 text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>

            <p className="text-center text-white text-sm">
              Já tem conta? <Link to="/login" className="hover:underline font-medium">Entrar</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
