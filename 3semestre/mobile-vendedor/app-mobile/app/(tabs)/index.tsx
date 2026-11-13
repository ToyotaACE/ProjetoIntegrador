import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AccessibleText as Text } from "@/components/AccessibleText";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api, endpoints } from "@/services/api";

type BackendVeiculo = {
  id: number;
  modeloVeiculo?: string;
  marcaVeiculo?: string;
  anoVeiculo?: string;
  corVeiculo?: string;
  statusVeiculo?: string;
  valorTotal?: number;
};

type BackendCliente = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  veiculos?: BackendVeiculo[];
};

type BackendAgendamento = {
  id: number;
  data: string;
  horario: string;
  tipoServico: string;
  observacao?: string;
  status?: string;
  cliente?: BackendCliente;
};

const catalogVehicles = [
  {
    id: 1,
    name: "Corolla Cross",
    price: "R$ 189.990",
    image: require("../../assets/images/corolla-cross.png"),
  },
  {
    id: 2,
    name: "Corolla Sedan",
    price: "R$ 179.990",
    image: require("../../assets/images/corolla-sedan.png"),
  },
  {
    id: 3,
    name: "Yaris Sedan",
    price: "R$ 129.990",
    image: require("../../assets/images/yaris-sedan.png"),
  },
  {
    id: 4,
    name: "Yaris Hatch",
    price: "R$ 109.990",
    image: require("../../assets/images/yaris-hatch.png"),
  },
  {
    id: 5,
    name: "Yaris Cross",
    price: "R$ 149.990",
    image: require("../../assets/images/yaris-cross.png"),
  },
  {
    id: 6,
    name: "Hilux",
    price: "R$ 299.990",
    image: require("../../assets/images/hilux.png"),
  },
];

const salesData = [
  { month: "Out", vendas: 9800 },
  { month: "Nov", vendas: 14200 },
  { month: "Dez", vendas: 17100 },
  { month: "Jan", vendas: 10800 },
  { month: "Fev", vendas: 15000 },
  { month: "Mar", vendas: 12900 },
];

const SALES_BLUE_THRESHOLD = 15000;
const AVERAGE_MONTHLY_SALES = 13300;
const CHART_STEP = 5000;
const LOW_SALES_COLOR = [203, 213, 225];
const HIGH_SALES_COLOR = [30, 64, 175];

