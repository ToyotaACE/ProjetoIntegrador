import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Factory,
  FileCheck2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Veiculo } from "@/services/api";

const stages = [
  {
    label: "Pedido Realizado",
    description: "Seu pedido foi registrado com sucesso.",
    icon: FileCheck2,
    isComplete: (progress: number) => progress > 0,
  },
  {
    label: "Linha de Produção",
    description: "Produto em processo de fabricação.",
    icon: Factory,
    isComplete: (progress: number) => progress >= 33,
  },
  {
    label: "Inspeção",
    description: "Qualidade sendo verificada.",
    icon: Search,
    isComplete: (progress: number) => progress >= 50,
  },
  {
    label: "Cegonha",
    description: "Produto em processo de acabamento.",
    icon: ShieldCheck,
    isComplete: (progress: number) => progress >= 67,
  },
  {
    label: "Concessionária",
    description: "Enviado para a concessionária.",
    icon: Users,
    isComplete: (progress: number) => progress >= 83,
  },
  {
    label: "Pronto para Retirada",
    description: "Seu pedido está pronto para ser retirado.",
    icon: CarFront,
    isComplete: (progress: number) => progress >= 100,
  },
];

function formatOrderDate(vehicle: Veiculo) {
  const dateValue =
    (vehicle as Veiculo & { dataPedido?: string; dataCompra?: string }).dataPedido ||
    (vehicle as Veiculo & { dataCompra?: string }).dataCompra;
  if (!dateValue) return "Data não informada";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function VehicleTimelinePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { vehicleId = "" } = useParams();
  const parsedVehicleId = Number(vehicleId);
  const [vehicle, setVehicle] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVehicle = useCallback(async () => {
    if (!user?.id || !Number.isInteger(parsedVehicleId) || parsedVehicleId <= 0) {
      setError("Não foi possível identificar o veículo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const vehicles = await api.listarVeiculosCliente(user.id);
      const selectedVehicle = vehicles.find((item) => item.id === parsedVehicleId);
      if (!selectedVehicle) {
        throw new Error("Veículo não encontrado na sua conta.");
      }
      setVehicle(selectedVehicle);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar a timeline do veículo.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, parsedVehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const parsedProgress = Number(vehicle?.progressoVeiculo || 0);
  const progress = Number.isFinite(parsedProgress)
    ? Math.max(0, Math.min(100, parsedProgress))
    : 0;
  const completedStages = useMemo(
    () => stages.filter((stage) => stage.isComplete(progress)).length,
    [progress],
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 text-[#141923] dark:bg-zinc-950 dark:text-white md:px-7">
      <div className="mx-auto max-w-[1440px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-600 text-white">
              <Factory className="h-9 w-9" />
            </div>
            <div className="h-14 w-1 rounded-full bg-red-600" />
            <div>
              <h1 className="text-2xl font-bold md:text-4xl">
                Timeline de Fabricação
              </h1>
              <p className="mt-1 text-sm text-slate-500 md:text-base dark:text-zinc-400">
                Acompanhe o progresso das etapas de produção em tempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-3 font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
              <BadgeCheck className="h-5 w-5" />
              {progress}% do valor
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/veiculo")}
              className="hidden sm:inline-flex"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            Carregando timeline...
          </div>
        ) : error ? (
          <div role="alert" className="py-16 text-center text-red-600">
            {error}
          </div>
        ) : vehicle ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <Clock3 className="h-7 w-7 shrink-0 text-slate-600 dark:text-zinc-300" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex justify-between gap-4 text-sm font-semibold">
                  <span>Progresso Geral</span>
                  <span className="text-lg font-bold text-red-600">
                    {progress}%
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-red-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="space-y-3">
                {stages.map((stage, index) => {
                  const done = stage.isComplete(progress);
                  const Icon = done
                    ? Check
                    : stage.icon;
                  return (
                    <div key={stage.label} className="flex items-stretch gap-3">
                      <div className="flex w-12 shrink-0 flex-col items-center">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${
                            done
                              ? "bg-red-600 text-white"
                              : "border-2 border-slate-300 bg-white text-slate-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {index < stages.length - 1 && (
                          <div
                            className={`my-1 min-h-3 w-1 flex-1 rounded-full ${
                              done ? "bg-red-200 dark:bg-red-950" : "bg-slate-200 dark:bg-zinc-700"
                            }`}
                          />
                        )}
                      </div>
                      <div
                        className={`flex min-h-[72px] flex-1 items-center gap-4 rounded-xl border px-4 py-3 ${
                          done
                            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                            : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                        }`}
                      >
                        <stage.icon
                          className={`hidden h-7 w-7 shrink-0 sm:block ${
                            done ? "text-red-600" : "text-slate-800 dark:text-zinc-200"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{stage.label}</p>
                          <p className="text-sm text-slate-600 dark:text-zinc-400">
                            {stage.description}
                          </p>
                        </div>
                        {done ? (
                          <span className="hidden items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-medium text-red-700 sm:flex dark:bg-red-900/50 dark:text-red-200">
                            <CalendarDays className="h-4 w-4" />
                            {index === 0 ? formatOrderDate(vehicle) : "Concluído"}
                          </span>
                        ) : (
                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800">
                {vehicle.fotoCarroUrl ? (
                  <img
                    src={vehicle.fotoCarroUrl}
                    alt={vehicle.modeloVeiculo || "Veículo"}
                    className="h-52 w-full bg-white object-contain dark:bg-zinc-900"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-white text-slate-300 dark:bg-zinc-900 dark:text-zinc-700">
                    <CarFront className="h-20 w-20" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg font-bold">Seu Pedido</h2>
                  <div className="my-2 h-0.5 w-10 bg-red-600" />
                  <div className="flex items-center gap-3 border-b border-slate-200 py-3 dark:border-zinc-700">
                    <Package className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Número do pedido
                      </p>
                      <p className="font-semibold">
                        {(vehicle as Veiculo & { numeroPedido?: string | number; pedidoId?: string | number }).numeroPedido ||
                          (vehicle as Veiculo & { pedidoId?: string | number }).pedidoId ||
                          vehicle.id ||
                          "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-b border-slate-200 py-3 dark:border-zinc-700">
                    <CarFront className="h-6 w-6 text-slate-600 dark:text-zinc-300" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Veículo
                      </p>
                      <p className="font-semibold">
                        {vehicle.modeloVeiculo || "Toyota"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <CalendarDays className="h-6 w-6 text-slate-600 dark:text-zinc-300" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Data do Pedido
                      </p>
                      <p className="font-semibold">{formatOrderDate(vehicle)}</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-700" />
                Você será notificado em todas as atualizações do seu pedido.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/veiculo")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={loadVehicle}
                  className="border border-red-600 bg-white text-red-600 hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Status
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
