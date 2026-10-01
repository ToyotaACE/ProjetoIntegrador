import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Cliente, type Veiculo } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Car,
  Calendar,
  CreditCard,
  ShoppingBag,
  Wrench,
  Bell,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import corolla from "@/assets/corolla.png";

const fmt = (v?: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const DashboardPage = () => {
  const { user, setUser } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(user);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mainVehicleId, setMainVehicleId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const clienteBanco = await api.buscarClientePorEmail(user.email);
        setCliente(clienteBanco);
        setUser(clienteBanco);

        if (clienteBanco.id) {
          const listaVeiculos = await api.listarVeiculosCliente(clienteBanco.id);
          setVeiculos(listaVeiculos);

          const savedMainVehicle = localStorage.getItem(
            `toyota_main_vehicle_${clienteBanco.id}`
          );

          if (savedMainVehicle) {
            setMainVehicleId(Number(savedMainVehicle));
          } else if (listaVeiculos.length > 0) {
            setMainVehicleId(listaVeiculos[0].id || null);
          }
        }
      } catch (err) {
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [setUser, user?.email]);

  const nome = cliente?.nome?.split(" ")[0] || "Cliente";

  const veiculoPrincipal = useMemo(() => {
    if (mainVehicleId) {
      const encontrado = veiculos.find((v) => v.id === mainVehicleId);
      if (encontrado) return encontrado;
    }

    return veiculos[0] || null;
  }, [veiculos, mainVehicleId]);

  const definirVeiculoPrincipal = (id?: number) => {
    if (!id || !cliente?.id) return;

    localStorage.setItem(`toyota_main_vehicle_${cliente.id}`, String(id));
    setMainVehicleId(id);
  };

  const progresso = veiculoPrincipal?.progressoVeiculo ?? 0;

  const etapaAtual = useMemo(() => {
    if (progresso >= 100) return "Pronto para retirada";
    if (progresso >= 83) return "Concessionária";
    if (progresso >= 66) return "Transporte";
    if (progresso >= 50) return "Inspeção";
    if (progresso >= 33) return "Linha de produção";
    if (progresso >= 16) return "Pedido realizado";
    return "Aguardando atualização";
  }, [progresso]);

  const valorParcela = veiculoPrincipal?.valorParcela ?? 0;
  const parcelasRestantes = veiculoPrincipal?.parcelasRestantes ?? 0;

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando dashboard...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Olá, {nome} 👋
            </h1>

            <p className="text-gray-500 mt-2">
              Bem-vindo ao seu portal Toyota ACE.
            </p>

            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
          </div>

          <Card className="overflow-hidden bg-white dark:bg-red-600 border shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 space-y-6">
                  <div>
                    <p className="text-sm text-red-600 font-semibold">
                      Veículo principal
                    </p>

                    <h2 className="text-3xl font-bold mt-2">
                      {veiculoPrincipal?.modeloVeiculo ||
                        "Nenhum veículo vinculado"}
                    </h2>

                    <p className="text-gray-500 mt-2">
                      {veiculoPrincipal
                        ? `${veiculoPrincipal.anoVeiculo || "Ano não informado"} · ${
                            veiculoPrincipal.corVeiculo || "Cor não informada"
                          }`
                        : "Quando um veículo for atribuído, ele aparecerá aqui."}
                    </p>
                  </div>

                  {veiculos.length > 1 && (
                    <div>
                      <p className="text-sm text-red-600 mb-2">
                        Escolher veículo principal
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {veiculos.map((veiculo) => {
                          const ativo = veiculo.id === veiculoPrincipal?.id;

                          return (
                            <button
                              key={veiculo.id}
                              onClick={() =>
                                definirVeiculoPrincipal(veiculo.id)
                              }
                              className={`px-3 py-2 rounded-lg border text-sm transition ${
                                ativo
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-border hover:border-red-600"
                              }`}
                            >
                              {veiculo.modeloVeiculo || "Veículo"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Etapa atual</span>
                      <span className="font-medium text-green-600">
                        {progresso}%
                      </span>
                    </div>

                    <Progress value={progresso} className="h-2" />

                    <p className="text-sm font-medium">{etapaAtual}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                      <Link to="/veiculo">
                        Ver veículo
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>

                    <Button asChild variant="outline">
                      <Link to="/financiamento">Ver financiamento</Link>
                    </Button>
                  </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-8">
                  <img
                    src={veiculoPrincipal?.fotoCarroUrl || corolla}
                    alt={veiculoPrincipal?.modeloVeiculo || "Toyota"}
                    className="max-h-80 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard
              icon={<Car className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Veículos"
              value={`${veiculos.length}`}
              subtitle="veículo(s) vinculado(s)"
              to="/veiculo"
            />

            <QuickCard
              icon={<CreditCard className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Próxima parcela"
              value={fmt(valorParcela)}
              subtitle={`${parcelasRestantes} restantes`}
              to="/financiamento"
            />

            <QuickCard
              icon={<Wrench className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Próxima revisão"
              value={veiculoPrincipal?.dataProximaRevisao || "Não informada"}
              subtitle="mantenha sua garantia ativa"
              to="/agendamento"
            />

            <QuickCard
              icon={<ShoppingBag className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Toyota Shop"
              value="Acessórios"
              subtitle="produtos exclusivos Toyota"
              to="/shop"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                  Central de avisos
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <AlertItem
                  title="Acompanhamento do veículo"
                  description={
                    veiculoPrincipal
                      ? `Seu ${veiculoPrincipal.modeloVeiculo} está na etapa: ${etapaAtual}.`
                      : "Nenhum veículo vinculado ao seu cadastro."
                  }
                />

                <AlertItem
                  title="Financiamento"
                  description={
                    parcelasRestantes > 0
                      ? `Você possui ${parcelasRestantes} parcela(s) restante(s).`
                      : "Nenhum financiamento pendente informado."
                  }
                />

                <AlertItem
                  title="Garantia"
                  description={
                    veiculoPrincipal?.statusGarantia
                      ? `Garantia: ${veiculoPrincipal.statusGarantia}.`
                      : "Status de garantia não informado."
                  }
                />
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                  Ações rápidas
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button asChild variant="outline" className="justify-start">
                  <Link to="/agendamento">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar serviço
                  </Link>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <Link to="/financiamento">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar parcela
                  </Link>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <Link to="/veiculo">
                    <Car className="h-4 w-4 mr-2" />
                    Ver timeline
                  </Link>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <Link to="/shop">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Comprar acessórios
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    
    </div>
  );
};

function QuickCard({
  icon,
  title,
  value,
  subtitle,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="bg-white dark:bg-zinc-900 border shadow-sm hover:border-zinc-400 hover:shadow-md transition-all h-full">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {icon}
          </div>

          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function AlertItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-800/40">
      <p className="font-semibold">{title}</p>
      <p className="text-gray-500 mt-1">{description}</p>
    </div>
  );
}

export default DashboardPage;