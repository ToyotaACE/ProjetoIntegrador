import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type Cliente, type Veiculo } from "@/services/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Search,
  Plus,
  Phone,
  Trash2,
  Edit2,
  ArrowUpAZ,
  ArrowDownAZ,
  Car,
  Eye,
} from "lucide-react";

import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type ClientStatus = "lead" | "negociacao" | "fechado";

const statusConfig: Record<
  ClientStatus,
  {
    label: string;
    className: string;
  }
> = {
  lead: {
    label: "Lead",
    className: "bg-blue-500/15 text-blue-400",
  },
  negociacao: {
    label: "Negociação",
    className: "bg-warning/15 text-yellow-400",
  },
  fechado: {
    label: "Fechado",
    className: "bg-success/15 text-green-400",
  },
};

const emptyClient = {
  nome: "",
  email: "",
  senha: "",
  cpf: "",
  telefone: "",
  status: "lead" as ClientStatus,
};

const emptyVehicle = {
  modeloVeiculo: "",
  marcaVeiculo: "Toyota",
  anoVeiculo: "",
  corVeiculo: "",
  motorVeiculo: "",
  combustivelVeiculo: "",
  cambioVeiculo: "",
  fotoCarroUrl: "",
  valorTotal: "",
  valorEntrada: "",
  valorFinanciado: "",
  parcelasTotais: "",
  parcelasPagas: "",
  parcelasRestantes: "",
  valorParcela: "",
  taxaJuros: "",
  statusFinanciamento: "",
  statusGarantia: "",
  dataProximaRevisao: "",
  acessorios: "",
};

