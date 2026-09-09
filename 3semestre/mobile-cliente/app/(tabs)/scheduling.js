import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const serviceTypes = [
  {
    id: "retirada",
    label: "Retirada",
    icon: "checkmark-circle-outline",
    description: "Agendamento de Retirada realizado pelo app Toyota ACE",
  },
  {
    id: "revisao",
    label: "Revisão",
    icon: "car-sport-outline",
    description: "Agendamento de Revisão realizado pelo app Toyota ACE",
  },
  {
    id: "recall",
    label: "Recall",
    icon: "warning-outline",
    description: "Agendamento de Recall realizado pelo app Toyota ACE",
  },
  {
    id: "outros",
    label: "Outros",
    icon: "location-outline",
    description: "Agendamento realizado pelo app Toyota ACE",
  },
];

function getUserId(user) {
  return user?.id || user?.clienteId || user?.usuario?.id || null;
}

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function getUserName(user) {
  return user?.nome || user?.name || user?.nomeCliente || user?.email || "Cliente";
}

function formatDateToBackend(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateToDisplay(date) {
  return date.toLocaleDateString("pt-BR");
}

function createNextDates(days = 5) {
  const result = [];

  for (let index = 0; index < days; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index);

    result.push({
      label: formatDateToDisplay(date),
      value: formatDateToBackend(date),
    });
  }

  return result;
}

function mapTipoServico(tipoServico) {
  const tipo = String(tipoServico || "").toLowerCase();

  if (tipo.includes("revis")) return "revisao";
  if (tipo.includes("retirada")) return "retirada";
  if (tipo.includes("recall")) return "recall";

  return "outros";
}

function normalizeAppointment(item, user) {
  const type = mapTipoServico(item.tipoServico || item.tipo || item.servico);
  const service = serviceTypes.find((serviceItem) => serviceItem.id === type);

  return {
    id: item.id,
    date: item.data || item.date,
    time: item.horario ? String(item.horario).substring(0, 5) : item.time || "",
    type,
    label: service?.label || item.tipoServico || "Outros",
    icon: service?.icon || "calendar-outline",
    description:
      item.observacao ||
      item.descricao ||
      `Agendamento de ${service?.label || "atendimento"} realizado pelo app Toyota ACE`,
    client: item.cliente?.nome || getUserName(user),
  };
}

