import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Cliente, type Veiculo } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { getNextReviewDate } from "@/lib/vehicleMaintenance";
import {
  Car,
  Calendar,
  CreditCard,
  ShoppingBag,
  Wrench,
  Bell,
  ShieldCheck,
  FileText,
  Route,
} from "lucide-react";
import corolla from "@/assets/corolla.png";
import ramiresMotorsMap from "@/assets/ramires-motors-map.png";

const ramiresMotorsDirectionsUrl =
  "https://www.google.com/maps/dir//Ramires+Motors,+Av.+Darcí+Carvalho+Dafferner,+301+-+Alto+da+Boa+Vista,+Sorocaba+-+SP,+18085-850/@-23.4848256,-47.4382336,14z/data=!4m8!4m7!1m0!1m5!1s0x94cf601c5b2c8405:0x609fd3f1a45f9a9c!2m2!1d-47.4295781!2d-23.4739131?entry=ttu&g_ep=EgoyMDI2MTEyMy4wIKXMDSoASAFQAw%3D%3D";

const fmt = (v?: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(user);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mainVehicleId, setMainVehicleId] = useState<number | null>(null);
  const [nextReviewDate, setNextReviewDate] = useState<Date | null>(null);
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

  useEffect(() => {
    let active = true;
    if (!cliente?.id) {
      setNextReviewDate(null);
      return () => {
        active = false;
      };
    }

    api.buscarAgendamentosCliente(cliente.id)
      .then((appointments) => {
        if (active) setNextReviewDate(getNextReviewDate(appointments));
      })
      .catch((error: unknown) => {
        console.error("Erro ao carregar revisões agendadas:", error);
        if (active) setNextReviewDate(null);
      });

    return () => {
      active = false;
    };
  }, [cliente?.id]);

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
    if (progresso >= 50) return "Auditoria";
    if (progresso >= 33) return "Linha de produção";
    if (progresso >= 16) return "Pedido realizado";
    return "Aguardando atualização";
  }, [progresso]);

  const valorParcela = veiculoPrincipal?.valorParcela ?? 0;
  const parcelasRestantes = veiculoPrincipal?.parcelasRestantes ?? 0;
  const abrirDocumentacao = () => {
    if (!veiculoPrincipal) return;

    const vehicleDetails = {
      marcaVeiculo: veiculoPrincipal.marcaVeiculo,
      modeloVeiculo: veiculoPrincipal.modeloVeiculo,
      anoVeiculo: veiculoPrincipal.anoVeiculo,
      corVeiculo: veiculoPrincipal.corVeiculo,
      motorVeiculo: veiculoPrincipal.motorVeiculo,
      cambioVeiculo: veiculoPrincipal.cambioVeiculo,
      combustivelVeiculo: veiculoPrincipal.combustivelVeiculo,
    };
    const query = new URLSearchParams({
      vehicle: JSON.stringify(vehicleDetails),
      lang: language,
      ...(veiculoPrincipal.id ? { vehicleId: String(veiculoPrincipal.id) } : {}),
    });
    window.open(
      `/documentacao?${query.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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

          <Card className="overflow-hidden bg-white dark:bg-zinc-800 border shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 space-y-6">
                  <div>
                    <p className="text-sm text-red-600 font-semibold dark:text-zinc-300">
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
                      <p className="text-sm text-red-600 mb-2 dark:text-zinc-300">
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
                        {`${progresso}% do progresso`}
                      </span>
                    </div>

                    <Progress value={progresso} className="h-2" />

                    <p className="text-sm font-medium">{etapaAtual}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        veiculoPrincipal?.id &&
                        navigate(`/veiculo/${veiculoPrincipal.id}/timeline`)
                      }
                      className="bg-zinc-900 hover:bg-zinc-800 text-white"
                      disabled={!veiculoPrincipal?.id}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      Progresso de preparação
                    </Button>

                    <Button
                      variant="outline"
                      onClick={abrirDocumentacao}
                      disabled={!veiculoPrincipal}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Documentação
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        veiculoPrincipal?.id &&
                        navigate(
                          `/financiamento?vehicleId=${veiculoPrincipal.id}&abrirPagamento=true`,
                        )
                      }
                      disabled={!veiculoPrincipal?.id}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Ver financiamento
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

          {veiculoPrincipal && (
            <Card id="vehicle-details" className="bg-white dark:bg-zinc-900 border shadow-sm">
              <CardHeader>
                <CardTitle>Ficha técnica</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <VehicleInfo label="Modelo" value={veiculoPrincipal.modeloVeiculo || "Não informado"} />
                <VehicleInfo label="Ano" value={veiculoPrincipal.anoVeiculo || "Não informado"} />
                <VehicleInfo label="Motor" value={veiculoPrincipal.motorVeiculo || "Não informado"} />
                <VehicleInfo label="Cor" value={veiculoPrincipal.corVeiculo || "Não informado"} />
                <VehicleInfo label="Câmbio" value={veiculoPrincipal.cambioVeiculo || "Não informado"} />
                <VehicleInfo label="Combustível" value={veiculoPrincipal.combustivelVeiculo || "Não informado"} />
                <VehicleInfo label="Chassi" value={veiculoPrincipal.chassiVeiculo || "Gerando..."} />
                <VehicleInfo label="Placa" value={veiculoPrincipal.placaVeiculo || "Não informada"} />
                <VehicleInfo
                  label="Próxima revisão"
                  value={
                    nextReviewDate?.toLocaleDateString(language) ||
                    veiculoPrincipal.dataProximaRevisao ||
                    "Não informada"
                  }
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard
              icon={<Car className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Veículos"
              value={`${veiculos.length}`}
              subtitle="veículo(s) vinculado(s)"
              to={veiculoPrincipal ? "/dashboard#vehicle-details" : "/dashboard"}
            />

            <QuickCard
              icon={<CreditCard className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
              title="Próxima parcela"
              value={fmt(valorParcela)}
              subtitle={`${parcelasRestantes} restantes`}
              to={
                veiculoPrincipal?.id
                  ? `/financiamento?vehicleId=${veiculoPrincipal.id}&abrirPagamento=true`
                  : "/financiamento"
              }
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
                  <Link
                    to={
                      veiculoPrincipal?.id
                        ? `/financiamento?vehicleId=${veiculoPrincipal.id}&abrirPagamento=true`
                        : "/financiamento"
                    }
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar parcela
                  </Link>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <Link
                    to={
                      veiculoPrincipal?.id
                        ? `/veiculo/${veiculoPrincipal.id}/timeline`
                        : "/dashboard#vehicle-details"
                    }
                  >
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
              <CardContent className="pt-0">
                <a
                  href={ramiresMotorsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir rota para Ramires Motors no Google Maps"
                  className="block overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img
                    src={ramiresMotorsMap}
                    alt="Mapa da Ramires Motors em Sorocaba"
                    className="w-full max-h-80 object-cover transition-opacity hover:opacity-90"
                  />
                </a>
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

function VehicleInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default DashboardPage;