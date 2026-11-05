import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Search,
  UserRound,
  CarFront,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { enUS, es, ja, ptBR } from "date-fns/locale";
import { vehicles } from "@/lib/mock-data";
import { api, type Cliente, type Veiculo, type VeiculoRequest } from "@/services/api";
import { useAppContext } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const orderSteps = ["Modelo", "Versão", "Cor", "Opcionais", "Resumo"] as const;
const modelCategories = ["Todos", "SUV", "Sedan", "Hatch", "Picape"] as const;

const paintColors = [
  { id: "branco", name: "Branco Polar", hex: "#f7f7f5" },
  { id: "prata", name: "Prata Névoa", hex: "#c3c7cb" },
  { id: "cinza", name: "Cinza Granito", hex: "#555a60" },
  { id: "preto", name: "Preto Attitude", hex: "#17191c" },
  { id: "vermelho", name: "Vermelho", hex: "#c52a36" },
  { id: "azul", name: "Azul", hex: "#243b5a" },
] as const;

const orderOptions = [
  { id: "pacote-seguranca", label: "Pacote Toyota Safety Sense", price: 4990 },
  { id: "teto-solar", label: "Teto solar", price: 7990 },
  { id: "bancos-couro", label: "Bancos em couro", price: 4490 },
  { id: "central-multimidia", label: "Central multimídia 10 polegadas", price: 2990 },
  { id: "rodas-liga", label: "Rodas de liga leve 17 polegadas", price: 3590 },
  { id: "engate-reboque", label: "Engate de reboque", price: 1890 },
] as const;

type OrderOptionId = (typeof orderOptions)[number]["id"];
type OrderVersion = {
  id: string;
  name: string;
  engine: string;
  price: number;
};

type OrderRecord = Veiculo & {
  id: number;
  clientePedido: Cliente;
  orderDate: string | null;
};

const parsePrice = (price: string) =>
  Number(price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());

const formatPrice = (value: number, language: string) =>
  new Intl.NumberFormat(
    language === "en" ? "en-US" : language === "es" ? "es-ES" : language === "ja" ? "ja-JP" : "pt-BR",
    { style: "currency", currency: "BRL", maximumFractionDigits: 0 }
  ).format(value);

const getVersions = (modelName: string, basePrice: number): OrderVersion[] => {
  if (modelName === "Corolla Sedan") {
    return [
      { id: "gli", name: "GLi 2.0", engine: "2.0 Flex · Automático CVT", price: basePrice },
      { id: "xei", name: "XEi 2.0", engine: "2.0 Flex · Automático CVT", price: basePrice + 10000 },
      { id: "gr-sport", name: "GR-Sport 2.0", engine: "2.0 Flex · Automático CVT", price: basePrice + 20000 },
      { id: "altis-hybrid", name: "Altis Hybrid", engine: "1.8 Híbrido · Automático CVT", price: basePrice + 30000 },
    ];
  }

  return [
    { id: "xle", name: "XLE", engine: "2.0 Flex · Automático", price: basePrice },
    { id: "xre", name: "XRE", engine: "2.0 Flex · Automático", price: basePrice + 9000 },
    { id: "top", name: "Premium", engine: "2.0 Flex · Automático", price: basePrice + 18000 },
  ];
};

const orderCode = (id: number) => `TOY-${new Date().getFullYear()}-${String(id).padStart(6, "0")}`;
const orderDateKey = (id: number) => `toyota-pedido-meta-${id}`;

async function getOrders(): Promise<OrderRecord[]> {
  const clients = await api.listarClientes();
  const persistedClients = clients.filter(
    (client): client is Cliente & { id: number } => typeof client.id === "number"
  );
  const groupedOrders = await Promise.all(
    persistedClients.map(async (client) => {
      const clientVehicles = await api.listarVeiculosCliente(client.id);
      return clientVehicles.flatMap((vehicle) => {
        if (typeof vehicle.id !== "number") return [];
        return [{
          ...vehicle,
          id: vehicle.id,
          clientePedido: client,
          orderDate: localStorage.getItem(orderDateKey(vehicle.id)),
        }];
      });
    })
  );
  return groupedOrders.flat().sort((a, b) => b.id - a.id);
}

