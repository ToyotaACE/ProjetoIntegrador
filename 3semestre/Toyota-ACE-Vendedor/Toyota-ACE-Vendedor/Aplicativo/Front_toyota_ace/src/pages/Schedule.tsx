import { useEffect, useState } from "react";
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
import { Plus, MapPin, Phone, Car, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";

type AppointmentType = | "visita"
  | "ligacao"
  | "test-drive"
  | "retirada"
  | "revisao";

type Appointment = {
  id: number;
  date: string;
  time: string;
  client: string;
  clientId?: number;
  email?: string;
  type: AppointmentType;
  description: string;
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
    className: "bg-blue-500/15 text-blue-400",
  },
  "test-drive": {
    label: "Test Drive",
    icon: Car,
    className: "bg-success/15 text-green-400",
  },
  "retirada": {
    label: "Test Drive",
    icon: Car,
    className: "bg-success/15 text-green-400",
  },
  "revisao": {
    label: "Test Drive",
    icon: Car,
    className: "bg-success/15 text-green-400",
  },
};


const mapTipoServico = (tipoServico?: string): AppointmentType => {
  const tipo = (tipoServico || "").toLowerCase();

  if (tipo.includes("liga")) return "ligacao";
  if (tipo.includes("test")) return "test-drive";

  return "visita";
};

const Schedule = () => {
  const { clients } = useAppContext();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    time: "",
    client: "",
    type: "visita" as AppointmentType,
    description: "",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const formattedDate = format(selectedDate, "d 'de' MMMM, yyyy", {
    locale: ptBR,
  });

  const carregarAgendamentos = async () => {
    try {
      const response = await fetch(`${API_URL}/agendamentos`);
      const data = await response.json();

      const dadosFormatados: Appointment[] = data.map((item: any) => ({
        id: item.id,
        date: item.data,
        time: item.horario?.substring(0, 5) || "",
        client: item.cliente?.nome || "Cliente não informado",
        clientId: item.cliente?.id,
        email: item.cliente?.email,
        type: mapTipoServico(item.tipoServico),
        description: item.observacao || item.tipoServico || "",
      }));

      setAppointments(dadosFormatados);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos.");
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const dayAppointments = appointments
    .filter((a) => a.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const datesWithAppointments = [...new Set(appointments.map((a) => a.date))];

  const handleSave = async () => {
    if (!form.time || !form.client.trim()) {
      toast.error("Preencha horário e cliente");
      return;
    }

    try {
      setLoading(true);

      const clienteSelecionado = clients.find(
        (client: any) =>
          client.name?.toLowerCase() === form.client.toLowerCase() ||
          client.nome?.toLowerCase() === form.client.toLowerCase() ||
          client.email?.toLowerCase() === form.client.toLowerCase()
      );

      await fetch(`${API_URL}/agendamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId: clienteSelecionado?.id || 1,
          email: clienteSelecionado?.email,
          data: dateStr,
          horario: `${form.time}:00`,
          tipoServico: typeConfig[form.type].label,
          observacao: form.description,
        }),
      });

      await carregarAgendamentos();

      toast.success("Agendamento criado!");
      setDialogOpen(false);
      setForm({
        time: "",
        client: "",
        type: "visita",
        description: "",
      });
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      toast.error("Erro ao salvar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}/agendamentos/${id}`, {
        method: "DELETE",
      });

      await carregarAgendamentos();

      setDeleteConfirm(null);
      toast.success("Agendamento removido!");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao remover agendamento.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="animate-reveal-up">
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.97] transition-all animate-reveal-up delay-1"
        >
          <Plus className="h-4 w-4 mr-1" /> Novo agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg border border-border bg-card p-2 animate-reveal-up delay-1 self-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            month={month}
            onMonthChange={setMonth}
            locale={ptBR}
            className="pointer-events-auto"
            modifiers={{
              hasAppointment: datesWithAppointments.map(
                (d) => new Date(d + "T12:00:00")
              ),
            }}
            modifiersClassNames={{
              hasAppointment: "border-2 border-primary/50",
            }}
          />
        </div>

        <div className="space-y-3 animate-reveal-up delay-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Compromissos · {dayAppointments.length}
          </h2>

          {dayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum compromisso neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((a) => {
                const config = typeConfig[a.type];
                const Icon = config.icon;

                return (
                  <div
                    key={a.id}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center shrink-0 pt-0.5">
                        <p className="text-lg font-bold tabular-nums">
                          {a.time}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{a.client}</p>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${config.className}`}
                          >
                            <Icon className="h-3 w-3" /> {config.label}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {a.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setDeleteConfirm(a.id)}
                        className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/15 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              Agende um compromisso para {formattedDate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm({
                    ...form,
                    time: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                value={form.client}
                onChange={(e) =>
                  setForm({
                    ...form,
                    client: e.target.value,
                  })
                }
                placeholder="Digite nome ou email do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    type: v as typeof form.type,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="visita">Visita</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="test-drive">Test Drive</SelectItem>
                  <SelectItem value="test-drive">retirada</SelectItem>
                  <SelectItem value="test-drive">revisao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Detalhes do compromisso"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Salvando..." : "Salvar"}
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
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;


