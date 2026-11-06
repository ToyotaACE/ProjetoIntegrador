import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CreditCard, FileText, Route } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Veiculo } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { enUS, es, ja, ptBR } from "date-fns/locale";
import { getNextReviewDate } from "@/lib/vehicleMaintenance";

const vehiclePageText = {
  "pt-BR": { documentation: "Documentação", nextReview: "Próxima revisão", noReview: "Não informada" },
  "en-US": { documentation: "Documentation", nextReview: "Next service", noReview: "Not scheduled" },
  "es-ES": { documentation: "Documentación", nextReview: "Próxima revisión", noReview: "No programada" },
  "ja-JP": { documentation: "書類・マニュアル", nextReview: "次回点検", noReview: "未登録" },
} as const;

const VehiclePage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState<Date | null>(null);

  const carregarVeiculos = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const data = await api.listarVeiculosCliente(user.id);

      setVeiculos(data);
      setSelectedVehicleId((currentId) =>
        currentId && data.some((vehicle) => vehicle.id === currentId)
          ? currentId
          : null,
      );
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
      setErro("Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const carregarVeiculoSelecionado = useCallback(async () => {
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
  }, [selectedVehicleId]);

  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos]);

  useEffect(() => {
    carregarVeiculoSelecionado();

    const interval = setInterval(() => {
      carregarVeiculoSelecionado();
    }, 10000);

    return () => clearInterval(interval);
  }, [carregarVeiculoSelecionado]);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setNextReviewDate(null);
      return () => { active = false; };
    }

    api.buscarAgendamentosCliente(user.id)
      .then((appointments) => {
        if (active) setNextReviewDate(getNextReviewDate(appointments));
      })
      .catch((error) => {
        console.error("Erro ao carregar revisões agendadas:", error);
        if (active) setNextReviewDate(null);
      });

    return () => { active = false; };
  }, [user?.id]);

  const selectedVehicle = useMemo(() => {
    return veiculos.find((veiculo) => veiculo.id === selectedVehicleId) || null;
  }, [veiculos, selectedVehicleId]);

  const abrirDocumentacao = (veiculo: Veiculo) => {
    const vehicleDetails = {
      marcaVeiculo: veiculo.marcaVeiculo,
      modeloVeiculo: veiculo.modeloVeiculo,
      anoVeiculo: veiculo.anoVeiculo,
      corVeiculo: veiculo.corVeiculo,
      motorVeiculo: veiculo.motorVeiculo,
      cambioVeiculo: veiculo.cambioVeiculo,
      combustivelVeiculo: veiculo.combustivelVeiculo,
    };
    const query = new URLSearchParams({
      vehicle: JSON.stringify(vehicleDetails),
      lang: language,
      ...(veiculo.id ? { vehicleId: String(veiculo.id) } : {}),
    });
    window.open(`/documentacao?${query.toString()}`, "_blank", "noopener,noreferrer");
  };

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
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Meus Veículos
              </h1>

              <p className="text-gray-500 mt-2">
                Selecione um veículo para ver suas informações e opções.
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
                    <article
                      key={veiculo.id}
                      className={`min-w-[220px] max-w-[220px] flex-shrink-0 snap-start rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all ${
                        active
                          ? "border-zinc-900 ring-2 ring-zinc-400/30"
                          : "border-border hover:border-zinc-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedVehicleId(veiculo.id || null)}
                        aria-pressed={active}
                        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      <button
                        type="button"
                        onClick={() => abrirDocumentacao(veiculo)}
                        className="mx-4 mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <FileText className="h-4 w-4" />
                        {vehiclePageText[language].documentation}
                      </button>
                    </article>
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
                        <span className="text-gray-500">{vehiclePageText[language].nextReview}</span>
                        <p className="font-medium">
                        {nextReviewDate
                          ? format(
                              nextReviewDate,
                              language === "ja-JP"
                                ? "yyyy年M月d日"
                                : language === "en-US"
                                  ? "MMM d, yyyy"
                                  : "d MMM yyyy",
                              { locale: language === "en-US" ? enUS : language === "es-ES" ? es : language === "ja-JP" ? ja : ptBR },
                            )
                          : vehiclePageText[language].noReview}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      navigate(`/financiamento?vehicleId=${selectedVehicle.id}`)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ver financiamento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/veiculo/${selectedVehicle.id}/timeline`)
                    }
                  >
                    <Route className="mr-2 h-4 w-4" />
                    Acompanhar timeline
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
  );
};

export default VehiclePage;