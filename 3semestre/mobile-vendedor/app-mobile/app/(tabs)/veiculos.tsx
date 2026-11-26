import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";
import { api, endpoints, type CatalogoVeiculo } from "@/services/api";

type BackendCliente = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
};

type ClienteOption = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
};

type CatalogVehicle = {
  id: number | string;
  name: string;
  brand: string;
  year: string;
  basePrice: number;
  motor: string;
  fuel: string;
  transmission: string;
  image: any;
  photoUrl?: string;
  versions: {
    name: string;
    price: number;
    motor?: string;
  }[];
  colors?: { name: string; hexadecimal: string }[];
  options?: Accessory[];
};

type Accessory = {
  id: number | string;
  name: string;
  price: number;
};

type CatalogVersionForm = { nome: string; motor: string; preco: string };
type CatalogColorForm = { nome: string; hexadecimal: string };
type CatalogOptionalForm = { nome: string; preco: string };

const emptyCatalogVersion = (): CatalogVersionForm => ({ nome: "", motor: "", preco: "" });
const emptyCatalogColor = (): CatalogColorForm => ({ nome: "", hexadecimal: "#FFFFFF" });
const emptyCatalogOptional = (): CatalogOptionalForm => ({ nome: "", preco: "0" });

const defaultCatalogVehicles: CatalogVehicle[] = [
  {
    id: 1,
    name: "Corolla Cross",
    brand: "Toyota",
    year: "2025",
    basePrice: 189990,
    motor: "Motor 2.0 Flex",
    fuel: "Flex",
    transmission: "Automático",
    image: require("../../assets/images/corolla-cross.png"),
    versions: [
      { name: "XR", price: 189990 },
      { name: "XRE", price: 204990 },
      { name: "XRX Hybrid", price: 229990 },
    ],
  },
  {
    id: 2,
    name: "Corolla Sedan",
    brand: "Toyota",
    year: "2025",
    basePrice: 179990,
    motor: "Motor 2.0 Flex",
    fuel: "Flex",
    transmission: "Automático",
    image: require("../../assets/images/corolla-sedan.png"),
    versions: [
      { name: "GLI", price: 179990 },
      { name: "XEI", price: 194990 },
      { name: "Altis Hybrid", price: 219990 },
    ],
  },
  {
    id: 3,
    name: "Yaris Sedan",
    brand: "Toyota",
    year: "2025",
    basePrice: 129990,
    motor: "Motor 1.5 Flex",
    fuel: "Flex",
    transmission: "Automático",
    image: require("../../assets/images/yaris-sedan.png"),
    versions: [
      { name: "XL", price: 129990 },
      { name: "XS", price: 139990 },
      { name: "XLS", price: 149990 },
    ],
  },
  {
    id: 4,
    name: "Yaris Hatch",
    brand: "Toyota",
    year: "2025",
    basePrice: 109990,
    motor: "Motor 1.5 Flex",
    fuel: "Flex",
    transmission: "Automático",
    image: require("../../assets/images/yaris-hatch.png"),
    versions: [
      { name: "XL", price: 109990 },
      { name: "XS", price: 119990 },
      { name: "XLS", price: 129990 },
    ],
  },
  {
    id: 5,
    name: "Yaris Cross",
    brand: "Toyota",
    year: "2025",
    basePrice: 149990,
    motor: "Motor 1.5 Flex",
    fuel: "Flex",
    transmission: "Automático",
    image: require("../../assets/images/yaris-cross.png"),
    versions: [
      { name: "XR", price: 149990 },
      { name: "XRE", price: 159990 },
      { name: "XRX Hybrid", price: 179990 },
    ],
  },
  {
    id: 6,
    name: "Hilux",
    brand: "Toyota",
    year: "2025",
    basePrice: 299990,
    motor: "Motor 2.8 Diesel",
    fuel: "Diesel",
    transmission: "Automático",
    image: require("../../assets/images/hilux.png"),
    versions: [
      { name: "SR", price: 299990 },
      { name: "SRV", price: 329990 },
      { name: "SRX", price: 359990 },
    ],
  },
];

const colorsOptions = ["Branco", "Preto", "Prata", "Vermelho"];

const seatOptions = [
  {
    name: "Tecido",
    price: 0,
  },
  {
    name: "Couro",
    price: 4500,
  },
  {
    name: "Couro premium",
    price: 7500,
  },
];

const accessories: Accessory[] = [
  { id: 1, name: "Câmera de ré", price: 900 },
  { id: 2, name: "Sensor de estacionamento", price: 1200 },
  { id: 3, name: "Câmera 360°", price: 2500 },
  { id: 4, name: "Teto solar", price: 8000 },
  { id: 5, name: "Tapetes de borracha", price: 300 },
  { id: 6, name: "Rack de teto", price: 1500 },
  { id: 7, name: "Engate de reboque", price: 1800 },
  { id: 8, name: "Película", price: 600 },
  { id: 9, name: "Alarme", price: 1300 },
  { id: 10, name: "Som premium", price: 3200 },
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function onlyNumber(value: string) {
  const clean = value.replace(/\./g, "").replace(",", ".");
  const number = Number(clean);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}

function catalogAmount(value: string) {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function gerarChassi() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "9BR";

  for (let i = 0; i < 14; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function gerarVinIot() {
  return `TOYOTA-${Date.now()}`;
}

function gerarProximaRevisao() {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);

  return date.toISOString().split("T")[0];
}

function normalizarClientes(lista: BackendCliente[]): ClienteOption[] {
  return lista.map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome || "",
    email: cliente.email || "",
    telefone: cliente.telefone || "",
    cpf: cliente.cpf || "",
  }));
}

function mapCatalogVehicle(vehicle: CatalogoVeiculo): CatalogVehicle {
  return {
    id: `catalog-${vehicle.id}`,
    name: vehicle.modelo,
    brand: "Toyota",
    year: String(vehicle.ano),
    basePrice: vehicle.precoBase,
    motor: vehicle.motor,
    fuel: vehicle.combustivel,
    transmission: vehicle.cambio,
    image: { uri: vehicle.fotoCarroUrl },
    photoUrl: vehicle.fotoCarroUrl,
    versions: vehicle.versoes.map((version) => ({
      name: version.nome,
      motor: version.motor,
      price: version.preco,
    })),
    colors: vehicle.cores,
    options: vehicle.opcionais.map((option, index) => ({
      id: `${vehicle.id}-${index}`,
      name: option.nome,
      price: option.preco,
    })),
  };
}

function getVehicleColors(vehicle: CatalogVehicle) {
  return vehicle.colors?.length ? vehicle.colors.map((color) => color.name) : colorsOptions;
}

function getVehicleAccessories(vehicle: CatalogVehicle): Accessory[] {
  return vehicle.options ?? accessories;
}

export default function Veiculos() {
  const Alert = useLocalizedAlert();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();

  const clienteIdParam = params.clienteId ? Number(params.clienteId) : null;

  const numColumns = 2;
  const selectedButtonBackground = isDark ? "#3F3F46" : "#E5E7EB";
  const selectedButtonBorder = isDark ? "#71717A" : "#9CA3AF";
  const selectedButtonText = isDark ? "#FFFFFF" : "#18181B";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogVehicles, setCatalogVehicles] = useState(defaultCatalogVehicles);
  const [catalogLoadError, setCatalogLoadError] = useState("");

  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<CatalogVehicle | null>(
    null
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedColor, setSelectedColor] = useState("Branco");
  const [selectedSeat, setSelectedSeat] = useState("Tecido");
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  const [newModel, setNewModel] = useState("");
  const [newCategory, setNewCategory] = useState("SUV");
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newMotor, setNewMotor] = useState("");
  const [newFuel, setNewFuel] = useState("");
  const [newTransmission, setNewTransmission] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoName, setNewPhotoName] = useState("");
  const [newVersions, setNewVersions] = useState<CatalogVersionForm[]>([emptyCatalogVersion()]);
  const [newColors, setNewColors] = useState<CatalogColorForm[]>([emptyCatalogColor()]);
  const [newOptions, setNewOptions] = useState<CatalogOptionalForm[]>([]);

  const [entrada, setEntrada] = useState("20000");
  const [parcelasTotais, setParcelasTotais] = useState("48");
  const [parcelasPagas, setParcelasPagas] = useState("0");
  const [taxaJuros, setTaxaJuros] = useState("1,49");

  const filteredClients = useMemo(() => {
    const query = clientSearchQuery.trim().toLocaleLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) =>
      [client.nome, client.email, client.telefone, client.cpf]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [clientSearchQuery, clients]);

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [clienteIdParam])
  );

  async function carregarClientes() {
    try {
      setLoading(true);

      const response = await api.get<BackendCliente[]>(endpoints.clientes);
      const clientesNormalizados = normalizarClientes(response);

      setClients(clientesNormalizados);

      if (clienteIdParam) {
        setSelectedClientId(clienteIdParam);
      } else {
        setSelectedClientId(null);
      }

      try {
        const catalog = await api.get<CatalogoVeiculo[]>(endpoints.catalogoVeiculos);
        setCatalogVehicles([...defaultCatalogVehicles, ...catalog.map(mapCatalogVehicle)]);
        setCatalogLoadError("");
      } catch (error: any) {
        setCatalogLoadError(error?.message || "Não foi possível carregar os modelos cadastrados.");
        Alert.alert(
          "Catálogo indisponível",
          error?.message || "Não foi possível carregar os modelos cadastrados."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar os clientes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function chooseCatalogPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso às fotos para selecionar a imagem do veículo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;
    const photo = result.assets[0];
    if (!photo.base64 || !photo.mimeType || !["image/png", "image/jpeg", "image/webp"].includes(photo.mimeType)) {
      Alert.alert("Imagem inválida", "Selecione uma imagem PNG, JPEG ou WebP.");
      return;
    }
    if (photo.base64.length > 4_200_000) {
      Alert.alert("Imagem muito grande", "Escolha uma imagem de até 3 MB.");
      return;
    }
    setNewPhotoUrl(`data:${photo.mimeType};base64,${photo.base64}`);
    setNewPhotoName(photo.fileName || "Imagem selecionada");
  }

  function resetCatalogForm() {
    setNewModel("");
    setNewCategory("SUV");
    setNewYear(String(new Date().getFullYear()));
    setNewBasePrice("");
    setNewMotor("");
    setNewFuel("");
    setNewTransmission("");
    setNewPhotoUrl("");
    setNewPhotoName("");
    setNewVersions([emptyCatalogVersion()]);
    setNewColors([emptyCatalogColor()]);
    setNewOptions([]);
  }

  async function saveCatalogVehicle() {
    if (!newModel.trim() || !newMotor.trim() || !newFuel.trim() || !newTransmission.trim()) {
      Alert.alert("Dados incompletos", "Preencha o modelo, motor, combustível e câmbio.");
      return;
    }
    if (!newPhotoUrl) {
      Alert.alert("Foto obrigatória", "Selecione uma foto do veículo.");
      return;
    }
    if (catalogAmount(newBasePrice) <= 0 || !Number.isInteger(Number(newYear)) || Number(newYear) < 1900 || Number(newYear) > 2100) {
      Alert.alert("Dados inválidos", "Informe um ano e preço base válidos.");
      return;
    }
    if (newVersions.some((version) => !version.nome.trim() || !version.motor.trim() || catalogAmount(version.preco) <= 0)) {
      Alert.alert("Versões incompletas", "Preencha nome, motorização e preço para cada versão.");
      return;
    }
    if (newColors.some((color) => !color.nome.trim() || !/^#[0-9a-fA-F]{6}$/.test(color.hexadecimal))) {
      Alert.alert("Cores incompletas", "Preencha o nome e use uma cor no formato #RRGGBB.");
      return;
    }
    if (newOptions.some((option) => !option.nome.trim() || catalogAmount(option.preco) < 0)) {
      Alert.alert("Opcionais incompletos", "Preencha nome e preço válido para cada opcional.");
      return;
    }

    try {
      setSaving(true);
      const created = await api.post<CatalogoVeiculo>(endpoints.catalogoVeiculos, {
        modelo: newModel.trim(),
        categoria: newCategory,
        ano: Number(newYear),
        precoBase: catalogAmount(newBasePrice),
        motor: newMotor.trim(),
        combustivel: newFuel.trim(),
        cambio: newTransmission.trim(),
        fotoCarroUrl: newPhotoUrl,
        versoes: newVersions.map((version) => ({
          nome: version.nome.trim(),
          motor: version.motor.trim(),
          preco: catalogAmount(version.preco),
        })),
        cores: newColors.map((color) => ({
          nome: color.nome.trim(),
          hexadecimal: color.hexadecimal.trim(),
        })),
        opcionais: newOptions.map((option) => ({
          nome: option.nome.trim(),
          preco: catalogAmount(option.preco),
        })),
      });
      setCatalogVehicles((current) => [...current, mapCatalogVehicle(created)]);
      setCatalogModalVisible(false);
      resetCatalogForm();
      Alert.alert("Veículo adicionado", "O modelo já está disponível para novos pedidos.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível adicionar o veículo ao catálogo.");
    } finally {
      setSaving(false);
    }
  }

  const selectedVersionData = useMemo(() => {
    if (!selectedVehicle) return null;

    return (
      selectedVehicle.versions.find((version) => version.name === selectedVersion) ||
      selectedVehicle.versions[0]
    );
  }, [selectedVehicle, selectedVersion]);

  const selectedSeatData = useMemo(() => {
    return seatOptions.find((seat) => seat.name === selectedSeat) || seatOptions[0];
  }, [selectedSeat]);

  const selectedAccessoriesData = useMemo(() => {
    if (!selectedVehicle) return [];
    return getVehicleAccessories(selectedVehicle).filter((accessory) =>
      selectedAccessories.includes(String(accessory.id))
    );
  }, [selectedAccessories, selectedVehicle]);

  const totalAccessories = selectedAccessoriesData.reduce(
    (total, item) => total + item.price,
    0
  );

  const valorTotal =
    (selectedVersionData?.price || selectedVehicle?.basePrice || 0) +
    selectedSeatData.price +
    totalAccessories;

  const entradaNumber = onlyNumber(entrada);
  const parcelasTotaisNumber = Math.max(onlyNumber(parcelasTotais), 1);
  const parcelasPagasNumber = Math.min(
    onlyNumber(parcelasPagas),
    parcelasTotaisNumber
  );
  const parcelasRestantes = Math.max(
    parcelasTotaisNumber - parcelasPagasNumber,
    0
  );
  const valorFinanciado = Math.max(valorTotal - entradaNumber, 0);
  const taxaMensal = onlyNumber(taxaJuros) / 100;

  const valorParcela =
    parcelasRestantes > 0
      ? taxaMensal > 0
        ? (valorFinanciado *
            (taxaMensal * Math.pow(1 + taxaMensal, parcelasRestantes))) /
          (Math.pow(1 + taxaMensal, parcelasRestantes) - 1)
        : valorFinanciado / parcelasRestantes
      : 0;

  const clienteSelecionado = clients.find(
    (client) => client.id === selectedClientId
  );

  function openConfigModal(vehicle: CatalogVehicle) {
    setOrderConfirmed(false);
    setSelectedVehicle(vehicle);
    setSelectedVersion(vehicle.versions[0].name);
    setSelectedColor(getVehicleColors(vehicle)[0]);
    setSelectedSeat("Tecido");
    setSelectedAccessories([]);
    setEntrada("20000");
    setParcelasTotais("48");
    setParcelasPagas("0");
    setTaxaJuros("1,49");
    setClientSearchQuery("");

    if (clienteIdParam) {
      setSelectedClientId(clienteIdParam);
    }

    setModalVisible(true);
  }

  function toggleAccessory(accessoryId: number | string) {
    const normalizedId = String(accessoryId);
    if (selectedAccessories.includes(normalizedId)) {
      setSelectedAccessories(
        selectedAccessories.filter((item) => item !== normalizedId)
      );
      return;
    }

    setSelectedAccessories([...selectedAccessories, normalizedId]);
  }

  async function saveOrder() {
    if (!selectedVehicle) {
      Alert.alert("Erro", "Selecione um veículo.");
      return;
    }

    if (!selectedClientId) {
      Alert.alert("Erro", "Selecione um cliente.");
      return;
    }

    if (!selectedVersionData) {
      Alert.alert("Erro", "Selecione uma versão.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        clienteId: selectedClientId,

        modeloVeiculo: selectedVehicle.name,
        marcaVeiculo: selectedVehicle.brand,
        anoVeiculo: selectedVehicle.year,
        corVeiculo: selectedColor,
        chassiVeiculo: gerarChassi(),
        motorVeiculo: selectedVersionData.motor || selectedVehicle.motor,
        combustivelVeiculo: selectedVehicle.fuel,
        cambioVeiculo: selectedVehicle.transmission,
        fotoCarroUrl: selectedVehicle.photoUrl || selectedVehicle.name,

        statusVeiculo: "Pedido realizado",
        progressoVeiculo: 20,

        valorTotal: valorTotal,
        valorEntrada: entradaNumber,
        valorFinanciado: valorFinanciado,
        parcelasTotais: parcelasTotaisNumber,
        parcelasPagas: parcelasPagasNumber,
        parcelasRestantes: parcelasRestantes,
        valorParcela: Number(valorParcela.toFixed(2)),
        taxaJuros: onlyNumber(taxaJuros),

        statusFinanciamento: "ATIVO",
        statusGarantia: "ATIVA",
        dataProximaRevisao: gerarProximaRevisao(),

        acessorios: [
          `Versão: ${selectedVersionData.name}`,
          `Banco: ${selectedSeatData.name}`,
          ...selectedAccessoriesData.map((item) => item.name),
        ].join(", "),

        vinIot: gerarVinIot(),
      };

      await api.post(endpoints.veiculos, payload);

      Alert.alert(
        "Pedido confirmado",
        "O veículo foi vinculado ao cliente com sucesso."
      );

      setModalVisible(false);
      setOrderConfirmed(true);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível criar o pedido."
      );
    } finally {
      setSaving(false);
    }
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
          Carregando veículos...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Veículos</Text>
          <Text style={[styles.headerHint, { color: colors.subtext }]}>
            Catálogo Toyota
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addCatalogButton, { backgroundColor: colors.primary }]}
          onPress={() => setCatalogModalVisible(true)}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={19} color="#fff" />
          <Text style={styles.configureButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {catalogLoadError ? (
        <View style={styles.catalogErrorRow}>
          <Text style={[styles.catalogErrorText, { color: colors.danger }]}>
            {catalogLoadError}
          </Text>
          <TouchableOpacity onPress={() => carregarClientes()}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {clienteSelecionado ? (
        <View
          style={[
            styles.selectedClientBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="person-outline" size={18} color={colors.primary} />

          <View style={{ flex: 1 }}>
            <Text style={[styles.selectedClientTitle, { color: colors.text }]}>
              Cliente selecionado
            </Text>

            <Text style={[styles.selectedClientName, { color: colors.subtext }]}>
              {clienteSelecionado.nome} • {clienteSelecionado.email}
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        data={catalogVehicles}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: width > 700 ? "48%" : "48%",
              },
            ]}
          >
            <View style={styles.imageContainer}>
              <Image source={item.image} style={styles.image} />
            </View>

            <View style={styles.cardContent}>
              <Text
                style={[styles.vehicleName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Text style={[styles.vehicleInfo, { color: colors.subtext }]}>
                {item.year} • {item.motor}
              </Text>

              <Text style={[styles.price, { color: colors.primary }]}>
                {t("A partir de")} {formatMoney(item.basePrice)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.configureButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => openConfigModal(item)}
              >
                <Ionicons name="cart-outline" size={17} color="#fff" />

                <Text style={styles.configureButtonText}>Novo pedido</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal
        visible={catalogModalVisible}
        animationType="slide"
        onRequestClose={() => setCatalogModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar veículo</Text>
              <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
                O modelo ficará disponível para criar pedidos.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setCatalogModalVisible(false)} accessibilityRole="button">
              <Ionicons name="close-outline" size={28} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.catalogFormContent} keyboardShouldPersistTaps="handled">
            <CatalogField label="Modelo" value={newModel} onChangeText={setNewModel} colors={colors} />
            <View style={styles.catalogRow}>
              <View style={styles.catalogFieldHalf}>
                <Text style={[styles.inputLabel, { color: colors.subtext }]}>Categoria</Text>
                <View style={[styles.catalogSelect, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  {["SUV", "Sedan", "Hatch", "Picape"].map((item) => {
                    const active = newCategory === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setNewCategory(item)}
                        style={[styles.catalogCategoryChip, { backgroundColor: active ? colors.primary : colors.card }]}
                      >
                        <Text style={{ color: active ? "#fff" : colors.text, fontSize: 12, fontWeight: "700" }}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <CatalogField label="Ano" value={newYear} onChangeText={setNewYear} colors={colors} keyboardType="numeric" half />
            </View>
            <View style={styles.catalogRow}>
              <CatalogField label="Preço base (R$)" value={newBasePrice} onChangeText={setNewBasePrice} colors={colors} keyboardType="decimal-pad" half />
              <CatalogField label="Motor" value={newMotor} onChangeText={setNewMotor} colors={colors} half />
            </View>
            <View style={styles.catalogRow}>
              <CatalogField label="Combustível" value={newFuel} onChangeText={setNewFuel} colors={colors} half />
              <CatalogField label="Câmbio" value={newTransmission} onChangeText={setNewTransmission} colors={colors} half />
            </View>

            <SectionTitle title="Foto do veículo" color={colors.text} />
            <TouchableOpacity
              style={[styles.photoPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={chooseCatalogPhoto}
              accessibilityRole="button"
            >
              {newPhotoUrl ? (
                <Image source={{ uri: newPhotoUrl }} style={styles.catalogPhotoPreview} />
              ) : (
                <Ionicons name="image-outline" size={28} color={colors.primary} />
              )}
              <Text style={[styles.photoPickerText, { color: colors.text }]}>
                {newPhotoName || "Escolher foto (PNG, JPEG ou WebP, até 3 MB)"}
              </Text>
            </TouchableOpacity>

            <SectionTitle title="Versões" color={colors.text} />
            {newVersions.map((version, index) => (
              <View key={`version-${index}`} style={[styles.catalogEntry, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <CatalogField label="Nome" value={version.nome} onChangeText={(value) => setNewVersions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, nome: value } : item))} colors={colors} />
                <CatalogField label="Motor da versão" value={version.motor} onChangeText={(value) => setNewVersions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, motor: value } : item))} colors={colors} />
                <CatalogField label="Preço (R$)" value={version.preco} onChangeText={(value) => setNewVersions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, preco: value } : item))} colors={colors} keyboardType="decimal-pad" />
                {newVersions.length > 1 ? (
                  <TouchableOpacity onPress={() => setNewVersions((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeCatalogEntry}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={{ color: colors.danger }}>Remover versão</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
            <CatalogAddButton title="Adicionar versão" onPress={() => setNewVersions((current) => [...current, emptyCatalogVersion()])} colors={colors} />

            <SectionTitle title="Cores" color={colors.text} />
            {newColors.map((color, index) => (
              <View key={`color-${index}`} style={[styles.catalogEntry, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <CatalogField label="Nome da cor" value={color.nome} onChangeText={(value) => setNewColors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, nome: value } : item))} colors={colors} />
                <View style={styles.colorInputRow}>
                  <View style={[styles.colorSwatch, { backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color.hexadecimal) ? color.hexadecimal : colors.border }]} />
                  <View style={{ flex: 1 }}>
                    <CatalogField label="Código (#RRGGBB)" value={color.hexadecimal} onChangeText={(value) => setNewColors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hexadecimal: value } : item))} colors={colors} />
                  </View>
                </View>
                {newColors.length > 1 ? (
                  <TouchableOpacity onPress={() => setNewColors((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeCatalogEntry}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={{ color: colors.danger }}>Remover cor</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
            <CatalogAddButton title="Adicionar cor" onPress={() => setNewColors((current) => [...current, emptyCatalogColor()])} colors={colors} />

            <SectionTitle title="Opcionais" color={colors.text} />
            {newOptions.map((option, index) => (
              <View key={`optional-${index}`} style={[styles.catalogEntry, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <CatalogField label="Nome do opcional" value={option.nome} onChangeText={(value) => setNewOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, nome: value } : item))} colors={colors} />
                <CatalogField label="Preço (R$)" value={option.preco} onChangeText={(value) => setNewOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, preco: value } : item))} colors={colors} keyboardType="decimal-pad" />
                <TouchableOpacity onPress={() => setNewOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeCatalogEntry}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={{ color: colors.danger }}>Remover opcional</Text>
                </TouchableOpacity>
              </View>
            ))}
            <CatalogAddButton title="Adicionar opcional" onPress={() => setNewOptions((current) => [...current, emptyCatalogOptional()])} colors={colors} />

            <View style={styles.catalogActions}>
              <TouchableOpacity
                style={[styles.cancelCatalogButton, { borderColor: colors.border }]}
                onPress={() => setCatalogModalVisible(false)}
                disabled={saving}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}
                onPress={saveCatalogVehicle}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar veículo</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Novo pedido
              </Text>

              <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
                {selectedVehicle?.name}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-outline" size={28} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedVehicle ? (
              <View
                style={[
                  styles.previewCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Image source={selectedVehicle.image} style={styles.previewImage} />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    {selectedVehicle.name}
                  </Text>

                  <Text style={[styles.previewText, { color: colors.subtext }]}>
                    {selectedVehicle.year} • {selectedVehicle.motor}
                  </Text>

                  <Text style={[styles.previewPrice, { color: colors.primary }]}>
                    {formatMoney(valorTotal)}
                  </Text>
                </View>
              </View>
            ) : null}

            <SectionTitle title="Cliente" color={colors.text} />

            <View
              style={[
                styles.clientSearch,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search-outline" size={19} color={colors.subtext} />
              <TextInput
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
                placeholder={t("Buscar cliente por nome, e-mail ou telefone")}
                placeholderTextColor={colors.subtext}
                style={[styles.clientSearchInput, { color: colors.text }]}
                autoCapitalize="none"
                accessibilityLabel={t("Buscar cliente")}
              />
              {clientSearchQuery ? (
                <TouchableOpacity
                  onPress={() => setClientSearchQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel={t("Limpar busca")}
                >
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={colors.subtext}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              style={[
                styles.clientResults,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const active = selectedClientId === client.id;

                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientResult,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => setSelectedClientId(client.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.clientResultName,
                            { color: active ? colors.primary : colors.text },
                          ]}
                        >
                          {client.nome}
                        </Text>
                        <Text
                          style={[
                            styles.clientResultDetails,
                            { color: colors.subtext },
                          ]}
                        >
                          {client.email}
                          {client.telefone ? ` • ${client.telefone}` : ""}
                        </Text>
                      </View>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text
                  style={[
                    styles.clientNoResults,
                    { color: colors.subtext },
                  ]}
                >
                  {t("Nenhum cliente encontrado")}
                </Text>
              )}
            </ScrollView>

            <SectionTitle title="Versão" color={colors.text} />

            <View style={styles.optionsGrid}>
              {selectedVehicle?.versions.map((version) => {
                const active = selectedVersion === version.name;

                return (
                  <TouchableOpacity
                    key={version.name}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: active
                          ? selectedButtonBackground
                          : colors.card,
                        borderColor: active ? selectedButtonBorder : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedVersion(version.name)}
                  >
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {version.name}
                    </Text>

                    <Text
                      style={[styles.optionPrice, { color: colors.primary }]}
                    >
                      {formatMoney(version.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionTitle title="Cor" color={colors.text} />

            <View style={styles.chipsRow}>
              {getVehicleColors(selectedVehicle).map((colorOption) => {
                const active = selectedColor === colorOption;

                return (
                  <TouchableOpacity
                    key={colorOption}
                    style={[
                      styles.smallChip,
                      {
                        backgroundColor: active ? selectedButtonBackground : colors.card,
                        borderColor: active ? selectedButtonBorder : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedColor(colorOption)}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        { color: active ? selectedButtonText : colors.text },
                      ]}
                    >
                      {colorOption}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionTitle title="Banco" color={colors.text} />

            <View style={styles.optionsGrid}>
              {seatOptions.map((seat) => {
                const active = selectedSeat === seat.name;

                return (
                  <TouchableOpacity
                    key={seat.name}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: active
                          ? selectedButtonBackground
                          : colors.card,
                        borderColor: active ? selectedButtonBorder : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSeat(seat.name)}
                  >
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {seat.name}
                    </Text>

                    <Text
                      style={[styles.optionPrice, { color: colors.primary }]}
                    >
                      {seat.price > 0 ? `+ ${formatMoney(seat.price)}` : "Incluso"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionTitle title="Acessórios" color={colors.text} />

            <View style={styles.optionsGrid}>
              {getVehicleAccessories(selectedVehicle).map((accessory) => {
                const active = selectedAccessories.includes(String(accessory.id));

                return (
                  <TouchableOpacity
                    key={accessory.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: active
                          ? selectedButtonBackground
                          : colors.card,
                        borderColor: active ? selectedButtonBorder : colors.border,
                      },
                    ]}
                    onPress={() => toggleAccessory(accessory.id)}
                  >
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {accessory.name}
                    </Text>

                    <Text
                      style={[styles.optionPrice, { color: colors.primary }]}
                    >
                      + {formatMoney(accessory.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionTitle title="Financiamento" color={colors.text} />

            <View style={styles.financeGrid}>
              <Input
                label="Entrada"
                value={entrada}
                colors={colors}
                keyboardType="numeric"
                onChangeText={setEntrada}
              />

              <Input
                label="Parcelas totais"
                value={parcelasTotais}
                colors={colors}
                keyboardType="numeric"
                onChangeText={setParcelasTotais}
              />

              <Input
                label="Parcelas pagas"
                value={parcelasPagas}
                colors={colors}
                keyboardType="numeric"
                onChangeText={setParcelasPagas}
              />

              <Input
                label="Taxa de juros mensal"
                value={taxaJuros}
                colors={colors}
                keyboardType="decimal-pad"
                onChangeText={setTaxaJuros}
              />
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SummaryRow
                label="Valor total"
                value={formatMoney(valorTotal)}
                colors={colors}
              />

              <SummaryRow
                label="Entrada"
                value={formatMoney(entradaNumber)}
                colors={colors}
              />

              <SummaryRow
                label="Valor financiado"
                value={formatMoney(valorFinanciado)}
                colors={colors}
              />

              <SummaryRow
                label="Parcelas restantes"
                value={String(parcelasRestantes)}
                colors={colors}
              />

              <View style={styles.summaryDivider} />

              <SummaryRow
                label="Valor da parcela"
                value={formatMoney(valorParcela)}
                colors={colors}
                highlight
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.65 : 1,
                },
              ]}
              onPress={saveOrder}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Criar pedido</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={orderConfirmed}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderConfirmed(false)}
      >
        <View style={styles.confirmationBackdrop}>
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="checkmark-circle" size={52} color={colors.success} />
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Pedido criado</Text>
            <Text style={[styles.confirmationMessage, { color: colors.subtext }]}>Pedido confirmado com sucesso.</Text>
            <TouchableOpacity
              style={[styles.confirmationButton, { backgroundColor: colors.primary }]}
              onPress={() => setOrderConfirmed(false)}
            >
              <Text style={styles.saveButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{title}</Text>;
}

function Input({
  label,
  value,
  colors,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  colors: any;
  onChangeText: (text: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.subtext }]}>{label}</Text>

      <TextInput
        value={value}
        keyboardType={keyboardType}
        placeholderTextColor={colors.subtext}
        onChangeText={onChangeText}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

function CatalogField({
  label,
  value,
  colors,
  onChangeText,
  keyboardType,
  half,
}: {
  label: string;
  value: string;
  colors: any;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  half?: boolean;
}) {
  return (
    <View style={half ? styles.catalogFieldHalf : styles.catalogField}>
      <Text style={[styles.inputLabel, { color: colors.subtext }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.subtext}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

function CatalogAddButton({
  title,
  onPress,
  colors,
}: {
  title: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.addCatalogEntry, { borderColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
      <Text style={{ color: colors.primary, fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function SummaryRow({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          { color: highlight ? colors.text : colors.subtext },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          { color: highlight ? colors.primary : colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerHint: {
    marginTop: 3,
    fontSize: 13,
  },

  addCatalogButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  catalogErrorRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  catalogErrorText: {
    flex: 1,
    fontSize: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },

  selectedClientBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  selectedClientTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },

  selectedClientName: {
    fontSize: 12,
    marginTop: 2,
  },

  list: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },

  row: {
    justifyContent: "space-between",
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
  },

  imageContainer: {
    height: 118,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  cardContent: {
    padding: 12,
  },

  vehicleName: {
    fontSize: 15,
    fontWeight: "bold",
  },

  vehicleInfo: {
    marginTop: 4,
    fontSize: 11,
  },

  price: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "bold",
  },

  configureButton: {
    marginTop: 10,
    minHeight: 38,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  configureButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
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
    marginTop: 4,
    fontSize: 13,
  },

  modalContent: {
    padding: 20,
    paddingBottom: 120,
  },

  catalogFormContent: {
    padding: 20,
    paddingBottom: 50,
    gap: 12,
  },

  catalogRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  catalogField: {
    width: "100%",
  },

  catalogFieldHalf: {
    flex: 1,
  },

  catalogSelect: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 3,
  },

  catalogCategoryChip: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  catalogEntry: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },

  photoPicker: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  catalogPhotoPreview: {
    width: 76,
    height: 56,
    resizeMode: "contain",
    borderRadius: 8,
  },

  photoPickerText: {
    flex: 1,
    fontSize: 12,
  },

  colorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#888",
  },

  removeCatalogEntry: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  addCatalogEntry: {
    minHeight: 44,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  catalogActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  cancelCatalogButton: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  previewCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  previewImage: {
    width: 120,
    height: 80,
    resizeMode: "contain",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },

  previewTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },

  previewText: {
    fontSize: 12,
    marginTop: 4,
  },

  previewPrice: {
    marginTop: 7,
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 10,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  clientSearch: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  clientSearchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
  },

  clientResults: {
    maxHeight: 190,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  clientResult: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  clientResultName: {
    fontSize: 14,
    fontWeight: "600",
  },

  clientResultDetails: {
    marginTop: 2,
    fontSize: 12,
  },

  clientNoResults: {
    padding: 14,
    fontSize: 13,
  },

  smallChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  smallChipText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  optionCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 72,
    justifyContent: "center",
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },

  optionPrice: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "bold",
  },

  financeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  inputWrap: {
    width: "48%",
    marginBottom: 12,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 13,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: "bold",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 6,
  },

  confirmationBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  confirmationCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  confirmationMessage: {
    fontSize: 14,
    textAlign: "center",
  },

  confirmationButton: {
    minWidth: 110,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  saveButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
