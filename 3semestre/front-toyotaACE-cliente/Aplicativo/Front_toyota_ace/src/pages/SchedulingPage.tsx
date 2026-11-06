import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Agendamento, type Veiculo } from "@/services/api";
import {
  getAvailableAppointmentTimes,
  getInitialAppointmentDate,
  normalizeAppointmentTime,
} from "@/lib/scheduling";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";

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
  Plus,
  MapPin,
  Car,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { format } from "date-fns";
import { enUS, es, ja, ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type AppointmentType = | "visita"
  | "ligacao"
  | "test-drive"
  | "retirada"
  | "revisao"
  | "recall"
  | "outros";

type Appointment = {
  id: number;
  date: string;
  time: string;
  client: string;
  type: AppointmentType;
  description: string;
  vehicle?: Veiculo;
  concessionaria?: string;
};

const dealerships = [
  { name: "Toyota Centro", address: "Av. Paulista, 1500 - São Paulo" },
  { name: "Toyota Zona Sul", address: "Av. Santo Amaro, 3200 - São Paulo" },
  { name: "Toyota Campinas", address: "Rod. Anhanguera, km 95 - Campinas" },
  { name: "Toyota ABC", address: "Av. Industrial, 800 - Santo André" },
];

const typeConfig = {
  visita: {
    label: "Visita",
    icon: MapPin,
    className: "bg-purple-500/15 text-purple-400",
  },
  ligacao: {
    label: "Ligação",
    icon: MapPin,
    className: "bg-blue-500/15 text-blue-400",
  },
  "test-drive": {
    label: "Test Drive",
    icon: Car,
    className: "bg-green-500/15 text-green-400",
  },
  revisao: {
    label: "Revisão",
    icon: Car,
    className: "bg-blue-500/15 text-blue-400",
  },
  retirada: {
    label: "Retirada",
    icon: CheckCircle2,
    className: "bg-green-500/15 text-green-400",
  },
  recall: {
    label: "Recall",
    icon: AlertTriangle,
    className: "bg-yellow-500/15 text-yellow-500",
  },
  outros: {
    label: "Outros",
    icon: MapPin,
    className: "bg-purple-500/15 text-purple-400",
  },
};

const mapTipoServico = (tipoServico?: string): AppointmentType => {
  const tipo = (tipoServico || "").toLowerCase();

  if (tipo.includes("revis")) return "revisao";
  if (tipo.includes("retirada")) return "retirada";
  if (tipo.includes("recall")) return "recall";

  return "outros";
};

const formatAppointments = (
  response: Agendamento[],
  fallbackClient: string,
): Appointment[] =>
  response.map((item) => ({
    id: item.id,
    date: item.data,
    time: normalizeAppointmentTime(item.horario || ""),
    client: item.cliente?.nome || fallbackClient,
    type: mapTipoServico(item.tipoServico),
    description: item.observacao || "",
    vehicle: item.veiculo,
    concessionaria: item.concessionaria,
  }));

const getVehicleDetails = (vehicle: Veiculo) =>
  [
    ["Marca", vehicle.marcaVeiculo],
    ["Modelo", vehicle.modeloVeiculo],
    ["Ano", vehicle.anoVeiculo],
    ["Cor", vehicle.corVeiculo],
    ["Placa", vehicle.placaVeiculo],
    ["Chassi", vehicle.chassiVeiculo],
    ["Motor", vehicle.motorVeiculo],
    ["Combustível", vehicle.combustivelVeiculo],
    ["Câmbio", vehicle.cambioVeiculo],
    ["Status", vehicle.statusVeiculo],
    ["Progresso", vehicle.progressoVeiculo == null ? undefined : `${vehicle.progressoVeiculo}%`],
    ["Próxima revisão", vehicle.dataProximaRevisao],
    ["Valor Total", vehicle.valorTotal],
    ["Entrada", vehicle.valorEntrada],
    ["Valor Financiado", vehicle.valorFinanciado],
    ["Parcelas totais", vehicle.parcelasTotais],
    ["Parcelas pagas", vehicle.parcelasPagas],
    ["Parcelas restantes", vehicle.parcelasRestantes],
    ["Valor da parcela", vehicle.valorParcela],
    ["Taxa de juros", vehicle.taxaJuros],
    ["Status do financiamento", vehicle.statusFinanciamento],
    ["Garantia", vehicle.statusGarantia],
    ["Acessórios", vehicle.acessorios],
    ["VIN IoT", vehicle.vinIot],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

const SchedulingPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const dateLocale = language === "en-US" ? enUS : language === "es-ES" ? es : language === "ja-JP" ? ja : ptBR;

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialAppointmentDate);
  const [month, setMonth] = useState<Date>(getInitialAppointmentDate);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>();
  const [reservedAppointments, setReservedAppointments] = useState<{ date: string; time: string }[]>([]);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [time, setTime] = useState("");
  const [serviceType, setServiceType] = useState<AppointmentType>("retirada");
  const [selectedDealership, setSelectedDealership] = useState("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const formattedDate = format(
    selectedDate,
    language === "en-US"
      ? "MMMM d, yyyy"
      : language === "ja-JP"
        ? "yyyy年M月d日"
        : "d 'de' MMMM 'de' yyyy",
    { locale: dateLocale },
  );

  const availableTimes = getAvailableAppointmentTimes(dateStr, reservedAppointments);

  const carregarAgendamentos = useCallback(async (): Promise<{ date: string; time: string }[] | null> => {
    try {
      if (!user?.id) {
        setAppointments([]);
        setVehicles([]);
        setSelectedVehicleId(undefined);
        setLoadingAppointments(false);
        return [];
      }

      setLoadingAppointments(true);

      const [response, allAppointments, customerVehicles] = await Promise.all([
        api.buscarAgendamentosCliente(user.id),
        api.listarTodosAgendamentos(),
        api.listarVeiculosCliente(user.id),
      ]);
      const dadosFormatados = formatAppointments(
        response,
        user.nome || user.email || "",
      );
      setVehicles(customerVehicles);
      setSelectedVehicleId((current) =>
        current && customerVehicles.some((vehicle) => vehicle.id === current)
          ? current
          : customerVehicles[0]?.id,
      );
      const horariosOcupados = allAppointments.map((appointment) => ({
        date: appointment.data,
        time: normalizeAppointmentTime(appointment.horario),
      }));

      setAppointments(dadosFormatados);
      setReservedAppointments(horariosOcupados);
      setAvailabilityReady(true);
      return horariosOcupados;
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos.");
      setAvailabilityReady(false);
      return null;
    } finally {
      setLoadingAppointments(false);
    }
  }, [user?.email, user?.id, user?.nome]);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const dayAppointments = appointments
    .filter((appointment) => appointment.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const datesWithAppointments = [
    ...new Set(appointments.map((appointment) => appointment.date)),
  ];

  const handleSave = async () => {
    if (!time || !user?.id || !selectedVehicleId || !selectedDealership) {
      toast.error("Selecione o veículo, a concessionária e um horário disponível.");
      return;
    }

    try {
      setLoading(true);

      const latestReservedAppointments = await carregarAgendamentos();
      if (!latestReservedAppointments) return;

      const latestAvailableTimes = getAvailableAppointmentTimes(dateStr, latestReservedAppointments);
      if (!latestAvailableTimes.includes(time)) {
        setTime("");
        toast.error("Este horário acabou de ser reservado. Escolha outro.");
        return;
      }

      const createdAppointment = await api.agendar({
        clienteId: user.id,
        veiculoId: selectedVehicleId,
        concessionaria: selectedDealership,
        email: user?.email,
        data: dateStr,
        horario: `${time}:00`,
        tipoServico: typeConfig[serviceType].label,
        observacao: `Agendamento de ${typeConfig[serviceType].label} realizado pelo portal Toyota ACE`,
      });

      if (
        createdAppointment.veiculo?.id !== selectedVehicleId ||
        createdAppointment.concessionaria !== selectedDealership
      ) {
        await carregarAgendamentos();
        toast.error(
          "O servidor não confirmou os dados do agendamento. Atualize e reinicie o backend antes de criar um novo agendamento.",
        );
        return;
      }

      await carregarAgendamentos();

      toast.success("Agendamento criado!");
      setDialogOpen(false);
      setTime("");
      setServiceType("retirada");
      setSelectedDealership("");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível confirmar o agendamento."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletarAgendamento(id);
      await carregarAgendamentos();

      setDeleteConfirm(null);
      toast.success("Agendamento removido!");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Não foi possível remover o agendamento.");
    }
  };

  return (
    <div className="space-y-6">
      <a
        href="#agenda-conteudo"
        className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:ring-2 focus:ring-ring"
      >
        Ir para o conteúdo da agenda
      </a>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 id="agenda-conteudo" tabIndex={-1} className="text-xl font-semibold">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {formattedDate}
          </p>
        </div>

        <Button
          onClick={() => {
            setTime("");
            setSelectedDealership("");
            setDialogOpen(true);
          }}
          aria-label={`Novo agendamento para ${formattedDate}`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.97] transition-all"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <section
          aria-labelledby="calendario-agenda-titulo"
          className="rounded-lg border border-border bg-card p-2 self-start"
        >
          <h2 id="calendario-agenda-titulo" className="sr-only">
            Calendário de agendamentos
          </h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setTime("");
              }
            }}
            month={month}
            onMonthChange={setMonth}
            locale={dateLocale}
            className="pointer-events-auto"
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            modifiers={{
              hasAppointment: datesWithAppointments.map(
                (date) => new Date(`${date}T12:00:00`)
              ),
            }}
            modifiersClassNames={{
              hasAppointment: "border-2 border-primary/50",
            }}
          />
          <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border-2 border-primary/50"
            />
            <span>Dias com agendamentos</span>
          </div>
        </section>

        <section
          aria-labelledby="compromissos-titulo"
          aria-busy={loadingAppointments}
          className="space-y-3"
        >
          <h2
            id="compromissos-titulo"
            aria-live="polite"
            className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            Compromissos · {dayAppointments.length}
          </h2>

          {loadingAppointments ? (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground py-8 text-center">
              Carregando agendamentos...
            </p>
          ) : dayAppointments.length === 0 ? (
            <p role="status" className="text-sm text-muted-foreground py-8 text-center">
              Nenhum compromisso neste dia.
            </p>
          ) : (
            <ul className="space-y-2">
              {dayAppointments.map((appointment) => {
                const config = typeConfig[appointment.type];
                const Icon = config.icon;

                return (
                  <li
                    key={appointment.id}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center shrink-0 pt-0.5">
                        <p className="text-lg font-bold tabular-nums">
                          {appointment.time}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">{appointment.client}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${config.className}`}>
                            <Icon aria-hidden="true" className="h-3 w-3" />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {appointment.description || "Sem observação"}
                        </p>
                        {appointment.concessionaria && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            {appointment.concessionaria}
                          </p>
                        )}
                        {appointment.vehicle ? (
                          <div className="mt-3 rounded-md bg-muted/50 p-3">
                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                              <Car aria-hidden="true" className="h-4 w-4" />
                              {appointment.vehicle.marcaVeiculo || "Toyota"}{" "}
                              {appointment.vehicle.modeloVeiculo || "Veículo"}
                            </p>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                              {getVehicleDetails(appointment.vehicle).map(([label, value]) => (
                                <div key={label} className="flex gap-1">
                                  <dt className="font-medium text-muted-foreground">{label}:</dt>
                                  <dd className="break-all">{String(value)}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Veículo não informado neste agendamento.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        aria-label={`Excluir agendamento de ${appointment.client} às ${appointment.time}`}
                        onClick={() => setDeleteConfirm(appointment.id)}
                        className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/15 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              Escolha um horário disponível para {formattedDate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agenda-concessionaria">Concessionária</Label>
              <Select
                value={selectedDealership}
                onValueChange={setSelectedDealership}
              >
                <SelectTrigger
                  id="agenda-concessionaria"
                  aria-label="Selecionar concessionária"
                >
                  <SelectValue placeholder="Selecione uma concessionária" />
                </SelectTrigger>
                <SelectContent>
                  {dealerships.map((dealership) => {
                    const value = `${dealership.name} — ${dealership.address}`;
                    return (
                      <SelectItem key={dealership.name} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-veiculo">Veículo</Label>
              <Select
                value={selectedVehicleId?.toString() || ""}
                onValueChange={(value) => setSelectedVehicleId(Number(value))}
                disabled={loadingAppointments || vehicles.length === 0}
              >
                <SelectTrigger id="agenda-veiculo" aria-label="Selecionar veículo">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                      {[vehicle.marcaVeiculo, vehicle.modeloVeiculo, vehicle.anoVeiculo, vehicle.placaVeiculo]
                        .filter(Boolean)
                        .join(" · ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingAppointments && vehicles.length === 0 && (
                <p role="status" className="text-sm text-destructive">
                  Não há veículos cadastrados para sua conta. Cadastre um veículo antes de agendar.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-servico">Serviço</Label>
              <Select
                value={serviceType}
                onValueChange={(value) => setServiceType(value as AppointmentType)}
              >
                <SelectTrigger id="agenda-servico" aria-label="Selecionar serviço">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirada">Retirada</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="recall">Recall</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Label htmlFor="agenda-horario">Horário disponível</Label>
            <Select
              value={time}
              onValueChange={setTime}
              disabled={loadingAppointments || !availabilityReady || availableTimes.length === 0}
            >
              <SelectTrigger id="agenda-horario" aria-label="Selecionar horário disponível">
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((availableTime) => (
                  <SelectItem key={availableTime} value={availableTime}>
                    {availableTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availabilityReady && availableTimes.length === 0 && (
              <p role="status" className="text-sm text-muted-foreground">
                Não há horários disponíveis para esta data.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading || !time || !selectedVehicleId || !selectedDealership || !availabilityReady || availableTimes.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Salvando..." : "Confirmar agendamento"}
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
            <DialogTitle>Excluir agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este compromisso?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm !== null) {
                  handleDelete(deleteConfirm);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingPage;