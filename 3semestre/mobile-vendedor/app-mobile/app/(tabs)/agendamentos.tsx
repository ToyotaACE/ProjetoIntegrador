import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";
import { api, endpoints } from "@/services/api";

LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: [
    "Jan.",
    "Fev.",
    "Mar.",
    "Abr.",
    "Mai.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Set.",
    "Out.",
    "Nov.",
    "Dez.",
  ],
  dayNames: [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};

LocaleConfig.defaultLocale = "pt-br";

type BackendCliente = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  veiculos?: BackendVeiculo[];
};

type BackendVeiculo = {
  modeloVeiculo?: string;
  marcaVeiculo?: string;
  anoVeiculo?: string;
  placaVeiculo?: string;
};

type BackendAgendamento = {
  id: number;
  data: string;
  horario: string;
  tipoServico: string;
  observacao?: string;
  status?: string;
  cliente?: BackendCliente;
  veiculo?: BackendVeiculo;
};

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type AppointmentType =
  | "visita"
  | "ligacao"
  | "test-drive"
  | "retirada"
  | "revisao";

type Appointment = {
  id: number;
  date: string;
  time: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  vehicle: string;
  clientId?: number;
  type: AppointmentType;
  description: string;
  status: string;
};

const timeSlots = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const typeConfig: Record<
  AppointmentType,
  {
    label: string;
    backendValue: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  visita: {
    label: "Visita",
    backendValue: "VISITA",
    color: "#DC2626",
    icon: "location-outline",
  },
  ligacao: {
    label: "Ligação",
    backendValue: "LIGACAO",
    color: "#3B82F6",
    icon: "call-outline",
  },
  "test-drive": {
    label: "Test-drive",
    backendValue: "TEST_DRIVE",
    color: "#16A34A",
    icon: "car-sport-outline",
  },
  retirada: {
    label: "Retirada",
    backendValue: "RETIRADA",
    color: "#F59E0B",
    icon: "key-outline",
  },
  revisao: {
    label: "Revisão",
    backendValue: "REVISAO",
    color: "#8B5CF6",
    icon: "construct-outline",
  },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDateBr(date: string) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return date;

  return `${day}/${month}/${year}`;
}

function normalizeTime(time: string) {
  if (!time) return "";

  return time.slice(0, 5);
}

function getTypeFromBackend(value?: string): AppointmentType {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace("-", "_");

  if (normalized.includes("LIGACAO") || normalized.includes("LIGAÇÃO")) {
    return "ligacao";
  }

  if (normalized.includes("TEST")) {
    return "test-drive";
  }

  if (normalized.includes("RETIRADA")) {
    return "retirada";
  }

  if (normalized.includes("REVISAO") || normalized.includes("REVISÃO")) {
    return "revisao";
  }

  return "visita";
}

function normalizeClient(cliente: BackendCliente): Client {
  return {
    id: cliente.id,
    name: cliente.nome || "",
    email: cliente.email || "",
    phone: cliente.telefone || "",
  };
}

function normalizeAppointment(item: BackendAgendamento): Appointment {
  const type = getTypeFromBackend(item.tipoServico);
  const vehicleData = item.veiculo || item.cliente?.veiculos?.[0];
  const vehicleParts = [
    vehicleData?.marcaVeiculo,
    vehicleData?.modeloVeiculo,
    vehicleData?.anoVeiculo,
  ].filter(Boolean);
  const vehicle = vehicleParts.length
    ? `${vehicleParts.join(" ")}${vehicleData?.placaVeiculo ? ` • ${vehicleData.placaVeiculo}` : ""}`
    : "";

  return {
    id: item.id,
    date: item.data,
    time: normalizeTime(item.horario),
    client: item.cliente?.nome || "Cliente não informado",
    clientEmail: item.cliente?.email || "",
    clientPhone: item.cliente?.telefone || "",
    vehicle,
    clientId: item.cliente?.id,
    type,
    description: item.observacao || "",
    status: item.status || "AGENDADO",
  };
}

