import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LocalizedText as Text } from "../components/LocalizedText";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

import carroToyota from "./image/carro toyota.jpg";
import yarisHatch from "./image/yaris.png";
import yarisCross from "./image/yarisseda.png";
import sw4 from "./image/sw4.png";

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api").replace(/\/api\/?$/, "");
const API_URL = `${API_ORIGIN}/api`;

const stages = [
  {
    id: "pedido",
    label: "Pedido Realizado",
    description: "Seu pedido foi registrado com sucesso.",
    icon: "document-text-outline",
    completed: (progress) => progress > 0,
  },
  {
    id: "linha",
    label: "Linha de Produção",
    description: "Produto em processo de fabricação.",
    icon: "settings-outline",
    completed: (progress) => progress >= 33,
  },
  {
    id: "inspecao",
    label: "Inspeção",
    description: "Qualidade sendo verificada.",
    icon: "search-outline",
    completed: (progress) => progress >= 50,
  },
  {
    id: "cegonha",
    label: "Cegonha",
    description: "Produto em processo de acabamento.",
    icon: "shield-checkmark-outline",
    completed: (progress) => progress >= 67,
  },
  {
    id: "concessionaria",
    label: "Concessionária",
    description: "Enviado para a concessionária.",
    icon: "people-outline",
    completed: (progress) => progress >= 83,
  },
  {
    id: "retirada",
    label: "Pronto para Retirada",
    description: "Seu pedido está pronto para ser retirado.",
    icon: "car-sport-outline",
    completed: (progress) => progress >= 100,
  },
];

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function getVehicleImage(vehicle) {
  const model = String(vehicle?.modeloVeiculo || "").toLowerCase();
  if (model.includes("yaris cross")) return yarisCross;
  if (model.includes("yaris hatch") || model === "yaris") return yarisHatch;
  if (model.includes("hilux") || model.includes("sw4")) return sw4;
  return carroToyota;
}