export default function SchedulingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const [serviceType, setServiceType] = useState("retirada");
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clienteId = getUserId(user);
  const email = getUserEmail(user);

  const dates = useMemo(() => createNextDates(5), []);

  const selectedService = serviceTypes.find((item) => item.id === serviceType);

  const appointmentsByDate = appointments
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const carregarAgendamentos = useCallback(async () => {
    try {
      setErrorMessage("");

      if (!clienteId) {
        setAppointments([]);
        setErrorMessage("Cliente não identificado. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_URL}/agendamentos/cliente/${clienteId}`);

      if (!response.ok) {
        throw new Error("Não foi possível carregar os agendamentos.");
      }

      const data = await response.json();

      const formattedAppointments = Array.isArray(data)
        ? data.map((item) => normalizeAppointment(item, user))
        : [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.log("Erro ao carregar agendamentos:", error);
      setErrorMessage("Não foi possível carregar seus agendamentos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteId, user]);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarAgendamentos();
  };

  const handleConfirm = async () => {
    try {
      setErrorMessage("");

      if (!clienteId) {
        setErrorMessage("Cliente não identificado. Faça login novamente.");
        return;
      }

      if (!selectedDate || !time) {
        setErrorMessage("Escolha uma data e um horário.");
        return;
      }

      const alreadyExists = appointments.some(
        (item) => item.date === selectedDate && item.time === time
      );

      if (alreadyExists) {
        setErrorMessage("Esse horário já foi agendado para esta data.");
        return;
      }

      setSaving(true);

      const response = await fetch(`${API_URL}/agendamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          email,
          data: selectedDate,
          horario: `${time}:00`,
          tipoServico: selectedService?.label || "Outros",
          observacao:
            selectedService?.description ||
            "Agendamento realizado pelo app Toyota ACE",
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível confirmar o agendamento.");
      }

      await carregarAgendamentos();

      setTime("");
      setErrorMessage("");

      Alert.alert("Sucesso", "Agendamento confirmado!");
    } catch (error) {
      console.log("Erro ao confirmar agendamento:", error);
      setErrorMessage("Não foi possível confirmar o agendamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Excluir agendamento", "Deseja remover este agendamento?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/agendamentos/${id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Não foi possível excluir o agendamento.");
            }

            await carregarAgendamentos();

            Alert.alert("Sucesso", "Agendamento removido!");
          } catch (error) {
            console.log("Erro ao excluir agendamento:", error);
            setErrorMessage("Não foi possível excluir o agendamento.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />

        <Text style={[styles.loadingText, { color: theme.subtext }]}>
          Carregando agenda...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Agenda</Text>

        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Escolha a data e horário para seu atendimento.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Novo agendamento
        </Text>

        <Text style={[styles.label, { color: theme.text }]}>Tipo de serviço</Text>

        <View style={styles.rowWrap}>
          {serviceTypes.map((item) => {
            const selected = serviceType === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.serviceOption,
                  { backgroundColor: theme.box },
                  selected && { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  setServiceType(item.id);
                  setErrorMessage("");
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={selected ? "#fff" : theme.text}
                />

                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text },
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Data</Text>

        <View style={styles.rowWrap}>
          {dates.map((date) => {
            const selected = selectedDate === date.value;
            const hasAppointment = appointments.some(
              (item) => item.date === date.value
            );

            return (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.dateOption,
                  { backgroundColor: theme.box },
                  selected && { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  setSelectedDate(date.value);
                  setTime("");
                  setErrorMessage("");
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text },
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {date.label}
                </Text>

                {hasAppointment && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Horário</Text>

        <View style={styles.rowWrap}>
          {timeSlots.map((slot) => {
            const selected = time === slot;
            const unavailable = appointments.some(
              (item) => item.date === selectedDate && item.time === slot
            );

            return (
              <TouchableOpacity
                key={slot}
                disabled={!selectedDate || unavailable}
                style={[
                  styles.timeOption,
                  { backgroundColor: theme.box },
                  selected && { backgroundColor: theme.primary },
                  unavailable && styles.unavailableOption,
                  !selectedDate && styles.disabledOption,
                ]}
                onPress={() => {
                  setTime(slot);
                  setErrorMessage("");
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text },
                    selected && styles.optionTextSelected,
                    unavailable && styles.unavailableText,
                    !selectedDate && styles.unavailableText,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            (!selectedDate || !time || saving) && styles.buttonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedDate || !time || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="calendar-outline" size={18} color="#fff" />
          )}

          <Text style={styles.buttonText}>
            {saving ? "Confirmando..." : "Confirmar Agendamento"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Compromissos
        </Text>

        <Text style={[styles.sectionCount, { color: theme.subtext }]}>
          {selectedDate
            ? `${appointmentsByDate.length} neste dia`
            : "Escolha uma data"}
        </Text>
      </View>

      {!selectedDate ? (
        <Text style={[styles.emptyText, { color: theme.subtext }]}>
          Selecione uma data para visualizar os compromissos.
        </Text>
      ) : appointmentsByDate.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.subtext }]}>
          Nenhum compromisso nesta data.
        </Text>
      ) : (
        appointmentsByDate.map((appointment) => (
          <View
            key={appointment.id}
            style={[styles.appointmentCard, { backgroundColor: theme.card }]}
          >
            <View style={styles.timeBox}>
              <Text style={[styles.timeText, { color: theme.text }]}>
                {appointment.time}
              </Text>
            </View>

            <View style={styles.appointmentInfo}>
              <View style={styles.badge}>
                <Ionicons
                  name={appointment.icon}
                  size={14}
                  color={theme.primary}
                />

                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {appointment.label}
                </Text>
              </View>

              <Text style={[styles.description, { color: theme.subtext }]}>
                {appointment.description}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(appointment.id)}
            >
              <Ionicons name="trash-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © {new Date().getFullYear()} Toyota do Brasil
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },

  card: {
    padding: 20,
    borderRadius: 18,
    elevation: 4,
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  label: {
    marginTop: 14,
    marginBottom: 8,
    fontWeight: "700",
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },

  dateOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
    alignItems: "center",
  },

  timeOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },

  disabledOption: {
    opacity: 0.45,
  },

  optionText: {
    fontSize: 13,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },

  unavailableOption: {
    opacity: 0.35,
  },

  unavailableText: {
    textDecorationLine: "line-through",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    marginTop: 5,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
  },

  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },

  button: {
    marginTop: 22,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  sectionCount: {
    marginTop: 4,
    fontSize: 13,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  timeBox: {
    marginRight: 14,
  },

  timeText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  appointmentInfo: {
    flex: 1,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "bold",
  },

  description: {
    fontSize: 13,
  },

  deleteButton: {
    padding: 8,
  },

  footer: {
    textAlign: "center",
    padding: 20,
    fontSize: 12,
  },
});