export default function Agenda() {
  const Alert = useLocalizedAlert();
  const { colors, isDark } = useTheme();
  const { language, locale, t } = useLanguage();

  useEffect(() => {
    const calendarLocale = {
      monthNames: Array.from({ length: 12 }, (_, month) =>
        new Date(2024, month, 1).toLocaleDateString(locale, { month: "long" })
      ),
      monthNamesShort: Array.from({ length: 12 }, (_, month) =>
        new Date(2024, month, 1).toLocaleDateString(locale, { month: "short" })
      ),
      dayNames: Array.from({ length: 7 }, (_, day) =>
        new Date(2024, 0, 7 + day).toLocaleDateString(locale, {
          weekday: "long",
        })
      ),
      dayNamesShort: Array.from({ length: 7 }, (_, day) =>
        new Date(2024, 0, 7 + day).toLocaleDateString(locale, {
          weekday: "short",
        })
      ),
      today: t("Hoje"),
    };
    LocaleConfig.locales[language] = calendarLocale;
    LocaleConfig.defaultLocale = language;
  }, [language, locale, t]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);

  const [form, setForm] = useState({
    time: "",
    client: "",
    clientEmail: "",
    clientId: undefined as number | undefined,
    type: "visita" as AppointmentType,
    description: "",
  });

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      setLoading(true);

      const [clientesResponse, agendamentosResponse] = await Promise.all([
        api.get<BackendCliente[]>(endpoints.clientes),
        api.get<BackendAgendamento[]>(endpoints.agendamentos),
      ]);

      const clientesNormalizados = clientesResponse
        .map(normalizeClient)
        .sort((a, b) => a.name.localeCompare(b.name));

      const agendamentosNormalizados = agendamentosResponse.map(
        normalizeAppointment
      );

      setClients(clientesNormalizados);
      setAppointments(agendamentosNormalizados);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar os agendamentos."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const query = clientSearch.toLowerCase();

    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  const dayAppointments = appointments
    .filter((appointment) => appointment.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const markedDates = useMemo(() => {
    const marks = appointments.reduce((acc, item) => {
      acc[item.date] = {
        marked: true,
        dotColor: colors.primary,
      };

      return acc;
    }, {} as Record<string, any>);

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: "#fff",
      };
    }

    return marks;
  }, [appointments, selectedDate, colors.primary]);

  function openNewModal() {
    if (!selectedDate) {
      setSelectedDate(todayISO());
    }

    setForm({
      time: "",
      client: "",
      clientEmail: "",
      clientId: undefined,
      type: "visita",
      description: "",
    });

    setClientSearch("");
    setShowClientList(false);
    setModalVisible(true);
  }

  function selectClient(client: Client) {
    setForm((prev) => ({
      ...prev,
      client: client.name,
      clientEmail: client.email,
      clientId: client.id,
    }));

    setClientSearch("");
    setShowClientList(false);
  }

  async function handleSave() {
    if (!selectedDate) {
      Alert.alert("Atenção", "Selecione uma data.");
      return;
    }

    if (!form.time) {
      Alert.alert("Erro", "Selecione um horário.");
      return;
    }

    if (!form.clientId) {
      Alert.alert("Erro", "Selecione um cliente.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        clienteId: form.clientId,
        data: selectedDate,
        horario: `${form.time}:00`,
        tipoServico: typeConfig[form.type].backendValue,
        observacao: form.description.trim(),
      };

      await api.post<BackendAgendamento>(endpoints.agendamentos, payload);

      Alert.alert("Sucesso", "Agendamento criado com sucesso.");

      setModalVisible(false);

      setForm({
        time: "",
        client: "",
        clientEmail: "",
        clientId: undefined,
        type: "visita",
        description: "",
      });

      await carregarDados();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível criar o agendamento."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(appointment: Appointment) {
    Alert.alert(
      "Excluir agendamento",
      `Deseja realmente excluir o agendamento de ${appointment.client}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete<void>(
                endpoints.agendamentoPorId(appointment.id)
              );

              await carregarDados();

              Alert.alert("Sucesso", "Agendamento excluído com sucesso.");
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível excluir o agendamento."
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Carregando agenda...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarWrapper}>
          <Calendar
            key={`calendar-${isDark}-${language}`}
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.background,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.subtext,
              dayTextColor: colors.text,
              monthTextColor: colors.text,
              textDisabledColor: isDark ? "#555555" : "#cccccc",
              todayTextColor: colors.primary,
              todayBackgroundColor: isDark ? "#27272A" : "#F3F4F6",
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: "#ffffff",
              arrowColor: colors.primary,
              dotColor: colors.primary,
              textMonthFontWeight: "bold",
              textDayFontWeight: "500",
              textDayHeaderFontWeight: "700",
            }}
            style={[
              styles.calendar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
        </View>

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Agenda</Text>

            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              {formatDateBr(selectedDate)} • {dayAppointments.length}{" "}
              {t("compromisso(s)")}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={openNewModal}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.buttonText}>Novo</Text>
          </TouchableOpacity>
        </View>

        {dayAppointments.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={34}
              color={colors.subtext}
            />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum compromisso
            </Text>

            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Não há agendamentos para esta data.
            </Text>
          </View>
        ) : (
          <FlatList
            data={dayAppointments}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const config = typeConfig[item.type];

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.timeBox}>
                    <Text style={[styles.time, { color: colors.text }]}>
                      {item.time}
                    </Text>

                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: config.color },
                      ]}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={[styles.client, { color: colors.text }]}>
                      {item.client}
                    </Text>

                    {item.clientEmail ? (
                      <Text
                        style={[styles.clientEmail, { color: colors.subtext }]}
                      >
                        {item.clientEmail}
                      </Text>
                    ) : null}

                    {item.clientPhone ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={14} color={colors.subtext} />
                        <Text style={[styles.contactText, { color: colors.subtext }]}>
                          {item.clientPhone}
                        </Text>
                      </View>
                    ) : null}

                    {item.vehicle ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="car-outline" size={15} color={colors.subtext} />
                        <Text style={[styles.contactText, { color: colors.subtext }]}>
                          {item.vehicle}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.typeRow}>
                      <Ionicons
                        name={config.icon}
                        size={16}
                        color={config.color}
                      />

                      <Text style={[styles.typeText, { color: config.color }]}>
                        {t(config.label)}
                      </Text>
                    </View>

                    {item.description ? (
                      <Text style={[styles.desc, { color: colors.subtext }]}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: "rgba(239,68,68,0.12)" },
                    ]}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Novo agendamento
                </Text>

                <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
                  {t("Data selecionada")}: {formatDateBr(selectedDate)}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={28}
                  color={colors.subtext}
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={[styles.label, { color: colors.text }]}>
                Horário
              </Text>

              <View style={styles.timeSlots}>
                {timeSlots.map((time) => {
                  const active = form.time === time;

                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setForm((prev) => ({ ...prev, time }))}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          { color: active ? "#fff" : colors.text },
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                Cliente
              </Text>

              <TextInput
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.subtext}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                  },
                ]}
                value={clientSearch}
                onChangeText={(text) => {
                  setClientSearch(text);
                  setShowClientList(true);
                }}
                onFocus={() => setShowClientList(true)}
              />

              {showClientList ? (
                <View
                  style={[
                    styles.clientList,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.clientItem,
                          { borderBottomColor: colors.border },
                        ]}
                        onPress={() => selectClient(item)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.clientItemName,
                              { color: colors.text },
                            ]}
                          >
                            {item.name}
                          </Text>

                          <Text
                            style={[
                              styles.clientItemInfo,
                              { color: colors.subtext },
                            ]}
                          >
                            {item.email || item.phone || "Sem contato"}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward-outline"
                          size={18}
                          color={colors.subtext}
                        />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text
                        style={[
                          styles.emptyClientText,
                          { color: colors.subtext },
                        ]}
                      >
                        Nenhum cliente encontrado.
                      </Text>
                    }
                  />
                </View>
              ) : null}

              {form.client ? (
                <View
                  style={[
                    styles.selectedClientBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color={colors.primary}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.selectedClientName, { color: colors.text }]}
                    >
                      {form.client}
                    </Text>

                    <Text
                      style={[
                        styles.selectedClientEmail,
                        { color: colors.subtext },
                      ]}
                    >
                      {form.clientEmail}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text style={[styles.label, { color: colors.text }]}>
                Tipo de agendamento
              </Text>

              <View style={styles.typeContainer}>
                {Object.entries(typeConfig).map(([key, value]) => {
                  const isActive = form.type === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.typeButton,
                        {
                          borderColor: isActive ? value.color : colors.border,
                          backgroundColor: isActive
                            ? value.color
                            : colors.card,
                        },
                      ]}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          type: key as AppointmentType,
                        }))
                      }
                    >
                      <Ionicons
                        name={value.icon}
                        size={16}
                        color={isActive ? "#fff" : value.color}
                      />

                      <Text
                        style={[
                          styles.typeButtonText,
                          { color: isActive ? "#fff" : value.color },
                        ]}
                      >
                        {value.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                Observação
              </Text>

              <TextInput
                placeholder="Descrição ou observação do agendamento"
                placeholderTextColor={colors.subtext}
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                  },
                ]}
                multiline
                value={form.description}
                onChangeText={(text) =>
                  setForm({ ...form, description: text })
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: saving ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color="#fff"
                      />
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    marginTop: 12,
    fontSize: 14,
  },

  calendarWrapper: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  calendar: {
    borderWidth: 1,
    borderRadius: 16,
    paddingBottom: 8,
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  button: {
    paddingHorizontal: 14,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  emptyBox: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 120,
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
  },

  emptyText: {
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  timeBox: {
    width: 58,
    alignItems: "center",
  },

  time: {
    fontWeight: "bold",
    fontSize: 17,
  },

  statusDot: {
    marginTop: 8,
    width: 9,
    height: 9,
    borderRadius: 99,
  },

  cardContent: {
    flex: 1,
  },

  client: {
    fontWeight: "bold",
    fontSize: 16,
  },

  clientEmail: {
    fontSize: 12,
    marginTop: 2,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  contactText: {
    fontSize: 12,
  },

  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  typeText: {
    fontSize: 13,
    fontWeight: "bold",
  },

  desc: {
    fontSize: 13,
    marginTop: 7,
    lineHeight: 18,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    padding: 18,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  modalContent: {
    padding: 20,
    paddingBottom: 120,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
  },

  timeSlots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  timeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },

  timeChipText: {
    fontSize: 13,
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },

  textArea: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  clientList: {
    borderWidth: 1,
    borderRadius: 14,
    maxHeight: 240,
    marginBottom: 12,
    overflow: "hidden",
  },

  clientItem: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  clientItemName: {
    fontSize: 15,
    fontWeight: "bold",
  },

  clientItemInfo: {
    fontSize: 12,
    marginTop: 2,
  },

  emptyClientText: {
    textAlign: "center",
    padding: 20,
    fontSize: 13,
  },

  selectedClientBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  selectedClientName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  selectedClientEmail: {
    fontSize: 12,
    marginTop: 2,
  },

  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 10,
  },

  typeButton: {
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  typeButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 18,
    justifyContent: "center",
  },

  cancelButtonText: {
    fontWeight: "bold",
  },

  saveButton: {
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