const formatMoney = (value?: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const Clients = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [clients, setClients] = useState<Cliente[]>([]);
  const [vehiclesByClient, setVehiclesByClient] = useState<
    Record<number, Veiculo[]>
  >({});

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"az" | "za" | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [vehicleEditOpen, setVehicleEditOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Veiculo | null>(null);

  const [form, setForm] = useState(emptyClient);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const carregarClientes = async () => {
    try {
      setLoadingClients(true);

      const data = await api.listarClientes();
      setClients(data);

      const vehiclesMap: Record<number, Veiculo[]> = {};

      await Promise.all(
        data.map(async (cliente) => {
          if (!cliente.id) return;

          try {
            const veiculos = await api.listarVeiculosCliente(cliente.id);
            vehiclesMap[cliente.id] = veiculos;
          } catch {
            vehiclesMap[cliente.id] = [];
          }
        })
      );

      setVehiclesByClient(vehiclesMap);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error(t("Erro ao carregar clientes do backend."));
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const filtered = clients
    .filter((c) => {
      const termo = search.toLowerCase();
      const veiculos = c.id ? vehiclesByClient[c.id] || [] : [];

      return (
        (c.nome || "").toLowerCase().includes(termo) ||
        (c.email || "").toLowerCase().includes(termo) ||
        (c.telefone || "").toLowerCase().includes(termo) ||
        veiculos.some((v) =>
          (v.modeloVeiculo || "").toLowerCase().includes(termo)
        )
      );
    })
    .sort((a, b) => {
      if (sortOrder === "az") return (a.nome || "").localeCompare(b.nome || "");
      if (sortOrder === "za") return (b.nome || "").localeCompare(a.nome || "");
      return 0;
    });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyClient);
    setDialogOpen(true);
  };

  const openEdit = (client: Cliente) => {
    if (!client.id) return;

    setEditingId(client.id);

    setForm({
      nome: client.nome || "",
      email: client.email || "",
      senha: "",
      cpf: client.cpf || "",
      telefone: client.telefone || "",
      status: "lead",
    });

    setDialogOpen(true);
  };

  const openVehicles = (client: Cliente) => {
    setSelectedClient(client);
    setVehiclesDialogOpen(true);
  };

  const openEditVehicle = (vehicle: Veiculo) => {
    setSelectedVehicle(vehicle);

    setVehicleForm({
      modeloVeiculo: vehicle.modeloVeiculo || "",
      marcaVeiculo: vehicle.marcaVeiculo || "Toyota",
      anoVeiculo: vehicle.anoVeiculo || "",
      corVeiculo: vehicle.corVeiculo || "",
      motorVeiculo: vehicle.motorVeiculo || "",
      combustivelVeiculo: vehicle.combustivelVeiculo || "",
      cambioVeiculo: vehicle.cambioVeiculo || "",
      fotoCarroUrl: vehicle.fotoCarroUrl || "",
      valorTotal: String(vehicle.valorTotal || ""),
      valorEntrada: String(vehicle.valorEntrada || ""),
      valorFinanciado: String(vehicle.valorFinanciado || ""),
      parcelasTotais: String(vehicle.parcelasTotais || ""),
      parcelasPagas: String(vehicle.parcelasPagas || ""),
      parcelasRestantes: String(vehicle.parcelasRestantes || ""),
      valorParcela: String(vehicle.valorParcela || ""),
      taxaJuros: String(vehicle.taxaJuros || ""),
      statusFinanciamento: vehicle.statusFinanciamento || "",
      statusGarantia: vehicle.statusGarantia || "",
      dataProximaRevisao: vehicle.dataProximaRevisao || "",
      acessorios: vehicle.acessorios || "",
    });

    setVehicleEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error(t("Preencha nome e telefone."));
      return;
    }

    if (!editingId && (!form.email.trim() || !form.senha.trim())) {
      toast.error(t("Para criar acesso, preencha email e senha."));
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await api.atualizarCliente(editingId, {
          nome: form.nome,
          email: form.email,
          cpf: form.cpf,
          telefone: form.telefone,
        });

        toast.success(t("Cliente atualizado!"));
      } else {
        await api.cadastrar({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          cpf: form.cpf,
          telefone: form.telefone,
          endereco: "",
        });

        toast.success(t("Cliente criado com acesso!"));
      }

      setDialogOpen(false);
      setForm(emptyClient);
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : t("Erro ao salvar cliente no backend.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!selectedVehicle?.id) {
      toast.error(t("Veículo inválido."));
      return;
    }

    try {
      setLoading(true);

      await api.atualizarVeiculo(selectedVehicle.id, {
        modeloVeiculo: vehicleForm.modeloVeiculo,
        marcaVeiculo: vehicleForm.marcaVeiculo,
        anoVeiculo: vehicleForm.anoVeiculo,
        corVeiculo: vehicleForm.corVeiculo,
        motorVeiculo: vehicleForm.motorVeiculo,
        combustivelVeiculo: vehicleForm.combustivelVeiculo,
        cambioVeiculo: vehicleForm.cambioVeiculo,
        fotoCarroUrl: vehicleForm.fotoCarroUrl,
        valorTotal: Number(vehicleForm.valorTotal || 0),
        valorEntrada: Number(vehicleForm.valorEntrada || 0),
        valorFinanciado: Number(vehicleForm.valorFinanciado || 0),
        parcelasTotais: Number(vehicleForm.parcelasTotais || 0),
        parcelasPagas: Number(vehicleForm.parcelasPagas || 0),
        parcelasRestantes: Number(vehicleForm.parcelasRestantes || 0),
        valorParcela: Number(vehicleForm.valorParcela || 0),
        taxaJuros: Number(vehicleForm.taxaJuros || 0),
        statusFinanciamento: vehicleForm.statusFinanciamento,
        statusGarantia: vehicleForm.statusGarantia,
        dataProximaRevisao: vehicleForm.dataProximaRevisao,
        acessorios: vehicleForm.acessorios,
      });

      toast.success(t("Veículo atualizado!"));
      setVehicleEditOpen(false);
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);

      toast.error(
        error instanceof Error ? error.message : t("Erro ao atualizar veículo.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletarCliente(id);
      setDeleteConfirm(null);
      toast.success(t("Cliente removido!"));
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error(t("Erro ao excluir cliente."));
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    try {
      await api.deletarVeiculo(id);
      setDeleteVehicleConfirm(null);
      toast.success(t("Veículo removido!"));
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast.error(t("Erro ao excluir veículo."));
    }
  };

  const handleAddVehicle = (clientId?: number) => {
    if (!clientId) {
      toast.error(t("Cliente inválido."));
      return;
    }

    localStorage.setItem("toyota_selected_client_id", String(clientId));
    navigate("/pedidos/novo");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="animate-reveal-up">
          <h1 className="text-xl font-semibold">{t("Clientes")}</h1>

          <p className="text-sm text-muted-foreground">
            {t("{count} clientes cadastrados", { count: clients.length })}
          </p>
        </div>

        <Button
          onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.97] transition-all animate-reveal-up delay-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("Novo cliente")}
        </Button>
      </div>

      <div className="flex gap-2 animate-reveal-up delay-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder={t("Buscar cliente...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setSortOrder((prev) =>
              prev === "az" ? "za" : prev === "za" ? null : "az"
            )
          }
          className={sortOrder ? "border-primary/50 text-primary" : ""}
        >
          {sortOrder === "za" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ArrowUpAZ className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {loadingClients && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("Carregando clientes...")}
          </p>
        )}

        {!loadingClients && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("Nenhum cliente encontrado.")}
          </p>
        )}

        {!loadingClients &&
          filtered.map((c, i) => {
            const status = statusConfig.lead;
            const veiculos = c.id ? vehiclesByClient[c.id] || [] : [];
            const resumoVeiculos =
              veiculos.length === 0
                ? t("Sem veículo")
                : t("{count} veículo(s)", { count: veiculos.length });

            return (
              <div
                key={c.id}
                className={`p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all animate-reveal-up delay-${Math.min(
                  i + 2,
                  5
                )}`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0">
                      {(c.nome || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.nome}</p>

                      <p className="text-xs text-muted-foreground">
                        {resumoVeiculos} · {c.telefone || c.email || t("Sem contato")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {t(status.label)}
                    </span>

                    <button
                      onClick={() => openVehicles(c)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors"
                      title={t("Ver veículos")}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => handleAddVehicle(c.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors"
                      title={t("Adicionar veículo")}
                    >
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => openEdit(c)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors"
                      title={t("Editar cliente")}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => c.id && setDeleteConfirm(c.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/15 transition-colors"
                      title={t("Excluir cliente")}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                    <a
                      href={`tel:${c.telefone || ""}`}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors"
                      title={t("Ligar")}
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <Dialog open={vehiclesDialogOpen} onOpenChange={setVehiclesDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Veículos de {name}", { name: selectedClient?.nome || "" })}</DialogTitle>
            <DialogDescription>
              {t("Visualize, edite ou remova veículos vinculados a este cliente.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedClient?.id &&
              (vehiclesByClient[selectedClient.id] || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("Nenhum veículo cadastrado para este cliente.")}
                </p>
              )}

            {selectedClient?.id &&
              (vehiclesByClient[selectedClient.id] || []).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <div className="flex gap-4 p-4 items-center">
                    {vehicle.fotoCarroUrl ? (
                      <img
                        src={vehicle.fotoCarroUrl}
                        alt={vehicle.modeloVeiculo || t("Veículos")}
                        className="w-28 h-20 object-cover rounded-lg bg-secondary"
                      />
                    ) : (
                      <div className="w-28 h-20 rounded-lg bg-secondary flex items-center justify-center">
                        <Car className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">
                        {vehicle.modeloVeiculo || t("Veículo sem modelo")}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {vehicle.anoVeiculo || t("Ano não informado")} ·{" "}
                        {vehicle.corVeiculo || t("Cor não informada")} · {t("Chassi")}:{" "}
                        {vehicle.chassiVeiculo || t("Não informado")}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {t("Total:")} {formatMoney(vehicle.valorTotal)} · {t("Parcela:")}{" "}
                        {formatMoney(vehicle.valorParcela)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditVehicle(vehicle)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        {t("Editar")}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          vehicle.id && setDeleteVehicleConfirm(vehicle.id)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t("Excluir")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVehiclesDialogOpen(false)}
            >
              {t("Fechar")}
            </Button>

            <Button onClick={() => handleAddVehicle(selectedClient?.id)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("Adicionar veículo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleEditOpen} onOpenChange={setVehicleEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Editar veículo")}</DialogTitle>
            <DialogDescription>
              {t("Edite os dados técnicos e financeiros deste veículo.")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>{t("Modelo")}</Label>
              <Input
                value={vehicleForm.modeloVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    modeloVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Marca")}</Label>
              <Input
                value={vehicleForm.marcaVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    marcaVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Ano")}</Label>
              <Input
                value={vehicleForm.anoVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    anoVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Cor")}</Label>
              <Input
                value={vehicleForm.corVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    corVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Motor")}</Label>
              <Input
                value={vehicleForm.motorVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    motorVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Combustível")}</Label>
              <Input
                value={vehicleForm.combustivelVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    combustivelVeiculo: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Câmbio")}</Label>
              <Input
                value={vehicleForm.cambioVeiculo}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    cambioVeiculo: e.target.value,
                  })
                }
              />
            </div>

            

            <div className="space-y-2">
              <Label>{t("Valor total")}</Label>
              <Input
                type="number"
                value={vehicleForm.valorTotal}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    valorTotal: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Entrada")}</Label>
              <Input
                type="number"
                value={vehicleForm.valorEntrada}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    valorEntrada: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Valor financiado")}</Label>
              <Input
                type="number"
                value={vehicleForm.valorFinanciado}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    valorFinanciado: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Valor parcela")}</Label>
              <Input
                type="number"
                value={vehicleForm.valorParcela}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    valorParcela: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Parcelas totais")}</Label>
              <Input
                type="number"
                value={vehicleForm.parcelasTotais}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    parcelasTotais: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Parcelas pagas")}</Label>
              <Input
                type="number"
                value={vehicleForm.parcelasPagas}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    parcelasPagas: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Parcelas restantes")}</Label>
              <Input
                type="number"
                value={vehicleForm.parcelasRestantes}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    parcelasRestantes: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Taxa de juros")}</Label>
              <Input
                type="number"
                value={vehicleForm.taxaJuros}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    taxaJuros: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Status financiamento")}</Label>
              <Input
                value={vehicleForm.statusFinanciamento}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    statusFinanciamento: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Status garantia")}</Label>
              <Input
                value={vehicleForm.statusGarantia}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    statusGarantia: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Próxima revisão")}</Label>
              <Input
                type="date"
                value={vehicleForm.dataProximaRevisao}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    dataProximaRevisao: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{t("Acessórios")}</Label>
              <Input
                value={vehicleForm.acessorios}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    acessorios: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleEditOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={handleSaveVehicle} disabled={loading}>
              {loading ? t("Salvando...") : t("Salvar veículo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t("Editar cliente") : t("Novo cliente")}</DialogTitle>

            <DialogDescription>
              {editingId
                ? t("Atualize as informações do cliente.")
                : t("Preencha os dados do novo cliente e crie o acesso dele.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("Nome")}</Label>

              <Input
                value={form.nome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome: e.target.value,
                  })
                }
                placeholder={t("Nome completo")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Email")}</Label>

              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="customer@example.com"
                disabled={!!editingId}
              />
            </div>

            {!editingId && (
              <div className="space-y-2">
                <Label>{t("Senha de acesso")}</Label>

                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      senha: e.target.value,
                    })
                  }
                  placeholder={t("Ex: 123456")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("CPF")}</Label>

              <Input
                value={form.cpf}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cpf: e.target.value,
                  })
                }
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Telefone")}</Label>

              <Input
                value={form.telefone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    telefone: e.target.value,
                  })
                }
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("Cancelar")}
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? t("Salvando...") : t("Salvar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Excluir cliente")}</DialogTitle>

            <DialogDescription>
              {t("Tem certeza que deseja remover este cliente?")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("Cancelar")}
            </Button>

            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t("Excluir")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteVehicleConfirm !== null}
        onOpenChange={() => setDeleteVehicleConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Excluir veículo")}</DialogTitle>

            <DialogDescription>
              {t("Tem certeza que deseja remover este veículo?")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteVehicleConfirm(null)}
            >
              {t("Cancelar")}
            </Button>

            <Button
              variant="destructive"
              onClick={() =>
                deleteVehicleConfirm && handleDeleteVehicle(deleteVehicleConfirm)
              }
            >
              {t("Excluir")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;