function OrderStatus({ status }: { status?: string }) {
  const { t } = useLanguage();
  const style = status?.toLocaleLowerCase().includes("entreg")
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    : status?.toLocaleLowerCase().includes("produ")
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      : status?.toLocaleLowerCase().includes("aprov") || status?.toLocaleLowerCase().includes("análise") || status?.toLocaleLowerCase().includes("analise")
        ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
        : "border-muted bg-muted text-muted-foreground";
  return <Badge variant="outline" className={style}>{t(status || "Em análise")}</Badge>;
}

export function VehicleOrdersHome() {
  const { t } = useLanguage();
  const { userName } = useAppContext();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrders()
      .then((orders) => {
        if (active) setRecentOrders(orders.slice(0, 3));
      })
      .catch((error: unknown) => {
        console.error("Erro ao carregar pedidos:", error);
        if (active) toast.error(t("Não foi possível carregar os pedidos."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{t("Pedidos Toyota")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("Novo pedido de veículo")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("Configure o veículo ideal para o seu cliente de forma rápida e simples.")}</p>
      </header>

      <section className="grid overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative min-h-[320px] overflow-hidden bg-slate-950">
          <img src={vehicles[0].image} alt={t(vehicles[0].name)} className="absolute inset-0 h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
          <div className="relative flex h-full min-h-[320px] max-w-xl flex-col justify-end p-7 text-white md:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/70">{t("Toyota ACE · Pedidos")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{t("Um pedido completo, em poucos passos.")}</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">{t("Escolha o modelo e a versão, personalize a cor e os opcionais e confirme os dados do cliente antes de registrar.")}</p>
            <Button className="mt-6 w-fit" onClick={() => navigate("/pedidos/novo")}>
              {t("Iniciar novo pedido")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-1 md:p-8">
          {[
            { icon: CarFront, title: "Configuração guiada", copy: "Selecione o modelo, versão, cor e opcionais." },
            { icon: ClipboardList, title: "Resumo claro", copy: "Confira preço e informações do cliente antes de enviar." },
            { icon: Clock3, title: "Acompanhamento", copy: "Consulte os pedidos registrados e o status de cada veículo." },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex gap-4 rounded-xl border p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-medium">{t(title)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(copy)}</p>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => navigate("/pedidos/meus")}>
            {t("Acessar meus pedidos")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("Pedidos recentes")}</h2>
            <p className="text-sm text-muted-foreground">{t("Acompanhe os últimos pedidos registrados.")}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/pedidos/meus")}>
            {t("Ver todos")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("Carregando pedidos...")}</p>
        ) : recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("Ainda não há pedidos registrados.")}</p>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <Link key={order.id} to={`/pedidos/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-primary">
                <div>
                  <p className="font-medium">{orderCode(order.id)} · {order.modeloVeiculo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{order.clientePedido.nome}</p>
                </div>
                <OrderStatus status={order.statusVeiculo} />
              </Link>
            ))}
          </div>
        )}
      </section>
      <p className="text-sm text-muted-foreground">{t("Atendente")}: {userName || t("Vendedor")}</p>
    </div>
  );
}

export function NewVehicleOrder() {
  const { t, language } = useLanguage();
  const { userName, selectedBranch } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [step, setStep] = useState(0);
  const [modelSearch, setModelSearch] = useState("");
  const [category, setCategory] = useState<(typeof modelCategories)[number]>("Todos");
  const [vehicleId, setVehicleId] = useState<number | null>(() => {
    const requestedId = Number(searchParams.get("modelo"));
    return vehicles.some((vehicle) => vehicle.id === requestedId) ? requestedId : null;
  });
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const basePrice = selectedVehicle ? parsePrice(selectedVehicle.price) : 0;
  const versions = selectedVehicle ? getVersions(selectedVehicle.name, basePrice) : [];
  const [versionId, setVersionId] = useState(() =>
    selectedVehicle ? getVersions(selectedVehicle.name, basePrice)[0]?.id ?? "" : ""
  );
  const [colorId, setColorId] = useState<(typeof paintColors)[number]["id"]>("branco");
  const [selectedOptions, setSelectedOptions] = useState<OrderOptionId[]>([]);
  const [clientId, setClientId] = useState(() => localStorage.getItem("toyota_selected_client_id") || "");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api.listarClientes()
      .then((data) => { if (active) setClients(data); })
      .catch((error: unknown) => {
        console.error("Erro ao carregar clientes:", error);
        if (active) toast.error(t("Erro ao carregar clientes."));
      });
    return () => { active = false; };
  }, [t]);

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = modelSearch.trim().toLocaleLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesCategory = category === "Todos" || vehicle.category === category;
      const matchesSearch = `${vehicle.name} ${vehicle.category}`.toLocaleLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, modelSearch]);

  const selectedVersion = versions.find((version) => version.id === versionId) ?? versions[0] ?? null;
  const selectedColor = paintColors.find((color) => color.id === colorId) ?? paintColors[0];
  const selectedClient = clients.find((client) => String(client.id) === clientId) ?? null;
  const accessoriesTotal = orderOptions
    .filter((option) => selectedOptions.includes(option.id))
    .reduce((sum, option) => sum + option.price, 0);
  const total = (selectedVersion?.price ?? basePrice) + accessoriesTotal;

  const chooseModel = (id: number) => {
    setVehicleId(id);
    const model = vehicles.find((vehicle) => vehicle.id === id);
    setVersionId(model ? getVersions(model.name, parsePrice(model.price))[0]?.id ?? "" : "");
  };

  const validateStep = () => {
    if (step === 0 && !selectedVehicle) {
      toast.error(t("Selecione um modelo para continuar."));
      return false;
    }
    if (step === 1 && !selectedVersion) {
      toast.error(t("Selecione uma versão para continuar."));
      return false;
    }
    if (step === 4 && !selectedClient) {
      toast.error(t("Selecione um cliente para continuar."));
      return false;
    }
    return true;
  };

  const submitOrder = async () => {
    if (!selectedVehicle || !selectedVersion || !selectedClient?.id) {
      toast.error(t("Confira o modelo, a versão e os dados do cliente."));
      return;
    }

    const request: VeiculoRequest = {
      clienteId: selectedClient.id,
      modeloVeiculo: `${selectedVehicle.name} ${selectedVersion.name}`,
      marcaVeiculo: "Toyota",
      anoVeiculo: String(selectedVehicle.year),
      corVeiculo: selectedColor.name,
      motorVeiculo: selectedVersion.engine,
      combustivelVeiculo: selectedVersion.engine.toLowerCase().includes("híbrido") ? "Híbrido/Flex" : "Flex",
      cambioVeiculo: "Automático",
      fotoCarroUrl: selectedVehicle.image,
      statusVeiculo: "Em análise",
      progressoVeiculo: 10,
      valorTotal: total,
      acessorios: orderOptions
        .filter((option) => selectedOptions.includes(option.id))
        .map((option) => option.label)
        .join(", "),
    };

    setSubmitting(true);
    try {
      const createdVehicle = await api.cadastrarVeiculo(request);
      if (typeof createdVehicle.id !== "number") {
        throw new Error(t("O pedido foi salvo, mas o servidor não retornou o número do pedido."));
      }
      localStorage.setItem(orderDateKey(createdVehicle.id), new Date().toISOString());
      localStorage.removeItem("toyota_selected_client_id");
      setCompletedOrderId(createdVehicle.id);
    } catch (error) {
      console.error("Erro ao registrar pedido:", error);
      toast.error(error instanceof Error ? error.message : t("Não foi possível registrar o pedido."));
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrderId !== null) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="h-9 w-9" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold">{t("Pedido registrado com sucesso!")}</h1>
        <p className="mt-2 text-muted-foreground">{t("O pedido foi registrado e já está disponível para acompanhamento.")}</p>
        <div className="mt-6 rounded-xl border bg-card px-8 py-5">
          <p className="text-sm text-muted-foreground">{t("Número do pedido")}</p>
          <p className="mt-1 text-xl font-semibold">{orderCode(completedOrderId)}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/pedidos/meus")}>{t("Ver meus pedidos")}</Button>
          <Button variant="outline" onClick={() => navigate("/pedidos/novo")}>{t("Cadastrar novo pedido")}</Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/pedidos" className="text-sm text-muted-foreground hover:text-foreground">← {t("Voltar aos pedidos")}</Link>
          <h1 className="mt-2 text-2xl font-semibold">{t("Novo pedido de veículo")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("Configure o veículo e confirme as informações antes de registrar.")}</p>
        </div>
        {selectedVehicle && <p className="text-sm text-muted-foreground">{t("Etapa {current} de {total}", { current: step + 1, total: orderSteps.length })}</p>}
      </header>

      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <div className="mb-5 grid grid-cols-5 gap-2" aria-label={t("Etapas do pedido")}>
          {orderSteps.map((name, index) => (
            <button key={name} type="button" onClick={() => index < step && setStep(index)} disabled={index > step} className="group min-w-0 text-left disabled:cursor-default">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${index === step ? "border-primary bg-primary text-primary-foreground" : index < step ? "border-primary bg-primary/10 text-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                {index < step ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`mt-2 hidden truncate text-xs sm:block ${index === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{t(name)}</span>
            </button>
          ))}
        </div>
        <Progress value={((step + 1) / orderSteps.length) * 100} className="h-1.5" />

        <div className="mt-6 min-h-[420px]">
          {step === 0 && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{t("Selecione o modelo")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Escolha o modelo de veículo que o seu cliente deseja.")}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[150px_1fr]">
                <div>
                  <p className="mb-2 text-sm font-medium">{t("Categorias")}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col">
                    {modelCategories.map((item) => (
                      <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`rounded-md border px-3 py-2 text-left text-sm ${category === item ? "border-primary bg-primary/5 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>{t(item)}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder={t("Buscar modelo...")} aria-label={t("Buscar modelo...")} className="pl-9" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredVehicles.map((vehicle) => (
                      <button key={vehicle.id} type="button" onClick={() => chooseModel(vehicle.id)} aria-pressed={vehicleId === vehicle.id} className={`overflow-hidden rounded-xl border text-left transition-colors ${vehicleId === vehicle.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"}`}>
                        <span className="flex h-36 items-center justify-center bg-muted p-2">
                          <img
                            src={vehicle.image}
                            alt={t(vehicle.name)}
                            className="h-full w-full object-contain"
                          />
                        </span>
                        <span className="flex items-center justify-between gap-2 p-3">
                          <span><span className="block font-medium">{t(vehicle.name)}</span><span className="text-xs text-muted-foreground">{t(vehicle.category)} · {vehicle.year}</span></span>
                          <span className="text-right text-xs font-semibold">{vehicle.price}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {filteredVehicles.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t("Nenhum modelo encontrado.")}</p>}
                </div>
              </div>
            </section>
          )}

          {step === 1 && selectedVehicle && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{t("Selecione a versão")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Escolha a versão e motorização do modelo selecionado.")}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <img src={selectedVehicle.image} alt={t(selectedVehicle.name)} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <h3 className="mt-3 font-semibold">{t(selectedVehicle.name)}</h3>
                  <p className="text-sm text-muted-foreground">{t(selectedVehicle.category)} · {selectedVehicle.year}</p>
                </div>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <button key={version.id} type="button" onClick={() => setVersionId(version.id)} aria-pressed={versionId === version.id} className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left ${versionId === version.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                      <span className="min-w-0">
                        <span className="block font-semibold">{t(version.name)}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{t(version.engine)}</span>
                      </span>
                      <span className="shrink-0 text-right font-semibold">{formatPrice(version.price, language)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 2 && selectedVehicle && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{t("Escolha a cor")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Selecione a cor externa do veículo.")}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <img src={selectedVehicle.image} alt={t(selectedVehicle.name)} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <p className="mt-3 font-semibold">{t(selectedVehicle.name)} {selectedVersion?.name}</p>
                  <p className="text-sm text-muted-foreground">{t(selectedColor.name)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {paintColors.map((color) => (
                    <button key={color.id} type="button" onClick={() => setColorId(color.id)} aria-pressed={colorId === color.id} className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-sm ${colorId === color.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"}`}>
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm ${colorId === color.id ? "ring-2 ring-primary ring-offset-2" : ""}`} style={{ backgroundColor: color.hex }}>
                        {colorId === color.id ? <Check aria-hidden="true" className={color.id === "preto" || color.id === "cinza" || color.id === "azul" || color.id === "vermelho" ? "h-5 w-5 text-white" : "h-5 w-5 text-slate-900"} /> : null}
                      </span>
                      {t(color.name)}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{t("Adicione os opcionais")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Personalize o veículo com os opcionais disponíveis.")}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="divide-y rounded-xl border">
                  {orderOptions.map((option) => {
                    const checked = selectedOptions.includes(option.id);
                    return (
                      <label key={option.id} className="flex cursor-pointer items-center gap-3 p-4 hover:bg-muted/40">
                        <Checkbox checked={checked} onCheckedChange={(value) => setSelectedOptions((current) => value ? [...current, option.id] : current.filter((id) => id !== option.id))} />
                        <span className="flex-1 text-sm font-medium">{t(option.label)}</span>
                        <span className="text-sm font-semibold">{formatPrice(option.price, language)}</span>
                      </label>
                    );
                  })}
                </div>
                <aside className="h-fit rounded-xl border bg-muted/30 p-4">
                  <h3 className="font-semibold">{t("Resumo da configuração")}</h3>
                  <p className="mt-3 text-sm">{selectedVehicle?.name} {selectedVersion?.name}</p>
                  <p className="text-sm text-muted-foreground">{t(selectedColor.name)}</p>
                  <div className="mt-4 flex justify-between gap-3 border-t pt-3 text-sm">
                    <span>{t("Opcionais")} ({selectedOptions.length})</span>
                    <span className="font-medium">{formatPrice(accessoriesTotal, language)}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-3 border-t pt-3 font-semibold">
                    <span>{t("Total")}</span><span>{formatPrice(total, language)}</span>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {step === 4 && selectedVehicle && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{t("Confira e registre o pedido")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Verifique se as informações estão corretas antes de finalizar.")}</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <img src={selectedVehicle.image} alt={t(selectedVehicle.name)} className="h-24 w-36 rounded-lg object-cover" />
                    <div>
                      <h3 className="text-lg font-semibold">{t(selectedVehicle.name)} {selectedVersion?.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedVersion?.engine}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                    <dt className="text-muted-foreground">{t("Cor")}</dt><dd className="text-right font-medium">{t(selectedColor.name)}</dd>
                    <dt className="text-muted-foreground">{t("Opcionais")}</dt><dd className="text-right font-medium">{selectedOptions.length}</dd>
                    <dt className="border-t pt-3 font-semibold">{t("Preço base")}</dt><dd className="border-t pt-3 text-right font-semibold">{formatPrice(selectedVersion?.price ?? basePrice, language)}</dd>
                    <dt className="text-muted-foreground">{t("Opcionais")}</dt><dd className="text-right">{formatPrice(accessoriesTotal, language)}</dd>
                    <dt className="border-t pt-3 text-base font-semibold">{t("Total do pedido")}</dt><dd className="border-t pt-3 text-right text-base font-semibold text-primary">{formatPrice(total, language)}</dd>
                  </dl>
                </div>
                <div className="space-y-4 rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{t("Dados do cliente")}</h3>
                    <UserRound aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pedido-cliente">{t("Cliente responsável")}</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger id="pedido-cliente"><SelectValue placeholder={t("Selecione um cliente")} /></SelectTrigger>
                      <SelectContent>
                        {clients.filter((client) => client.id).map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedClient ? (
                    <div className="space-y-2 border-t pt-3 text-sm">
                      <p className="font-medium">{selectedClient.nome}</p>
                      <p className="text-muted-foreground">{selectedClient.telefone || t("Telefone não informado")}</p>
                      <p className="text-muted-foreground">{selectedClient.email}</p>
                      <p className="border-t pt-3 text-xs text-muted-foreground">{t("Vendedor")}: {userName || t("Vendedor")}</p>
                      {selectedBranch ? <p className="text-xs text-muted-foreground">{t("Concessionária")}: {selectedBranch}</p> : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("Selecione um cliente para ver os dados do pedido.")}</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <footer className="mt-6 flex flex-wrap justify-between gap-3 border-t pt-5">
          <Button variant="outline" onClick={() => step === 0 ? navigate("/pedidos") : setStep((current) => Math.max(0, current - 1))}>
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" /> {t("Voltar")}
          </Button>
          {step < orderSteps.length - 1 ? (
            <Button onClick={() => validateStep() && setStep((current) => current + 1)}>
              {t("Próximo")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submitOrder} disabled={submitting || !selectedClient?.id}>
              {submitting ? t("Registrando...") : t("Finalizar pedido")} <Check aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

export function VehicleOrdersList() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    let active = true;
    getOrders()
      .then((data) => { if (active) setOrders(data); })
      .catch((error: unknown) => {
        console.error("Erro ao carregar pedidos:", error);
        if (active) toast.error(t("Não foi possível carregar os pedidos."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const now = Date.now();
    return orders.filter((order) => {
      const matchesSearch = `${orderCode(order.id)} ${order.clientePedido.nome} ${order.modeloVeiculo ?? ""}`
        .toLocaleLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || order.statusVeiculo === statusFilter;
      const orderDate = order.orderDate ? new Date(order.orderDate).getTime() : NaN;
      const matchesPeriod = periodFilter === "all" || (
        Number.isFinite(orderDate) && now - orderDate <= Number(periodFilter) * 24 * 60 * 60 * 1000
      );
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [orders, periodFilter, search, statusFilter]);

  const statuses = [...new Set(orders.map((order) => order.statusVeiculo || "Em análise"))];
  const locale = language === "en" ? enUS : language === "es" ? es : language === "ja" ? ja : ptBR;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{t("Pedidos Toyota")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("Meus pedidos")}</h1>
          <p className="mt-2 text-muted-foreground">{t("Acompanhe o status de todos os pedidos realizados.")}</p>
        </div>
        <Button asChild><Link to="/pedidos/novo">{t("Novo pedido")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button>
      </header>

      <section className="rounded-2xl border bg-card p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_170px]">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Buscar por pedido, cliente ou veículo...")} aria-label={t("Buscar por pedido, cliente ou veículo...")} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label={t("Filtrar por status")}><SelectValue placeholder={t("Todos os status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Todos os status")}</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{t(status)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger aria-label={t("Filtrar por período")}><SelectValue placeholder={t("Qualquer período")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Qualquer período")}</SelectItem>
              <SelectItem value="7">{t("Últimos 7 dias")}</SelectItem>
              <SelectItem value="30">{t("Últimos 30 dias")}</SelectItem>
              <SelectItem value="90">{t("Últimos 90 dias")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("Carregando pedidos...")}</p>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList aria-hidden="true" className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium">{orders.length ? t("Nenhum pedido corresponde aos filtros.") : t("Ainda não há pedidos registrados.")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Ajuste a busca ou registre um novo pedido.")}</p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 font-medium">{t("Número do pedido")}</th>
                  <th className="px-3 py-3 font-medium">{t("Cliente")}</th>
                  <th className="px-3 py-3 font-medium">{t("Veículo")}</th>
                  <th className="px-3 py-3 font-medium">{t("Data")}</th>
                  <th className="px-3 py-3 font-medium">{t("Status")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("Ações")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-4 font-medium">{orderCode(order.id)}</td>
                    <td className="px-3 py-4">{order.clientePedido.nome}</td>
                    <td className="px-3 py-4">{order.modeloVeiculo || t("Veículo sem modelo")}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {order.orderDate ? format(new Date(order.orderDate), "P", { locale }) : "—"}
                    </td>
                    <td className="px-3 py-4"><OrderStatus status={order.statusVeiculo} /></td>
                    <td className="px-3 py-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/pedidos/${order.id}`}>{t("Ver detalhes")} <ArrowRight aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">{t("Exibindo {shown} de {total} pedidos", { shown: filteredOrders.length, total: orders.length })}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function VehicleOrderDetail() {
  const { t, language } = useLanguage();
  const { userName } = useAppContext();
  const { id: rawId } = useParams();
  const orderId = Number(rawId);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrders()
      .then((orders) => {
        const found = orders.find((item) => item.id === orderId) ?? null;
        if (active) setOrder(found);
      })
      .catch((error: unknown) => {
        console.error("Erro ao carregar os detalhes do pedido:", error);
        if (active) toast.error(t("Não foi possível carregar os detalhes do pedido."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, t]);

  const locale = language === "en" ? enUS : language === "es" ? es : language === "ja" ? ja : ptBR;

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">{t("Carregando detalhes do pedido...")}</p>;
  if (!order) {
    return (
      <section className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("Pedido não encontrado")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Este pedido não está disponível ou foi removido.")}</p>
        <Button asChild className="mt-5"><Link to="/pedidos/meus">{t("Voltar aos meus pedidos")}</Link></Button>
      </section>
    );
  }

  const accessories = order.acessorios?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  const createdAt = order.orderDate ? format(new Date(order.orderDate), "PPpp", { locale }) : t("Data não disponível");
  const progress = Math.min(Math.max(order.progressoVeiculo ?? 0, 0), 100);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/pedidos/meus" className="text-sm text-muted-foreground hover:text-foreground">← {t("Voltar aos meus pedidos")}</Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{t("Detalhes do pedido")}</h1>
            <OrderStatus status={order.statusVeiculo} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{orderCode(order.id)} · {createdAt}</p>
        </div>
        <Button asChild variant="outline"><Link to="/pedidos/meus">{t("Meus pedidos")}</Link></Button>
      </header>

      <section className="grid gap-5 rounded-2xl border bg-card p-5 md:grid-cols-[220px_1fr] md:p-6">
        <img src={order.fotoCarroUrl || vehicles[0].image} alt={order.modeloVeiculo || t("Veículo")} className="aspect-[4/3] w-full rounded-xl bg-muted object-cover" />
        <div className="flex flex-col justify-center">
          <p className="text-sm text-muted-foreground">{t("Pedido")}</p>
          <h2 className="mt-1 text-xl font-semibold">{order.modeloVeiculo || t("Veículo sem modelo")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{order.marcaVeiculo || "Toyota"} · {order.anoVeiculo}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">{t("Cor")}</p><p className="mt-1 text-sm font-medium">{t(order.corVeiculo || "Não informado")}</p></div>
            <div>            <p className="text-xs text-muted-foreground">{t("Total do pedido")}</p><p className="mt-1 text-sm font-medium">{formatPrice(order.valorTotal ?? 0, language)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("Status")}</p><p className="mt-1 text-sm font-medium">{t(order.statusVeiculo || "Em análise")}</p></div>
          </div>
          <div className="mt-5 max-w-xl">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{t("Progresso do pedido")}</span><span>{progress}%</span></div>
            <Progress value={progress} />
          </div>
        </div>
      </section>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="resumo">{t("Resumo")}</TabsTrigger>
          <TabsTrigger value="cliente">{t("Cliente")}</TabsTrigger>
          <TabsTrigger value="historico">{t("Histórico")}</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{t("Configuração do veículo")}</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("Modelo")}</dt><dd className="text-right font-medium">{order.modeloVeiculo}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("Versão")}</dt><dd className="text-right font-medium">{order.motorVeiculo}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("Cor")}</dt><dd className="text-right font-medium">{t(order.corVeiculo || "Não informado")}</dd></div>
                <div className="border-t pt-3">
                  <dt className="text-muted-foreground">{t("Opcionais")}</dt>
                  {accessories.length ? <dd className="mt-2 space-y-1">{accessories.map((item) => <p key={item}>• {t(item)}</p>)}</dd> : <dd className="mt-2">{t("Nenhum opcional selecionado.")}</dd>}
                </div>
                <div className="flex justify-between gap-3 border-t pt-3 text-base font-semibold"><dt>{t("Total do pedido")}</dt><dd>{formatPrice(order.valorTotal ?? 0, language)}</dd></div>
              </dl>
            </section>
            <section className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{t("Dados do cliente")}</h3>
                <UserRound aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">{order.clientePedido.nome}</p>
              <p className="mt-1 text-sm text-muted-foreground">{order.clientePedido.telefone || t("Telefone não informado")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{order.clientePedido.email}</p>
              {order.clientePedido.endereco ? <p className="mt-1 text-sm text-muted-foreground">{order.clientePedido.endereco}</p> : null}
              <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">{t("Vendedor")}: {userName || t("Vendedor")}</p>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="cliente">
          <section className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">{t("Dados do cliente")}</h3>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">{t("Nome")}</dt><dd className="mt-1 font-medium">{order.clientePedido.nome}</dd></div>
              <div><dt className="text-muted-foreground">{t("Telefone")}</dt><dd className="mt-1 font-medium">{order.clientePedido.telefone || t("Telefone não informado")}</dd></div>
              <div><dt className="text-muted-foreground">{t("E-mail")}</dt><dd className="mt-1 font-medium">{order.clientePedido.email}</dd></div>
              <div><dt className="text-muted-foreground">{t("CPF")}</dt><dd className="mt-1 font-medium">{order.clientePedido.cpf || t("Não informado")}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">{t("Endereço")}</dt><dd className="mt-1 font-medium">{order.clientePedido.endereco || t("Não informado")}</dd></div>
            </dl>
          </section>
        </TabsContent>
        <TabsContent value="historico">
          <section className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">{t("Histórico do pedido")}</h3>
            <div className="mt-5 flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><FileText aria-hidden="true" className="h-4 w-4" /></span>
              <div className="flex-1 border-b pb-4">
                <p className="font-medium">{t("Pedido registrado")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{createdAt}</p>
                <p className="mt-2 text-sm">{t("Status atual")}: <OrderStatus status={order.statusVeiculo} /></p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("O histórico exibido depende das atualizações de status disponíveis para este pedido.")}</p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
