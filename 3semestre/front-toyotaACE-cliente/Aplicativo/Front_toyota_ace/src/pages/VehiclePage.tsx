import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Circle, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Veiculo } from "@/services/api";

const VehiclePage = () => {
  const { user } = useAuth();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarVeiculos = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const data = await api.listarVeiculosCliente(user.id);

      setVeiculos(data);

      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id || null);
      }
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
      setErro("Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  };

  const carregarVeiculoSelecionado = async () => {
    if (!selectedVehicleId) return;

    try {
      const atualizado = await api.buscarVeiculo(selectedVehicleId);

      setVeiculos((prev) =>
        prev.map((veiculo) =>
          veiculo.id === atualizado.id ? atualizado : veiculo
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar veículo selecionado:", error);
    }
  };

  useEffect(() => {
    carregarVeiculos();
  }, [user?.id]);

  useEffect(() => {
    carregarVeiculoSelecionado();

    const interval = setInterval(() => {
      carregarVeiculoSelecionado();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedVehicleId]);

  const selectedVehicle = useMemo(() => {
    return (
      veiculos.find((veiculo) => veiculo.id === selectedVehicleId) ||
      veiculos[0] ||
      null
    );
  }, [veiculos, selectedVehicleId]);

  const progress = selectedVehicle?.progressoVeiculo || 0;

  const steps = [
    {
      label: "Pedido Realizado",
      done: progress >= 16,
      color: "bg-blue-500",
      description: "Seu pedido foi registrado no sistema da concessionária.",
    },
    {
      label: "Linha de Produção",
      done: progress >= 33,
      color: "bg-yellow-500",
      description: "O veículo entrou na linha de produção da fábrica.",
    },
    {
      label: "Inspeção",
      done: progress >= 50,
      color: "bg-orange-500",
      description: "São realizados testes de qualidade e segurança.",
    },
    {
      label: "Cegonha",
      done: progress >= 66,
      color: "bg-purple-500",
      description: "O veículo está em transporte para a concessionária.",
    },
    {
      label: "Concessionária",
      done: progress >= 83,
      color: "bg-red-500",
      description:
        "O veículo chegou à concessionária e está em preparação.",
    },
    {
      label: "Pronto para Retirada",
      done: progress >= 100,
      color: "bg-green-500",
      description: "Seu veículo está pronto para ser retirado.",
    },
  ];

  const currentStep = steps.filter((step) => step.done).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando veículos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {erro}
      </div>
    );
  }

  if (veiculos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 px-4 text-center">
        Nenhum veículo vinculado ao seu cadastro ainda.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Meus Veículos
              </h1>

              <p className="text-gray-500 mt-2">
                Selecione um veículo para acompanhar ficha técnica e fabricação.
              </p>
            </div>

            <div className="relative">
              {veiculos.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      document.getElementById("vehicles-carousel")?.scrollBy({
                        left: -340,
                        behavior: "smooth",
                      });
                    }}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20"
                  >
                    ‹
                  </button>

                  <button
                    onClick={() => {
                      document.getElementById("vehicles-carousel")?.scrollBy({
                        left: 340,
                        behavior: "smooth",
                      });
                    }}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20"
                  >
                    ›
                  </button>
                </>
              )}

              <div
                id="vehicles-carousel"
                className="flex gap-4 overflow-x-hidden scroll-smooth snap-x snap-mandatory px-16"
              >
                {veiculos.map((veiculo) => {
                  const active = veiculo.id === selectedVehicle?.id;

                  return (
                    <button
                      key={veiculo.id}
                      onClick={() => setSelectedVehicleId(veiculo.id || null)}
                      className={`min-w-[220px] max-w-[220px] flex-shrink-0 snap-start text-left rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all ${
                        active
                          ? "border-zinc-900 ring-2 ring-zinc-400/30"
                          : "border-border hover:border-zinc-400"
                      }`}
                    >
                      {veiculo.fotoCarroUrl ? (
                        <img
                          src={veiculo.fotoCarroUrl}
                          alt={veiculo.modeloVeiculo || "Veículo"}
                          className="w-full h-36 object-cover"
                        />
                      ) : (
                        <div className="w-full h-36 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Car className="h-10 w-10 text-gray-400" />
                        </div>
                      )}

                      <div className="p-4">
                        <p className="font-semibold">
                          {veiculo.modeloVeiculo || "Veículo sem modelo"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {veiculo.anoVeiculo || "Ano não informado"} ·{" "}
                          {veiculo.corVeiculo || "Cor não informada"}
                        </p>

                        <Badge className="mt-2">
                          {veiculo.statusVeiculo || "Aguardando status"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedVehicle && (
              <>
                <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-black dark:text-white">
                      {selectedVehicle.modeloVeiculo}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Marca</span>
                        <p className="font-medium">
                          {selectedVehicle.marcaVeiculo || "Toyota"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Modelo</span>
                        <p className="font-medium">
                          {selectedVehicle.modeloVeiculo || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Ano</span>
                        <p className="font-medium">
                          {selectedVehicle.anoVeiculo || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Motor</span>
                        <p className="font-medium">
                          {selectedVehicle.motorVeiculo || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Cor</span>
                        <p className="font-medium">
                          {selectedVehicle.corVeiculo || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Câmbio</span>
                        <p className="font-medium">
                          {selectedVehicle.cambioVeiculo || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Combustível</span>
                        <p className="font-medium">
                          {selectedVehicle.combustivelVeiculo ||
                            "Não informado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Chassi</span>
                        <p className="font-medium">
                          {selectedVehicle.chassiVeiculo || "Gerando..."}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Próxima revisão</span>
                        <p className="font-medium">
                          {selectedVehicle.dataProximaRevisao ||
                            "Não informado"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
                  <CardHeader>
                    <CardTitle>Timeline de Fabricação</CardTitle>

                    <p className="text-sm text-gray-500">
                      {currentStep} de {steps.length} etapas concluídas
                    </p>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progresso</span>

                        <span className="font-medium text-green-600">
                          {progress}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-700 ease-in-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {steps.map((step, i) => (
                        <Tooltip key={step.label}>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-4 cursor-pointer">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    step.done
                                      ? `${step.color} text-white`
                                      : "border-2 border-gray-300 text-gray-400"
                                  }`}
                                >
                                  {step.done ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Circle className="h-3 w-3" />
                                  )}
                                </div>

                                {i < steps.length - 1 && (
                                  <div
                                    className={`w-0.5 h-12 ${
                                      step.done ? step.color : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </div>

                              <div className="pt-1">
                                <p
                                  className={`text-sm font-medium ${
                                    step.done
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {step.label}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p className="text-sm max-w-xs">
                              {step.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default VehiclePage;