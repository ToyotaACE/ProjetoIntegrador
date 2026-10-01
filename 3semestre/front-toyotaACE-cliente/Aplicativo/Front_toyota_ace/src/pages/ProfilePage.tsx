import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Cliente } from "@/services/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  User,
  Mail,
  CreditCard,
  Phone,
  ShoppingBag,
  Trash2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { toast } from "sonner";

type PurchaseItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type Purchase = {
  id: number;
  date: string;
  items: PurchaseItem[];
  total: number;
  paymentMethod: string;
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();

  const [dadosBanco, setDadosBanco] = useState<Cliente | null>(user);
  const [erro, setErro] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    endereco: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    async function carregarDados() {
      if (!user?.email) return;

      try {
        const resultado = await api.buscarClientePorEmail(user.email);
        setDadosBanco(resultado);
        setUser(resultado);

        setForm({
          nome: resultado.nome || "",
          cpf: resultado.cpf || "",
          telefone: resultado.telefone || "",
          endereco: resultado.endereco || "",
        });
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao buscar perfil.");
      }
    }

    carregarDados();
  }, [setUser, user?.email]);

  useEffect(() => {
    carregarCompras();
  }, [user?.id]);

  const carregarCompras = async () => {
    if (!user?.id) return;

    try {
      const compras = await api.listarComprasCliente(user.id);

      const formatadas = compras.map((compra) => ({
        id: compra.id || 0,
        date: compra.dataCompra
          ? new Date(compra.dataCompra).toLocaleDateString("pt-BR")
          : "",
        total: compra.total,
        paymentMethod: compra.metodoPagamento,
        items: [
          {
            id: compra.id || 0,
            name: compra.produto,
            quantity: compra.quantidade,
            price: compra.preco,
          },
        ],
      }));

      setPurchases(formatadas);
    } catch (error) {
      console.error(error);
    }
  };

  const limparHistorico = async () => {
    if (!user?.id) return;

    try {
      await api.limparComprasCliente(user.id);
      setPurchases([]);
      toast.success("Histórico de compras apagado.");
    } catch (error) {
      toast.error("Erro ao limpar histórico.");
    }
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const paymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: "Pix",
      credito: "Cartão de crédito",
      debito: "Cartão de débito",
      boleto: "Boleto",
    };

    return labels[method] || method;
  };

  const salvarPerfil = async () => {
    if (!dadosBanco?.id) {
      toast.error("Cliente inválido.");
      return;
    }

    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Preencha nome e telefone.");
      return;
    }

    try {
      setLoading(true);

      const atualizado = await api.atualizarCliente(dadosBanco.id, {
        nome: form.nome,
        cpf: form.cpf,
        telefone: form.telefone,
        endereco: form.endereco,
      });

      setDadosBanco(atualizado);
      setUser(atualizado);

      toast.success("Perfil atualizado!");
      setEditOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil."
      );
    } finally {
      setLoading(false);
    }
  };

  const alterarSenha = async () => {
    if (!dadosBanco?.id) {
      toast.error("Cliente inválido.");
      return;
    }

    if (!passwordForm.senhaAtual || !passwordForm.novaSenha) {
      toast.error("Preencha a senha atual e a nova senha.");
      return;
    }

    if (passwordForm.senhaAtual !== dadosBanco.senha) {
      toast.error("Senha atual incorreta.");
      return;
    }

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (passwordForm.novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const atualizado = await api.atualizarCliente(dadosBanco.id, {
        senha: passwordForm.novaSenha,
      });

      setDadosBanco(atualizado);
      setUser(atualizado);

      setPasswordForm({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });

      toast.success("Senha alterada com sucesso!");
      setPasswordOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar senha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Perfil do Cliente
              </h1>

              <p className="text-gray-500 mt-2">
                Gerencie suas informações pessoais e segurança da conta.
              </p>

              {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setEditOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Editar Perfil
              </Button>

              <Button variant="outline" onClick={() => setPasswordOpen(true)}>
                Alterar Senha
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Dados Pessoais</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Info
                    icon={<User className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                    label="Nome"
                    value={dadosBanco?.nome}
                  />

                  <Info
                    icon={<Mail className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                    label="Email"
                    value={dadosBanco?.email}
                  />

                  <Info
                    icon={<CreditCard className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                    label="CPF"
                    value={dadosBanco?.cpf}
                  />

                  <Info
                    icon={<Phone className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                    label="Telefone"
                    value={dadosBanco?.telefone}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Segurança da Conta</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-800/40 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-1" />

                  <div>
                    <p className="font-semibold text-green-600">
                      Conta protegida
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Seu acesso está ativo e protegido por senha.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-800/40 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-zinc-700 dark:text-zinc-300 mt-1" />

                  <div>
                    <p className="font-semibold">Senha de acesso</p>

                    <p className="text-sm text-gray-500 mt-1">
                      Altere sua senha periodicamente para manter sua conta
                      segura.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setPasswordOpen(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Alterar senha
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                  Compras Toyota Shop
                </CardTitle>

                {purchases.length > 0 && (
                  <Button variant="outline" size="sm" onClick={limparHistorico}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar histórico
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />

                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Nenhuma compra realizada
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Explore acessórios e produtos exclusivos Toyota.
                  </p>

                  <Button
                    onClick={() => (window.location.href = "/shop")}
                    className="mt-6 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Ir para Toyota Shop
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="rounded-xl border p-5 hover:border-zinc-400 transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold">
                            Pedido #{purchase.id}
                          </p>

                          <p className="text-sm text-gray-500">
                            {purchase.date}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {formatPrice(purchase.total)}
                          </p>

                          <p className="text-sm text-gray-500">
                            {paymentLabel(purchase.paymentMethod)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {purchase.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>

                            <span className="font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) =>
                  setForm({ ...form, endereco: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={salvarPerfil} disabled={loading}>
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Informe sua senha atual e escolha uma nova senha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={passwordForm.senhaAtual}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    senhaAtual: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={passwordForm.novaSenha}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    novaSenha: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={passwordForm.confirmarSenha}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmarSenha: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={alterarSenha} disabled={loading}>
              {loading ? "Alterando..." : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="pt-1">{icon}</div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {value || "Não informado"}
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;