
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

import { format } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// API LOCAL - SPRING BOOT
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8083/api"
).replace(/\/+$/, "");

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
];

type AppointmentType =
  | "visita"
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
  clientId?: number;
  type: AppointmentType;
  description: string;
};

type AppointmentApiResponse = {
  id: number;
  data: string;
  horario?: string;
  cliente?: {
    id?: number;
    nome?: string;
  };
  tipoServico?: string;
  observacao?: string;
  status?: string;
};

const typeConfig = {
  visita: {
    label: "Visita",
    icon: MapPin,
    className: "bg-primary/15 text-primary",
  },
  ligacao: {
    label: "Ligação",
    icon: Phone,
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  "test-drive": {
    label: "Test Drive",
    icon: Car,
    className: "bg-success/15 text-success",
  },
  retirada: {
    label: "Retirada",
    icon: CheckCircle2,
    className: "bg-success/15 text-success",
  },
  revisao: {
    label: "Revisão",
    icon: Wrench,
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  recall: {
    label: "Recall",
    icon: AlertTriangle,
    className: "bg-warning/15 text-amber-700 dark:text-amber-300",
  },
  outros: {
    label: "Outros",
    icon: CalendarDays,
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
};

const isAppointmentType = (
  value: string
): value is AppointmentType =>
  Object.prototype.hasOwnProperty.call(typeConfig, value);

const mapTipoServico = (
  tipoServico?: string
): AppointmentType => {
  const tipo = (tipoServico || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (tipo.includes("revis")) return "revisao";
  if (tipo.includes("retirada")) return "retirada";
  if (tipo.includes("recall")) return "recall";
  if (tipo.includes("liga")) return "ligacao";
  if (tipo.includes("test")) return "test-drive";
  if (tipo.includes("outro")) return "outros";

  return "visita";
};

// Normaliza a data recebida pelo Spring Boot.
// Aceita yyyy-MM-dd ou uma data ISO com horário.
const normalizarData = (data?: string): string => {
  if (!data) return "";

  return data.substring(0, 10);
};

// Normaliza o horário recebido pela API.
const normalizarHorario = (horario?: string): string => {
  if (!horario) return "";

  return horario.substring(0, 5);
};

const Schedule = () => {
  const { clients } = useAppContext();
  const { t, language, dateLocale } = useLanguage();

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date()
  );

  const [month, setMonth] = useState<Date>(new Date());

  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(
    null
  );

  const [appointments, setAppointments] = useState<Appointment[]>(
    []
  );

  const [loading, setLoading] = useState(false);

  const [loadingAppointments, setLoadingAppointments] =
    useState(true);

  const [form, setForm] = useState({
    time: "",
    client: "",
    type: "visita" as AppointmentType,
    description: "",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const dateFormat =
    language === "pt"
      ? "d 'de' MMMM, yyyy"
      : language === "es"
        ? "d 'de' MMMM 'de' yyyy"
        : language === "ja"
          ? "yyyy年M月d日"
          : "MMMM d, yyyy";

  const formattedDate = format(
    selectedDate,
    dateFormat,
    { locale: dateLocale }
  );

  // ==========================================
  // CARREGAR AGENDAMENTOS DO BACKEND
  // ==========================================

  const carregarAgendamentos = useCallback(async () => {
    try {
      setLoadingAppointments(true);

      const url = `${API_URL}/agendamentos`;

      console.log("=================================");
      console.log("CARREGANDO AGENDAMENTOS");
      console.log("URL:", url);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      console.log("STATUS:", response.status);

      if (!response.ok) {
        const erro = await response.text();

        console.error(
          "ERRO RETORNADO PELO BACKEND:",
          erro
        );

        throw new Error(
          `Erro HTTP ${response.status}`
        );
      }

      const data: AppointmentApiResponse[] =
        await response.json();

      console.log("DADOS RECEBIDOS:", data);

      if (!Array.isArray(data)) {
        throw new Error(
          "O backend não retornou uma lista de agendamentos."
        );
      }

      const dadosFormatados: Appointment[] = data.map(
        (item) => ({
          id: item.id,
          date: normalizarData(item.data),
          time: normalizarHorario(item.horario),
          client:
            item.cliente?.nome ||
            t("Cliente não informado"),
          clientId: item.cliente?.id,
          type: mapTipoServico(item.tipoServico),
          description:
            item.observacao ||
            item.tipoServico ||
            "",
        })
      );

      console.log(
        "AGENDAMENTOS FORMATADOS:",
        dadosFormatados
      );

      setAppointments(dadosFormatados);

    } catch (error) {
      console.error(
        "Erro ao carregar agendamentos:",
        error
      );

      toast.error(
        t("Erro ao carregar agendamentos.")
      );

      setAppointments([]);

    } finally {
      setLoadingAppointments(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarAgendamentos();
  }, [carregarAgendamentos]);

  // ==========================================
  // FILTRO DOS AGENDAMENTOS POR DATA
  // ==========================================

  const dayAppointments = appointments
    .filter((appointment) => {
      return appointment.date === dateStr;
    })
    .sort((a, b) =>
      a.time.localeCompare(b.time)
    );

  const datesWithAppointments = [
    ...new Set(
      appointments.map((appointment) => appointment.date)
    ),
  ]
    .filter(Boolean)
    .map((date) => new Date(`${date}T12:00:00`));

  const bookedTimeSlots = new Set(
    appointments
      .filter(
        (appointment) =>
          appointment.date === dateStr
      )
      .map((appointment) => appointment.time)
  );

  // ==========================================
  // CRIAR AGENDAMENTO
  // ==========================================

  const handleSave = async () => {
    if (!form.time || !form.client.trim()) {
      toast.error(
        t("Preencha horário e cliente")
      );
      return;
    }

    if (bookedTimeSlots.has(form.time)) {
      toast.error(
        t("Esse horário já está reservado para a data selecionada.")
      );
      return;
    }

    const clienteSelecionado = clients.find(
      (client) =>
        client.name.trim().toLowerCase() ===
        form.client.trim().toLowerCase()
    );

    if (!clienteSelecionado) {
      toast.error(
        t("Selecione um cliente cadastrado no sistema.")
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/agendamentos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            clienteId: clienteSelecionado.id,
            data: dateStr,
            horario: `${form.time}:00`,
            tipoServico: typeConfig[form.type].label,
            observacao: form.description,
          }),
        }
      );

      if (!response.ok) {
        const erro = await response.text();

        console.error(
          "Erro ao criar agendamento:",
          erro
        );

        if (response.status === 409) {
          throw new Error(
            t("Esse horário já está reservado.")
          );
        }

        throw new Error(
          t("Não foi possível salvar o agendamento.")
        );
      }

      await carregarAgendamentos();

      toast.success(
        t("Agendamento criado!")
      );

      setDialogOpen(false);

      setForm({
        time: "",
        client: "",
        type: "visita",
        description: "",
      });

    } catch (error) {
      console.error(
        "Erro ao salvar agendamento:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : t("Erro ao salvar agendamento.")
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EXCLUIR AGENDAMENTO
  // ==========================================

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `${API_URL}/agendamentos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          t("Não foi possível remover o agendamento.")
        );
      }

      await carregarAgendamentos();

      setDeleteConfirm(null);

      toast.success(
        t("Agendamento removido!")
      );

    } catch (error) {
      console.error(
        "Erro ao excluir agendamento:",
        error
      );

      toast.error(
        t("Erro ao remover agendamento.")
      );
    }
  };

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="space-y-6">

      <a
        href="#agenda-conteudo"
        className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:ring-2 focus:ring-ring"
      >
        {t("Ir para o conteúdo da agenda")}
      </a>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div className="animate-reveal-up">

          <h1
            id="agenda-conteudo"
            tabIndex={-1}
            className="text-xl font-semibold"
          >
            {t("Agenda")}
          </h1>

          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
          >
            {formattedDate}
          </p>

        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          aria-label={t(
            "Novo agendamento para {date}",
            { date: formattedDate }
          )}
          className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.97] transition-all animate-reveal-up delay-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("Novo agendamento")}
        </Button>

      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">

        {/* CALENDÁRIO */}

        <section
          aria-labelledby="calendario-agenda-titulo"
          className="rounded-lg border border-border bg-card p-2 animate-reveal-up delay-1 self-start"
        >

          <h2
            id="calendario-agenda-titulo"
            className="sr-only"
          >
            {t("Calendário de agendamentos")}
          </h2>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            month={month}
            onMonthChange={setMonth}
            locale={dateLocale}
            className="pointer-events-auto"
            disabled={(date) =>
              date < new Date(
                new Date().setHours(0, 0, 0, 0)
              )
            }
            modifiers={{
              hasAppointment: datesWithAppointments,
            }}
            modifiersClassNames={{
              hasAppointment:
                "border-2 border-primary/50",
            }}
          />

          <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">

            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border-2 border-primary/50"
            />

            <span>
              {t("Dias com agendamentos")}
            </span>

          </div>

        </section>

        {/* COMPROMISSOS DO DIA */}

        <section
          aria-labelledby="compromissos-titulo"
          aria-busy={loadingAppointments}
          className="space-y-3 animate-reveal-up delay-2"
        >

          <h2
            id="compromissos-titulo"
            aria-live="polite"
            className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            {t("Compromissos · {count}", {
              count: dayAppointments.length,
            })}
          </h2>

          {loadingAppointments ? (

            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground py-8 text-center"
            >
              {t("Carregando agendamentos...")}
            </p>

          ) : dayAppointments.length === 0 ? (

            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground py-8 text-center"
            >
              {t("Nenhum compromisso neste dia.")}
            </p>

          ) : (

            <ul className="space-y-2">

              {dayAppointments.map((appointment) => {

                const config =
                  typeConfig[appointment.type];

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

                          <p className="font-medium text-sm">
                            {appointment.client}
                          </p>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${config.className}`}
                          >
                            <Icon
                              aria-hidden="true"
                              className="h-3 w-3"
                            />

                            {t(config.label)}
                          </span>

                        </div>

                        <p className="text-xs text-muted-foreground">
                          {appointment.description}
                        </p>

                      </div>

                      <button
                        type="button"
                        aria-label={t(
                          "Excluir agendamento de {client} às {time}",
                          {
                            client: appointment.client,
                            time: appointment.time,
                          }
                        )}
                        onClick={() =>
                          setDeleteConfirm(appointment.id)
                        }
                        className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/15 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2
                          aria-hidden="true"
                          className="h-3.5 w-3.5 text-muted-foreground"
                        />
                      </button>

                    </div>

                  </li>
                );
              })}

            </ul>

          )}

        </section>

      </div>

      {/* MODAL DE NOVO AGENDAMENTO */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>
              {t("Novo agendamento")}
            </DialogTitle>

            <DialogDescription>
              {t("Agende um compromisso para {date}.", {
                date: formattedDate,
              })}
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* HORÁRIO */}

            <div className="space-y-2">

              <Label htmlFor="agenda-horario">
                {t("Horário disponível")}
              </Label>

              <Select
                value={form.time}
                onValueChange={(time) =>
                  setForm((current) => ({
                    ...current,
                    time,
                  }))
                }
              >

                <SelectTrigger
                  id="agenda-horario"
                  aria-label={t(
                    "Selecionar horário disponível"
                  )}
                >
                  <SelectValue
                    placeholder={t(
                      "Selecione um horário"
                    )}
                  />
                </SelectTrigger>

                <SelectContent>

                  {TIME_SLOTS.map((time) => (

                    <SelectItem
                      key={time}
                      value={time}
                      disabled={bookedTimeSlots.has(time)}
                    >
                      {time}
                      {bookedTimeSlots.has(time)
                        ? t(" — já reservado")
                        : ""}
                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

              {TIME_SLOTS.every((time) =>
                bookedTimeSlots.has(time)
              ) && (

                <p
                  role="status"
                  className="text-sm text-muted-foreground"
                >
                  {t(
                    "Não há horários disponíveis para esta data."
                  )}
                </p>

              )}

            </div>

            {/* CLIENTE */}

            <div className="space-y-2">

              <Label htmlFor="agenda-cliente">
                {t("Cliente")}
              </Label>

              <Input
                id="agenda-cliente"
                value={form.client}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    client: event.target.value,
                  }))
                }
                placeholder={t(
                  "Digite o nome do cliente"
                )}
                list="agenda-clientes-cadastrados"
              />

              <datalist id="agenda-clientes-cadastrados">
                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.name}
                  />
                ))}
              </datalist>

            </div>

            {/* TIPO */}

            <div className="space-y-2">

              <Label htmlFor="agenda-tipo">
                {t("Tipo")}
              </Label>

              <Select
                value={form.type}
                onValueChange={(value) => {
                  if (isAppointmentType(value)) {
                    setForm((current) => ({
                      ...current,
                      type: value,
                    }));
                  }
                }}
              >

                <SelectTrigger id="agenda-tipo">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="visita">
                    {t("Visita")}
                  </SelectItem>

                  <SelectItem value="ligacao">
                    {t("Ligação")}
                  </SelectItem>

                  <SelectItem value="test-drive">
                    {t("Test Drive")}
                  </SelectItem>

                  <SelectItem value="retirada">
                    {t("Retirada")}
                  </SelectItem>

                  <SelectItem value="revisao">
                    {t("Revisão")}
                  </SelectItem>

                  <SelectItem value="recall">
                    {t("Recall")}
                  </SelectItem>

                  <SelectItem value="outros">
                    {t("Outros")}
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

            {/* DESCRIÇÃO */}

            <div className="space-y-2">

              <Label htmlFor="agenda-descricao">
                {t("Descrição")}
              </Label>

              <Input
                id="agenda-descricao"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder={t(
                  "Detalhes do compromisso"
                )}
              />

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              {t("Cancelar")}
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading
                ? t("Salvando...")
                : t("Salvar")}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}

      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null);
          }
        }}
      >

        <DialogContent className="sm:max-w-sm">

          <DialogHeader>

            <DialogTitle>
              {t("Excluir agendamento")}
            </DialogTitle>

            <DialogDescription>
              {t(
                "Tem certeza que deseja remover este compromisso?"
              )}
            </DialogDescription>

          </DialogHeader>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              {t("Cancelar")}
            </Button>

            <Button
              variant="destructive"
              aria-label={t(
                "Confirmar exclusão do agendamento"
              )}
              onClick={() => {
                if (deleteConfirm !== null) {
                  void handleDelete(deleteConfirm);
                }
              }}
            >
              {t("Excluir")}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
};

export default Schedule;
