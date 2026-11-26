import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  LocalizedText as Text,
  LocalizedTextInput,
} from "../../components/LocalizedText";

import { useAuth } from "../../contexts/AuthContext";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useLocalizedAlert } from "../../components/LocalizedAlert";
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

const dealerships = [
  "Toyota Centro — Av. Paulista, 1500 - São Paulo",
  "Toyota Zona Sul — Av. Santo Amaro, 3200 - São Paulo",
  "Toyota Campinas — Rod. Anhanguera, km 95 - Campinas",
  "Toyota ABC — Av. Industrial, 800 - Santo André",
];

const pickupColors = [
  { name: "Vermelho", value: "#dc2626" },
  { name: "Azul", value: "#2563eb" },
  { name: "Amarelo", value: "#facc15" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Verde", value: "#16a34a" },
  { name: "Branco", value: "#ffffff" },
  { name: "Preto", value: "#111827" },
  { name: "Dourado", value: "#d97706" },
];

const emptyPickupCustomization = {
  laco: false,
  corLaco: "#dc2626",
  baloes: false,
  corBaloes: "#2563eb",
  confetes: false,
  corConfetes: "#facc15",
  mensagemVideo: "",
  corMensagemVideo: "#111827",
};

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

function formatDateToDisplay(date, language) {
  return date.toLocaleDateString(language);
}

function createNextDates(days = 5, language = "pt-BR") {
  const result = [];

  for (let index = 0; index < days; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index);

    result.push({
      label: formatDateToDisplay(date, language),
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
    vehicle: item.veiculo || null,
    dealership: item.concessionaria || "",
    retiradaPersonalizada: item.retiradaPersonalizada,
    retiradaLaco: item.retiradaLaco,
    retiradaCorLaco: item.retiradaCorLaco,
    retiradaBaloes: item.retiradaBaloes,
    retiradaCorBaloes: item.retiradaCorBaloes,
    retiradaConfetes: item.retiradaConfetes,
    retiradaCorConfetes: item.retiradaCorConfetes,
    retiradaMensagemVideo: item.retiradaMensagemVideo,
    retiradaCorMensagemVideo: item.retiradaCorMensagemVideo,
  };
}

function getVehicleDetails(vehicle) {
  return [
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
    ["Progresso", vehicle.progressoVeiculo == null ? null : `${vehicle.progressoVeiculo}%`],
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
}

export default function SchedulingPage() {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const Alert = useLocalizedAlert();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const [serviceType, setServiceType] = useState("retirada");
  const [appointments, setAppointments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedDealership, setSelectedDealership] = useState("");
  const [customizingPickupId, setCustomizingPickupId] = useState(null);
  const [pickupForm, setPickupForm] = useState(emptyPickupCustomization);
  const [savingPickup, setSavingPickup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clienteId = getUserId(user);
  const email = getUserEmail(user);

  const dates = useMemo(() => createNextDates(5, settings.language), [settings.language]);

  const selectedService = serviceTypes.find((item) => item.id === serviceType);
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null;

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

      const [response, vehiclesResponse] = await Promise.all([
        fetch(`${API_URL}/agendamentos/cliente/${clienteId}`),
        fetch(`${API_URL}/veiculos/cliente/${clienteId}`),
      ]);

      if (!response.ok) {
        throw new Error("Não foi possível carregar os agendamentos.");
      }
      if (!vehiclesResponse.ok) {
        throw new Error("Não foi possível carregar seus veículos.");
      }

      const [data, vehiclesData] = await Promise.all([
        response.json(),
        vehiclesResponse.json(),
      ]);

      const formattedAppointments = Array.isArray(data)
        ? data.map((item) => normalizeAppointment(item, user))
        : [];
      const customerVehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

      setAppointments(formattedAppointments);
      setVehicles(customerVehicles);
      setSelectedVehicleId((current) =>
        current && customerVehicles.some((vehicle) => vehicle.id === current)
          ? current
          : customerVehicles[0]?.id || null
      );
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

      if (!selectedVehicle || !selectedDealership) {
        setErrorMessage("Selecione o veículo e a concessionária para este agendamento.");
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
          veiculoId: selectedVehicle.id,
          concessionaria: selectedDealership,
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

      const createdAppointment = await response.json();
      if (
        Number(createdAppointment?.veiculo?.id) !== Number(selectedVehicle.id) ||
        createdAppointment?.concessionaria !== selectedDealership
      ) {
        await carregarAgendamentos();
        throw new Error(
          "O servidor não confirmou os dados do agendamento. Atualize e reinicie o backend antes de criar um novo agendamento."
        );
      }

      await carregarAgendamentos();

      setTime("");
      setSelectedDealership("");
      setErrorMessage("");

      Alert.alert("Sucesso", "Agendamento confirmado!");
    } catch (error) {
      console.log("Erro ao confirmar agendamento:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar o agendamento."
      );
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

  const openPickupCustomization = (appointment) => {
    setPickupForm({
      laco: Boolean(appointment.retiradaLaco),
      corLaco: appointment.retiradaCorLaco || emptyPickupCustomization.corLaco,
      baloes: Boolean(appointment.retiradaBaloes),
      corBaloes: appointment.retiradaCorBaloes || emptyPickupCustomization.corBaloes,
      confetes: Boolean(appointment.retiradaConfetes),
      corConfetes: appointment.retiradaCorConfetes || emptyPickupCustomization.corConfetes,
      mensagemVideo: appointment.retiradaMensagemVideo || "",
      corMensagemVideo:
        appointment.retiradaCorMensagemVideo || emptyPickupCustomization.corMensagemVideo,
    });
    setCustomizingPickupId(appointment.id);
  };

  const handleSavePickupCustomization = async (appointmentId) => {
    if (!clienteId) {
      setErrorMessage("Cliente não identificado. Faça login novamente.");
      return;
    }

    try {
      setSavingPickup(true);
      setErrorMessage("");
      const response = await fetch(
        `${API_URL}/agendamentos/${appointmentId}/personalizacao-retirada`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId,
            laco: pickupForm.laco,
            corLaco: pickupForm.corLaco,
            baloes: pickupForm.baloes,
            corBaloes: pickupForm.corBaloes,
            confetes: pickupForm.confetes,
            corConfetes: pickupForm.corConfetes,
            mensagemVideo: pickupForm.mensagemVideo.trim(),
            corMensagemVideo: pickupForm.corMensagemVideo,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Não foi possível salvar a personalização.");
      }

      const saved = await response.json();
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                retiradaPersonalizada: saved.retiradaPersonalizada,
                retiradaLaco: saved.retiradaLaco,
                retiradaCorLaco: saved.retiradaCorLaco,
                retiradaBaloes: saved.retiradaBaloes,
                retiradaCorBaloes: saved.retiradaCorBaloes,
                retiradaConfetes: saved.retiradaConfetes,
                retiradaCorConfetes: saved.retiradaCorConfetes,
                retiradaMensagemVideo: saved.retiradaMensagemVideo,
                retiradaCorMensagemVideo: saved.retiradaCorMensagemVideo,
              }
            : appointment,
        ),
      );
      setCustomizingPickupId(null);
      Alert.alert("Sucesso", "Personalização da retirada salva!");
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a personalização.",
      );
    } finally {
      setSavingPickup(false);
    }
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

        <Text style={[styles.label, { color: theme.text }]}>Veículo</Text>

        {vehicles.length === 0 ? (
          <Text style={[styles.noVehiclesText, { color: theme.subtext }]}>
            Nenhum veículo cadastrado. Cadastre um veículo antes de agendar.
          </Text>
        ) : (
          <View style={styles.vehicleOptions}>
            {vehicles.map((vehicle) => {
              const selected = selectedVehicleId === vehicle.id;
              const vehicleName = [
                vehicle.marcaVeiculo || "Toyota",
                vehicle.modeloVeiculo || "Veículo",
                vehicle.anoVeiculo,
                vehicle.placaVeiculo,
              ].filter(Boolean).join(" · ");

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    { backgroundColor: theme.box },
                    selected && { borderColor: theme.primary },
                  ]}
                  onPress={() => {
                    setSelectedVehicleId(vehicle.id);
                    setErrorMessage("");
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.vehicleOptionText, { color: theme.text }]}>
                    {vehicleName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Concessionária</Text>

        <View style={styles.vehicleOptions}>
          {dealerships.map((dealership) => {
            const selected = selectedDealership === dealership;
            return (
              <TouchableOpacity
                key={dealership}
                style={[
                  styles.vehicleOption,
                  { backgroundColor: theme.box },
                  selected && { borderColor: theme.primary },
                ]}
                onPress={() => {
                  setSelectedDealership(dealership);
                  setErrorMessage("");
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.vehicleOptionText, { color: theme.text }]}>
                  {dealership}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
            (!selectedDate || !time || !selectedVehicle || !selectedDealership || saving) && styles.buttonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedDate || !time || !selectedVehicle || !selectedDealership || saving}
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

              {appointment.dealership ? (
                <View style={styles.dealershipRow}>
                  <Ionicons name="location-outline" size={15} color={theme.primary} />
                  <Text style={[styles.dealershipText, { color: theme.text }]}>
                    {appointment.dealership}
                  </Text>
                </View>
              ) : null}

              {appointment.vehicle ? (
                <View style={[styles.vehicleDetails, { backgroundColor: theme.box }]}>
                  <Text style={[styles.vehicleDetailsTitle, { color: theme.text }]}>
                    {appointment.vehicle.marcaVeiculo || "Toyota"}{" "}
                    {appointment.vehicle.modeloVeiculo || "Veículo"}
                  </Text>
                  {getVehicleDetails(appointment.vehicle).map(([label, value]) => (
                    <View key={label} style={styles.vehicleDetailRow}>
                      <Text style={[styles.vehicleDetailLabel, { color: theme.subtext }]}>
                        {label}:
                      </Text>
                      <Text style={[styles.vehicleDetailValue, { color: theme.text }]}>
                        {String(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.description, { color: theme.subtext }]}>
                  Veículo não informado neste agendamento.
                </Text>
              )}

              {appointment.type === "retirada" ? (
                <View style={styles.pickupCustomization}>
                  {appointment.retiradaPersonalizada ? (
                    <View style={[styles.savedPickup, { backgroundColor: theme.box }]}>
                      <Text style={[styles.savedPickupTitle, { color: theme.text }]}>
                        Personalização salva
                      </Text>
                      {[
                        ["Laço", appointment.retiradaLaco, appointment.retiradaCorLaco],
                        ["Balões", appointment.retiradaBaloes, appointment.retiradaCorBaloes],
                        ["Confetes", appointment.retiradaConfetes, appointment.retiradaCorConfetes],
                      ]
                        .filter(([, enabled]) => enabled)
                        .map(([label, , color]) => (
                          <View key={label} style={styles.savedColorRow}>
                            <View
                              style={[styles.colorSwatch, { backgroundColor: color }]}
                            />
                            <Text style={[styles.savedPickupText, { color: theme.text }]}>
                              {label}
                            </Text>
                          </View>
                        ))}
                      {appointment.retiradaMensagemVideo ? (
                        <Text style={[styles.savedPickupText, { color: theme.text }]}>
                          “{appointment.retiradaMensagemVideo}”
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.customizeButton, { borderColor: theme.primary }]}
                    onPress={() =>
                      customizingPickupId === appointment.id
                        ? setCustomizingPickupId(null)
                        : openPickupCustomization(appointment)
                    }
                    accessibilityRole="button"
                  >
                    <Text style={[styles.customizeButtonText, { color: theme.primary }]}>
                      {customizingPickupId === appointment.id
                        ? "Fechar personalização"
                        : appointment.retiradaPersonalizada
                          ? "Editar personalização"
                          : "Personalizar retirada"}
                    </Text>
                  </TouchableOpacity>

                  {customizingPickupId === appointment.id ? (
                    <View style={[styles.pickupForm, { backgroundColor: theme.box }]}>
                      {[
                        ["laco", "Laço", "corLaco"],
                        ["baloes", "Balões", "corBaloes"],
                        ["confetes", "Confetes", "corConfetes"],
                      ].map(([enabledKey, label, colorKey]) => (
                        <View key={enabledKey} style={styles.pickupOption}>
                          <TouchableOpacity
                            style={styles.pickupToggle}
                            onPress={() =>
                              setPickupForm((current) => ({
                                ...current,
                                [enabledKey]: !current[enabledKey],
                              }))
                            }
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: pickupForm[enabledKey] }}
                          >
                            <Ionicons
                              name={pickupForm[enabledKey] ? "checkbox" : "square-outline"}
                              size={20}
                              color={theme.primary}
                            />
                            <Text style={[styles.pickupOptionLabel, { color: theme.text }]}>
                              Quero o carro com {label.toLowerCase()}
                            </Text>
                          </TouchableOpacity>
                          {pickupForm[enabledKey] ? (
                            <>
                              <Text style={[styles.pickupColorLabel, { color: theme.subtext }]}>
                                Cor {label.toLowerCase()}
                              </Text>
                              <View style={styles.colorOptions}>
                                {pickupColors.map((color) => (
                                  <TouchableOpacity
                                    key={`${colorKey}-${color.value}`}
                                    onPress={() =>
                                      setPickupForm((current) => ({
                                        ...current,
                                        [colorKey]: color.value,
                                      }))
                                    }
                                    accessibilityRole="radio"
                                    accessibilityLabel={color.name}
                                    accessibilityState={{
                                      selected: pickupForm[colorKey] === color.value,
                                    }}
                                    style={[
                                      styles.colorSwatch,
                                      { backgroundColor: color.value },
                                      pickupForm[colorKey] === color.value && styles.colorSwatchSelected,
                                    ]}
                                  />
                                ))}
                              </View>
                            </>
                          ) : null}
                        </View>
                      ))}

                      <Text style={[styles.pickupColorLabel, { color: theme.text }]}>
                        Mensagem para aparecer no vídeo (opcional)
                      </Text>
                      <LocalizedTextInput
                        style={[
                          styles.messageInput,
                          { backgroundColor: theme.card, color: theme.text },
                        ]}
                        value={pickupForm.mensagemVideo}
                        onChangeText={(mensagemVideo) =>
                          setPickupForm((current) => ({ ...current, mensagemVideo }))
                        }
                        maxLength={100}
                        placeholder="Digite uma mensagem de até 100 caracteres"
                        placeholderTextColor={theme.subtext}
                        multiline
                      />
                      <Text style={[styles.messageCount, { color: theme.subtext }]}>
                        {pickupForm.mensagemVideo.length}/100
                      </Text>
                      {pickupForm.mensagemVideo.trim() ? (
                        <>
                          <Text style={[styles.pickupColorLabel, { color: theme.subtext }]}>
                            Cor da mensagem
                          </Text>
                          <View style={styles.colorOptions}>
                            {pickupColors.map((color) => (
                              <TouchableOpacity
                                key={`video-${color.value}`}
                                onPress={() =>
                                  setPickupForm((current) => ({
                                    ...current,
                                    corMensagemVideo: color.value,
                                  }))
                                }
                                accessibilityRole="radio"
                                accessibilityLabel={color.name}
                                accessibilityState={{
                                  selected: pickupForm.corMensagemVideo === color.value,
                                }}
                                style={[
                                  styles.colorSwatch,
                                  { backgroundColor: color.value },
                                  pickupForm.corMensagemVideo === color.value &&
                                    styles.colorSwatchSelected,
                                ]}
                              />
                            ))}
                          </View>
                        </>
                      ) : null}

                      <TouchableOpacity
                        style={[
                          styles.savePickupButton,
                          { backgroundColor: theme.primary },
                          savingPickup && styles.buttonDisabled,
                        ]}
                        disabled={savingPickup}
                        onPress={() => handleSavePickupCustomization(appointment.id)}
                      >
                        <Text style={styles.savePickupButtonText}>
                          {savingPickup ? "Salvando..." : "Salvar personalização"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}
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

  vehicleOptions: {
    gap: 8,
  },

  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },

  vehicleOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  noVehiclesText: {
    fontSize: 13,
    marginBottom: 8,
  },

  dealershipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
  },

  dealershipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
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
    alignItems: "flex-start",
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
    minWidth: 0,
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

  pickupCustomization: {
    marginTop: 12,
    gap: 8,
  },

  savedPickup: {
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },

  savedPickupTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  savedPickupText: {
    fontSize: 12,
  },

  savedColorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  customizeButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  customizeButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  pickupForm: {
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },

  pickupOption: {
    gap: 6,
  },

  pickupToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  pickupOptionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  pickupColorLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  colorOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#94a3b8",
  },

  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#111827",
  },

  messageInput: {
    minHeight: 68,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
    fontSize: 13,
  },

  messageCount: {
    alignSelf: "flex-end",
    fontSize: 11,
  },

  savePickupButton: {
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 2,
  },

  savePickupButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  vehicleDetails: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },

  vehicleDetailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  vehicleDetailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
  },

  vehicleDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },

  vehicleDetailValue: {
    flexShrink: 1,
    fontSize: 12,
  },

  deleteButton: {
    padding: 8,
    alignSelf: "flex-start",
  },

  footer: {
    textAlign: "center",
    padding: 20,
    fontSize: 12,
  },
});