function formatOrderDate(vehicle) {
  const dateValue = vehicle?.dataPedido || vehicle?.dataCompra;
  if (!dateValue) return "Data não informada";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function VehicleTimelinePage() {
  const { user } = useAuth();
  const { theme, dark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleId = Array.isArray(params.vehicleId)
    ? params.vehicleId[0]
    : params.vehicleId;

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadVehicle = useCallback(async () => {
    const email = getUserEmail(user);
    if (!email || !vehicleId) {
      setErrorMessage("Não foi possível identificar o veículo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(
        `${API_URL}/clientes/${encodeURIComponent(email)}`,
      );
      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados do veículo.");
      }

      const client = await response.json();
      const selectedVehicle = (
        Array.isArray(client?.veiculos) ? client.veiculos : []
      ).find((item) => String(item.id) === String(vehicleId));
      if (!selectedVehicle) {
        throw new Error("Veículo não encontrado na sua conta.");
      }
      setVehicle(selectedVehicle);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a timeline.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const progressValue = Number(
    vehicle?.progressoVeiculo ??
      vehicle?.progresso ??
      vehicle?.progressoFabricacao ??
      0,
  );
  const progress = Number.isFinite(progressValue)
    ? Math.max(0, Math.min(100, progressValue))
    : 0;
  const completedStages = useMemo(
    () => stages.filter((stage) => stage.completed(progress)).length,
    [progress],
  );
  const progressColor = progress >= 100 ? "#16a34a" : "#dc2626";

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <View style={styles.heading}>
          <View style={styles.factoryIcon}>
            <Ionicons name="business" size={30} color="#fff" />
          </View>
          <View style={styles.headingDivider} />
          <View style={styles.headingText}>
            <Text style={[styles.title, { color: theme.text }]}>
              Timeline de Fabricação
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Acompanhe o progresso das etapas de produção em tempo real
            </Text>
          </View>
        </View>
        <View style={styles.completionPill}>
          <Ionicons name="checkmark-circle" size={19} color="#15803d" />
          <Text style={styles.completionText}>{progress}% do valor</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.feedback, { color: theme.subtext }]}>
              Carregando timeline...
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.center}>
            <Text style={[styles.feedback, { color: theme.text }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadVehicle}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : vehicle ? (
          <>
            <View
              style={[
                styles.progressCard,
                { backgroundColor: theme.card, borderColor: theme.box },
              ]}
            >
              <Ionicons name="time-outline" size={27} color={theme.subtext} />
              <View style={styles.progressBody}>
                <View style={styles.progressTitleRow}>
                  <Text style={[styles.progressTitle, { color: theme.text }]}>
                    Progresso Geral
                  </Text>
                  <Text style={[styles.progressPercent, { color: progressColor }]}>
                    {progress}%
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.box }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.mainLayout}>
              <View style={styles.stageList}>
                {stages.map((stage, index) => {
                  const done = stage.completed(progress);
                  const isLast = index === stages.length - 1;
                  return (
                    <View key={stage.id} style={styles.stageRow}>
                      <View style={styles.markerColumn}>
                        <View
                          style={[
                            styles.stageMarker,
                            {
                              backgroundColor: done ? "#dc2626" : theme.card,
                              borderColor: done ? "#dc2626" : theme.subtext,
                            },
                          ]}
                        >
                          <Ionicons
                            name={done ? "checkmark" : stage.icon}
                            size={18}
                            color={done ? "#fff" : theme.text}
                          />
                        </View>
                        {!isLast ? (
                          <View
                            style={[
                              styles.stageLine,
                              {
                                backgroundColor: done ? "#fecaca" : theme.box,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.stageCard,
                          {
                            backgroundColor: done
                              ? dark
                                ? "#351c21"
                                : "#fff0f0"
                              : theme.card,
                            borderColor: done ? "#fecaca" : theme.box,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.stageAccent,
                            { backgroundColor: done ? "#dc2626" : "transparent" },
                          ]}
                        />
                        <Ionicons
                          name={stage.icon}
                          size={25}
                          color={done ? "#dc2626" : theme.text}
                        />
                        <View style={styles.stageText}>
                          <Text style={[styles.stageTitle, { color: theme.text }]}>
                            {stage.label}
                          </Text>
                          <Text style={[styles.stageDescription, { color: theme.subtext }]}>
                            {stage.description}
                          </Text>
                        </View>
                        {done && index === 0 ? (
                          <View style={styles.stageDate}>
                            <Ionicons name="calendar-outline" size={14} color="#dc2626" />
                            <Text style={styles.stageDateText}>
                              {formatOrderDate(vehicle)}
                            </Text>
                          </View>
                        ) : !done ? (
                          <Ionicons name="chevron-forward" size={19} color={theme.subtext} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View
                style={[
                  styles.orderCard,
                  { backgroundColor: theme.card, borderColor: theme.box },
                ]}
              >
                <Image source={getVehicleImage(vehicle)} style={styles.vehicleImage} />
                <View style={styles.orderContent}>
                  <Text style={[styles.orderHeading, { color: theme.text }]}>
                    Seu Pedido
                  </Text>
                  <View style={styles.orderAccent} />
                  <View style={[styles.orderInfoRow, { borderBottomColor: theme.box }]}>
                    <Ionicons name="cube-outline" size={23} color="#dc2626" />
                    <View style={styles.orderInfoText}>
                      <Text style={[styles.orderLabel, { color: theme.subtext }]}>
                        Número do pedido
                      </Text>
                      <Text style={[styles.orderValue, { color: theme.text }]}>
                        {vehicle.numeroPedido || vehicle.pedidoId || vehicle.id || "Não informado"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.orderInfoRow, { borderBottomColor: theme.box }]}>
                    <Ionicons name="car-outline" size={23} color={theme.subtext} />
                    <View style={styles.orderInfoText}>
                      <Text style={[styles.orderLabel, { color: theme.subtext }]}>
                        Veículo
                      </Text>
                      <Text style={[styles.orderValue, { color: theme.text }]}>
                        {vehicle.modeloVeiculo || "Toyota"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <Ionicons name="calendar-outline" size={23} color={theme.subtext} />
                    <View style={styles.orderInfoText}>
                      <Text style={[styles.orderLabel, { color: theme.subtext }]}>
                        Data do Pedido
                      </Text>
                      <Text style={[styles.orderValue, { color: theme.text }]}>
                        {formatOrderDate(vehicle)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.completedText, { color: theme.subtext }]}>
                    {completedStages} de {stages.length} etapas concluídas
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.card, borderColor: theme.box },
        ]}
      >
        <View style={styles.footerMessage}>
          <Ionicons name="information-circle-outline" size={22} color="#1e3a8a" />
          <Text style={[styles.footerText, { color: theme.text }]}>
            Você será notificado em todas as atualizações do seu pedido.
          </Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadVehicle}
            disabled={loading}
          >
            <Ionicons name="refresh" size={17} color="#dc2626" />
            <Text style={styles.refreshText}>Atualizar Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: theme.box }]}
            onPress={() => router.replace("/(tabs)/vehicle")}
          >
            <Ionicons name="arrow-back" size={17} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  heading: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  factoryIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#dc0000",
    alignItems: "center",
    justifyContent: "center",
  },
  headingDivider: { width: 3, height: 48, backgroundColor: "#dc0000" },
  headingText: { flex: 1 },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  completionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  completionText: { color: "#15803d", fontWeight: "bold", fontSize: 12 },
  scroll: { flex: 1 },
  content: { paddingTop: 15, paddingBottom: 14 },
  center: { minHeight: 300, alignItems: "center", justifyContent: "center" },
  feedback: { marginTop: 10, textAlign: "center", fontSize: 14 },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#dc2626",
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "bold" },
  progressCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  progressBody: { flex: 1 },
  progressTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  progressTitle: { fontWeight: "bold", fontSize: 14 },
  progressPercent: { fontSize: 20, fontWeight: "bold" },
  progressTrack: { height: 10, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  mainLayout: { gap: 16 },
  stageList: { flex: 1 },
  stageRow: { flexDirection: "row", minHeight: 72, gap: 9 },
  markerColumn: { width: 38, alignItems: "center" },
  stageMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stageLine: { width: 3, flex: 1, marginVertical: 2, borderRadius: 3 },
  stageCard: {
    flex: 1,
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 9,
    overflow: "hidden",
  },
  stageAccent: { width: 4, alignSelf: "stretch", marginLeft: -10 },
  stageText: { flex: 1 },
  stageTitle: { fontSize: 13, fontWeight: "bold" },
  stageDescription: { marginTop: 3, fontSize: 11 },
  stageDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 99,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  stageDateText: { color: "#b91c1c", fontSize: 9, fontWeight: "600" },
  orderCard: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  vehicleImage: { width: "100%", height: 190, resizeMode: "contain", backgroundColor: "#f8fafc" },
  orderContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  orderHeading: { fontSize: 17, fontWeight: "bold" },
  orderAccent: { width: 36, height: 2, backgroundColor: "#dc2626", marginTop: 6 },
  orderInfoRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
  },
  orderInfoText: { flex: 1 },
  orderLabel: { fontSize: 11 },
  orderValue: { marginTop: 2, fontSize: 13, fontWeight: "bold" },
  completedText: { marginTop: 12, fontSize: 11 },
  footer: {
    borderWidth: 1,
    borderRadius: 11,
    padding: 10,
    gap: 10,
  },
  footerMessage: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerText: { flex: 1, fontSize: 11 },
  footerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  refreshButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 99,
    paddingHorizontal: 12,
  },
  refreshText: { color: "#dc2626", fontSize: 11, fontWeight: "bold" },
  backButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  backText: { fontSize: 11, fontWeight: "600" },
});