function getSalesColor(sales: number) {
  const normalizedSales =
    Math.min(Math.max(sales, 0), SALES_BLUE_THRESHOLD) / SALES_BLUE_THRESHOLD;
  const progress = Math.sqrt(normalizedSales);
  const color = LOW_SALES_COLOR.map((channel, index) =>
    Math.round(channel + (HIGH_SALES_COLOR[index] - channel) * progress)
  );
  return `rgb(${color.join(", ")})`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDateLong(locale: string) {
  return new Date().toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isCurrentMonth(dateString?: string) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function Dashboard() {
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const authContext = useAuth();
  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [locale]
  );

  const user = authContext?.user;

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<BackendCliente[]>([]);
  const [appointments, setAppointments] = useState<BackendAgendamento[]>([]);

  useFocusEffect(
    useCallback(() => {
      carregarDashboard();
    }, [])
  );

  async function carregarDashboard() {
    try {
      setLoading(true);

      const [clientesResponse, agendamentosResponse] = await Promise.all([
        api.get<BackendCliente[]>(endpoints.clientes),
        api.get<BackendAgendamento[]>(endpoints.agendamentos),
      ]);

      setClients(clientesResponse);
      setAppointments(agendamentosResponse);
    } catch (error) {
      console.log("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalClientes = clients.length;

  const clientesComVeiculo = clients.filter(
    (client) => (client.veiculos || []).length > 0
  ).length;

  const leads = clients.filter((client) => {
    return !client.veiculos || client.veiculos.length === 0;
  }).length;

  const veiculosVendidos = clients.reduce((total, client) => {
    return total + (client.veiculos || []).length;
  }, 0);

  const agendamentosHoje = appointments.filter(
    (appointment) => appointment.data === todayISO()
  ).length;

  const agendamentosMes = appointments.filter((appointment) =>
    isCurrentMonth(appointment.data)
  ).length;

  const taxaConversao =
    totalClientes > 0 ? Math.round((clientesComVeiculo / totalClientes) * 100) : 0;

  const metrics = useMemo(
    () => [
      {
        label: t("Vendas do mês"),
        value: String(veiculosVendidos),
        change: t("{count} agendamento(s) hoje", { count: agendamentosHoje }),
        icon: "trending-up-outline",
      },
      {
        label: t("Veículos disponíveis"),
        value: String(catalogVehicles.length),
        change: t("no catálogo"),
        icon: "car-sport-outline",
      },
      {
        label: t("Clientes ativos"),
        value: String(totalClientes),
        change: t("{count} lead(s)", { count: leads }),
        icon: "people-outline",
      },
      {
        label: t("Taxa de conversão"),
        value: `${taxaConversao}%`,
        change: t("{count} cliente(s) com veículo", {
          count: clientesComVeiculo,
        }),
        icon: "radio-button-on-outline",
      },
    ],
    [
      veiculosVendidos,
      agendamentosHoje,
      totalClientes,
      leads,
      taxaConversao,
      clientesComVeiculo,
      t,
    ]
  );

  const chartMax = Math.max(
    SALES_BLUE_THRESHOLD + CHART_STEP,
    Math.ceil(
      Math.max(...salesData.map(({ vendas }) => vendas)) / CHART_STEP
    ) * CHART_STEP
  );
  const chartTicks = [0, 5000, 10000, 15000, chartMax];

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
          {t("Carregando dashboard...")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("Bom dia, {name}", {
              name: user?.nome || t("Vendedor"),
            })}
          </Text>

          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Toyota Centro · {formatDateLong(locale)}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>
                  {metric.label}
                </Text>

                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={metric.icon as keyof typeof Ionicons.glyphMap}
                    size={15}
                    color={colors.primary}
                  />
                </View>
              </View>

              <Text style={[styles.metricValue, { color: colors.text }]}>
                {metric.value}
              </Text>

              <Text style={[styles.metricChange, { color: colors.subtext }]}>
                {metric.change}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("Destaques da loja")}
            </Text>

            <View style={styles.carouselButtons}>
              <View
                style={[styles.arrowButton, { backgroundColor: colors.box }]}
              >
                <Ionicons
                  name="chevron-back"
                  size={15}
                  color={colors.subtext}
                />
              </View>

              <View
                style={[styles.arrowButton, { backgroundColor: colors.box }]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.subtext}
                />
              </View>
            </View>
          </View>

          <FlatList
            data={catalogVehicles}
            horizontal
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.featuredCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                  },
                ]}
              >
                <View style={styles.featuredImageBox}>
                  <Image source={item.image} style={styles.featuredImage} />
                </View>

                <View style={styles.featuredInfo}>
                  <Text
                    numberOfLines={1}
                    style={[styles.featuredName, { color: colors.text }]}
                  >
                    {item.name}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[styles.featuredPrice, { color: colors.primary }]}
                  >
                    {item.price}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("Resumo de hoje")}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </View>

          <View style={styles.todayGrid}>
            <View
              style={[
                styles.todayBox,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.todayValue, { color: colors.text }]}>
                {agendamentosHoje}
              </Text>

              <Text style={[styles.todayLabel, { color: colors.subtext }]}>
                {t("Agendamentos hoje")}
              </Text>
            </View>

            <View
              style={[
                styles.todayBox,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.todayValue, { color: colors.text }]}>
                {agendamentosMes}
              </Text>

              <Text style={[styles.todayLabel, { color: colors.subtext }]}>
                {t("Agendamentos no mês")}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("Vendas Toyota Brasil (estimativa)")}
              </Text>
              <Text style={[styles.chartSubtitle, { color: colors.subtext }]}>
                {t("Unidades vendidas por mês (dados ilustrativos)")}
              </Text>
            </View>
          </View>

          <View style={styles.chartLegend}>
            <Text style={[styles.legendLabel, { color: colors.subtext }]}>
              {t("Até 5.000 vendas")}
            </Text>
            <View style={styles.legendGradient} accessibilityElementsHidden>
              {Array.from({ length: 8 }, (_, index) => {
                const color = LOW_SALES_COLOR.map((channel, colorIndex) =>
                  Math.round(
                    channel +
                      (HIGH_SALES_COLOR[colorIndex] - channel) *
                        (index / 7)
                  )
                );
                return (
                  <View
                    key={index}
                    style={[
                      styles.legendSwatch,
                      { backgroundColor: `rgb(${color.join(", ")})` },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.legendLabel, { color: colors.subtext }]}>
              {t("15.000+ vendas")}
            </Text>
          </View>

          <View
            style={styles.customChart}
            accessibilityLabel={t("Gráfico de vendas mensais estimadas")}
          >
            <View style={styles.chartScale}>
              {[...chartTicks].reverse().map((value) => (
                <Text
                  key={value}
                  style={[styles.scaleText, { color: colors.subtext }]}
                >
                  {compactNumberFormatter.format(value)}
                </Text>
              ))}
            </View>

            <View style={styles.chartContent}>
              <View style={styles.gridLines}>
                {chartTicks.map((value) => (
                  <View
                    key={value}
                    style={[
                      styles.gridLine,
                      {
                        bottom: 21 + (value / chartMax) * 190,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                ))}
              </View>

              <View
                pointerEvents="none"
                style={[
                  styles.referenceLine,
                  {
                    bottom:
                      21 + (AVERAGE_MONTHLY_SALES / chartMax) * 190,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.referenceLabel,
                    { backgroundColor: colors.card },
                  ]}
                >
                  Referência mensal: ~
                  {compactNumberFormatter.format(AVERAGE_MONTHLY_SALES)} vendas
                </Text>
              </View>

              <View style={styles.barsArea}>
                {salesData.map((item) => {
                  const heightPercent = (item.vendas / chartMax) * 100;

                  return (
                    <View
                      key={item.month}
                      style={styles.barColumn}
                      accessible
                      accessibilityLabel={`${item.month}: ${compactNumberFormatter.format(item.vendas)} vendas`}
                    >
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: getSalesColor(item.vendas),
                            },
                          ]}
                        />
                      </View>

                      <Text
                        style={[styles.barLabel, { color: colors.subtext }]}
                      >
                        {t(item.month)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

         
        </View>

        <Text style={[styles.footer, { color: colors.subtext }]}>
          © {new Date().getFullYear()} Toyota do Brasil
        </Text>
      </ScrollView>
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

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
    rowGap: 12,
  },

  metricCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 104,
  },

  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },

  metricLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },

  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
  },

  metricChange: {
    marginTop: 5,
    fontSize: 11,
  },

  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    overflow: "hidden",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  chartHeader: {
    marginBottom: 4,
  },

  chartSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },

  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    marginTop: 12,
    flexWrap: "wrap",
  },

  legendLabel: {
    fontSize: 9,
  },

  legendGradient: {
    width: 48,
    height: 9,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 999,
  },

  legendSwatch: {
    flex: 1,
  },

  carouselButtons: {
    flexDirection: "row",
    gap: 6,
  },

  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  featuredList: {
    gap: 10,
    paddingRight: 12,
  },

  featuredCard: {
    width: 132,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },

  featuredImageBox: {
    height: 74,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  featuredInfo: {
    padding: 9,
  },

  featuredName: {
    fontSize: 12,
    fontWeight: "bold",
  },

  featuredPrice: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "bold",
  },

  todayGrid: {
    flexDirection: "row",
    gap: 10,
  },

  todayBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },

  todayValue: {
    fontSize: 24,
    fontWeight: "bold",
  },

  todayLabel: {
    marginTop: 4,
    fontSize: 12,
  },

  customChart: {
    marginTop: 16,
    flexDirection: "row",
  },

  chartScale: {
    width: 38,
    height: 220,
    justifyContent: "space-between",
    paddingBottom: 21,
  },

  scaleText: {
    fontSize: 9,
    textAlign: "right",
  },

  chartContent: {
    flex: 1,
    position: "relative",
    height: 220,
  },

  gridLines: {
    position: "absolute",
    left: 4,
    right: 0,
    top: 0,
    bottom: 0,
  },

  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
  },

  barsArea: {
    height: 220,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingLeft: 4,
  },

  barColumn: {
    flex: 1,
    alignItems: "center",
    height: 220,
    justifyContent: "flex-end",
  },

  barWrapper: {
    height: 190,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },

  bar: {
    width: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  barLabel: {
    fontSize: 11,
    marginTop: 8,
  },

  referenceLine: {
    position: "absolute",
    left: 4,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#4F75A2",
    zIndex: 2,
    alignItems: "flex-end",
  },

  referenceLabel: {
    color: "#4F75A2",
    fontSize: 8,
    paddingHorizontal: 3,
    marginTop: -13,
  },

  chartHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
});