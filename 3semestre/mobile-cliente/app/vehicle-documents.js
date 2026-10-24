import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalizedAlert } from "../components/LocalizedAlert";
import { LocalizedText as Text } from "../components/LocalizedText";
import { translateText } from "../contexts/translations";
import { useAuth } from "../contexts/AuthContext";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  getAccessToken,
  getBearerHeaders,
  getDocumentList,
  isPdfSelection,
  partitionDocumentsByType,
} from "../utils/vehicleDocuments";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

const demoManuals = {
  "pt-BR": require("../assets/documents/vehicle-manual-pt-BR.pdf"),
  "en-US": require("../assets/documents/vehicle-manual-en-US.pdf"),
  "es-ES": require("../assets/documents/vehicle-manual-es-ES.pdf"),
  "ja-JP": require("../assets/documents/vehicle-manual-ja-JP.pdf"),
};

function vehicleValue(vehicle, keys, fallback) {
  for (const key of keys) {
    if (vehicle?.[key] !== undefined && vehicle[key] !== null && vehicle[key] !== "") {
      return String(vehicle[key]);
    }
  }
  return fallback;
}

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function isUnauthorizedResponse(response) {
  return response.status === 401 || response.status === 403;
}

function getRouteVehicleId(vehicleParam, explicitVehicleId) {
  const rawId = Array.isArray(explicitVehicleId)
    ? explicitVehicleId[0]
    : explicitVehicleId;
  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== "") {
    return String(rawId);
  }

  try {
    const serialized = Array.isArray(vehicleParam) ? vehicleParam[0] : vehicleParam;
    const vehicle = serialized ? JSON.parse(serialized) : null;
    return vehicle?.id === undefined || vehicle?.id === null
      ? ""
      : String(vehicle.id);
  } catch {
    return "";
  }
}

function getPdfFileName(asset) {
  const name = asset.name || asset.fileName || "documento.pdf";
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

function getDocumentFileName(document) {
  const name = String(document?.nome || "documento.pdf").split(/[\\/]/).pop();
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

function formatDocumentSize(size, language) {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";

  if (bytes < 1024) {
    return `${new Intl.NumberFormat(language).format(bytes)} bytes`;
  }

  const unit = bytes < 1024 * 1024 ? "KB" : "MB";
  const amount = bytes < 1024 * 1024 ? bytes / 1024 : bytes / (1024 * 1024);
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(amount)} ${unit}`;
}

function formatDocumentDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const options = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? { timeZone: "UTC" }
    : undefined;
  return date.toLocaleDateString(language, options);
}

async function appendPickedFile(formData, asset, fileName) {
  if (Platform.OS === "web") {
    const file = asset.file || (await fetch(asset.uri).then((response) => response.blob()));
    formData.append("arquivo", file, fileName);
    return;
  }

  formData.append("arquivo", {
    uri: asset.uri,
    name: fileName,
    type: "application/pdf",
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the PDF"));
    reader.onloadend = () => {
      const result = String(reader.result || "");
      const separator = result.indexOf(",");
      if (separator < 0) {
        reject(new Error("Could not encode the PDF"));
        return;
      }
      resolve(result.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

async function saveDocumentToCache(document, blob) {
  const base64 = await blobToBase64(blob);
  if (!FileSystem.cacheDirectory) throw new Error("Cache unavailable");
  const safeId = String(document.id).replace(/[^a-zA-Z0-9_-]/g, "_");
  const localUri = `${FileSystem.cacheDirectory}vehicle-document-${safeId}.pdf`;
  await FileSystem.writeAsStringAsync(localUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return localUri;
}

export default function VehicleDocumentsPage() {
  const {
    vehicle: vehicleParam,
    vehicleId: explicitVehicleId,
  } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { settings } = useAccessibility();
  const { user, logout } = useAuth();
  const Alert = useLocalizedAlert();
  const localize = (text) => translateText(text, settings.language);
  const clientEmail = getUserEmail(user);
  const accessToken = getAccessToken(user);
  const vehicleId = getRouteVehicleId(vehicleParam, explicitVehicleId);
  const [pdfError, setPdfError] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [verifiedOwner, setVerifiedOwner] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [requiresReauthentication, setRequiresReauthentication] = useState(false);
  const demoManual = demoManuals[settings.language] || demoManuals["pt-BR"];

  const showSessionExpired = useCallback(() => {
    setErrorMessage("Sua sessão expirou. Faça login novamente.");
    setRequiresReauthentication(true);
  }, []);

  const loadDocuments = useCallback(async () => {
    setErrorMessage("");

    if (!clientEmail || !vehicleId || !accessToken) {
      setVehicle(null);
      setVerifiedOwner(null);
      setDocuments([]);
      if (!accessToken) {
        showSessionExpired();
      } else if (!clientEmail) {
        setErrorMessage("Não foi possível identificar sua conta. Faça login novamente.");
        setRequiresReauthentication(true);
      } else {
        setErrorMessage("Não foi possível identificar o veículo selecionado.");
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRequiresReauthentication(false);
    try {
      const clientResponse = await fetch(
        `${API_URL}/clientes/${encodeURIComponent(clientEmail)}`,
        { headers: getBearerHeaders(accessToken) },
      );
      if (!clientResponse.ok) {
        throw new Error(isUnauthorizedResponse(clientResponse) ? "unauthorized" : "client");
      }

      const client = await clientResponse.json();
      const ownedVehicle = (Array.isArray(client?.veiculos) ? client.veiculos : [])
        .find((item) => String(item?.id) === vehicleId);

      if (!ownedVehicle) {
        setVehicle(null);
        setVerifiedOwner(null);
        setDocuments([]);
        setErrorMessage("Não foi possível confirmar que este veículo pertence à sua conta.");
        return;
      }

      setVehicle(ownedVehicle);
      setVerifiedOwner({ email: clientEmail, vehicleId });
      const response = await fetch(
        `${API_URL}/veiculos/${encodeURIComponent(vehicleId)}/documentos`,
        { headers: getBearerHeaders(accessToken) },
      );
      if (!response.ok) {
        throw new Error(isUnauthorizedResponse(response) ? "unauthorized" : "documents");
      }

      setDocuments(getDocumentList(await response.json()));
    } catch (error) {
      if (error?.message === "unauthorized") {
        showSessionExpired();
      } else {
        setErrorMessage("Não foi possível carregar os documentos. Tente novamente.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, clientEmail, showSessionExpired, vehicleId]);

  const isVehicleVerified =
    verifiedOwner?.email === clientEmail && verifiedOwner?.vehicleId === vehicleId;
  const vehicleDetails = isVehicleVerified ? vehicle : null;
  const visibleDocuments = isVehicleVerified ? documents : [];
  const { manuals: uploadedManuals, documents: uploadedDocuments } =
    partitionDocumentsByType(visibleDocuments);
  const showManualDemo = !loading && uploadedManuals.length === 0;
  const showDocumentDemo = !loading && uploadedDocuments.length === 0;
  const demoDisclaimer =
    showDocumentDemo && showManualDemo
      ? "Estes dados e o manual são exemplos criados para demonstração. Não são documentos oficiais e não possuem validade legal."
      : showDocumentDemo
      ? "Estes dados são exemplos criados para demonstração. Não são documentos oficiais e não possuem validade legal."
      : "O manual é um exemplo criado para demonstração. Não é um documento oficial e não possui validade legal.";

  useEffect(() => {
    setLoading(true);
    loadDocuments();
  }, [loadDocuments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const details = [
    ["Marca", vehicleValue(vehicleDetails, ["marcaVeiculo", "marca"], "Toyota")],
    ["Modelo", vehicleValue(vehicleDetails, ["modeloVeiculo", "modelo", "nome"], "Veículo Toyota")],
    ["Ano", vehicleValue(vehicleDetails, ["anoVeiculo", "ano"], "Ano não informado")],
    ["Cor", vehicleValue(vehicleDetails, ["corVeiculo", "cor"], "Cor não informada")],
    ["Motor", vehicleValue(vehicleDetails, ["motorVeiculo", "motor"], "Motor não informado")],
    ["Câmbio", vehicleValue(vehicleDetails, ["cambioVeiculo", "cambio"], "Não informado")],
    ["Combustível", vehicleValue(vehicleDetails, ["combustivelVeiculo", "combustivel"], "Não informado")],
    ["Chassi", vehicleValue(vehicleDetails, ["chassiVeiculo", "chassi"], "Não informado")],
    ["Placa", vehicleValue(vehicleDetails, ["placaVeiculo", "placa"], "Não informada")],
    ["Próxima revisão", vehicleValue(vehicleDetails, ["dataProximaRevisao", "proximaRevisao"], "Não informada")],
  ];

  const openDemoPdf = async () => {
    setPdfError(false);
    try {
      const asset = Asset.fromModule(demoManual);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (!uri) throw new Error("PDF asset URI unavailable");
      await Linking.openURL(uri);
    } catch {
      setPdfError(true);
    }
  };

  const handleUpload = async (tipo) => {
    if (!isVehicleVerified) {
      setErrorMessage("Não foi possível confirmar que este veículo pertence à sua conta.");
      return;
    }

    setErrorMessage("");
    setUploadingType(tipo);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!isPdfSelection(asset)) {
        setErrorMessage("Selecione um arquivo PDF válido.");
        return;
      }

      const fileName = getPdfFileName(asset);
      const formData = new FormData();
      await appendPickedFile(formData, asset, fileName);
      formData.append("tipo", tipo);

      const response = await fetch(
        `${API_URL}/veiculos/${encodeURIComponent(vehicleId)}/documentos`,
        {
          method: "POST",
          headers: getBearerHeaders(accessToken),
          body: formData,
        },
      );
      if (!response.ok) {
        throw new Error(isUnauthorizedResponse(response) ? "unauthorized" : "upload");
      }

      await loadDocuments();
    } catch (error) {
      if (error?.message === "unauthorized") {
        showSessionExpired();
      } else {
        setErrorMessage("Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setUploadingType("");
    }
  };

  const handleReauthentication = async () => {
    await logout();
    router.replace("/login");
  };

  const handleOpenDocument = async (document) => {
    if (!isVehicleVerified) {
      setErrorMessage("Não foi possível confirmar que este veículo pertence à sua conta.");
      return;
    }

    setOpeningDocumentId(document.id);
    setErrorMessage("");
    let previewWindow = null;
    if (Platform.OS === "web") {
      previewWindow = window.open("about:blank", "_blank");
      if (previewWindow) previewWindow.opener = null;
    }
    try {
      const response = await fetch(
        `${API_URL}/veiculos/${encodeURIComponent(vehicleId)}/documentos/${encodeURIComponent(document.id)}/arquivo`,
        { headers: getBearerHeaders(accessToken) },
      );
      if (!response.ok) {
        throw new Error(isUnauthorizedResponse(response) ? "unauthorized" : "download");
      }

      const file = await response.blob();
      if (Platform.OS === "web") {
        if (!previewWindow) throw new Error("popup");
        const fileUrl = URL.createObjectURL(file);
        previewWindow.location.href = fileUrl;
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 5 * 60 * 1000);
      } else {
        const localUri = await saveDocumentToCache(document, file);
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error("sharing unavailable");
        }
        await Sharing.shareAsync(localUri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: document.nome || "Documento PDF",
        });
      }
    } catch (error) {
      previewWindow?.close?.();
      if (error?.message === "unauthorized") {
        showSessionExpired();
      } else {
        setErrorMessage("Não foi possível abrir este arquivo neste dispositivo.");
      }
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const handleDownloadDocument = async (document) => {
    if (!isVehicleVerified) {
      setErrorMessage("Não foi possível confirmar que este veículo pertence à sua conta.");
      return;
    }

    setDownloadingDocumentId(document.id);
    setErrorMessage("");
    try {
      const response = await fetch(
        `${API_URL}/veiculos/${encodeURIComponent(vehicleId)}/documentos/${encodeURIComponent(document.id)}/arquivo`,
        { headers: getBearerHeaders(accessToken) },
      );
      if (!response.ok) {
        throw new Error(isUnauthorizedResponse(response) ? "unauthorized" : "download");
      }

      const file = await response.blob();
      if (Platform.OS === "web") {
        const fileUrl = URL.createObjectURL(file);
        const link = window.document.createElement("a");
        link.href = fileUrl;
        link.download = getDocumentFileName(document);
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 5 * 60 * 1000);
      } else {
        const localUri = await saveDocumentToCache(document, file);
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error("sharing unavailable");
        }
        await Sharing.shareAsync(localUri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: document.nome || "Documento PDF",
        });
      }
    } catch (error) {
      if (error?.message === "unauthorized") {
        showSessionExpired();
      } else {
        setErrorMessage("Não foi possível baixar este arquivo. Tente novamente.");
      }
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const removeDocument = async (document) => {
    if (!isVehicleVerified) {
      setErrorMessage("Não foi possível confirmar que este veículo pertence à sua conta.");
      return;
    }

    setDeletingDocumentId(document.id);
    setErrorMessage("");
    try {
      const response = await fetch(
        `${API_URL}/veiculos/${encodeURIComponent(vehicleId)}/documentos/${encodeURIComponent(document.id)}/arquivo`,
        {
          method: "DELETE",
          headers: getBearerHeaders(accessToken),
        },
      );
      if (!response.ok) {
        throw new Error(isUnauthorizedResponse(response) ? "unauthorized" : "delete");
      }
      setDocuments((current) =>
        current.filter((item) => String(item.id) !== String(document.id)),
      );
    } catch (error) {
      if (error?.message === "unauthorized") {
        showSessionExpired();
      } else {
        setErrorMessage("Não foi possível remover o arquivo. Tente novamente.");
      }
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const confirmRemoveDocument = (document) => {
    Alert.alert(
      "Remover arquivo?",
      "O arquivo PDF será removido da sua conta.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeDocument(document),
        },
      ],
    );
  };

  const renderUploadedDocuments = (title, entries) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {entries.map((document) => {
        const kind =
          String(document.tipo || "").toLowerCase() === "manual"
            ? "Manual"
            : "Documento";
        const size = formatDocumentSize(document.tamanho, settings.language);
        const date = formatDocumentDate(document.dataCriacao, settings.language);
        const metadata = [kind, size, date].filter(Boolean).join(" • ");
        const isOpening = openingDocumentId === document.id;
        const isDownloading = downloadingDocumentId === document.id;
        const isDeleting = deletingDocumentId === document.id;

        return (
          <View
            key={String(document.id)}
            style={[styles.documentRow, { borderBottomColor: theme.box }]}
          >
            <Ionicons name="document-text-outline" size={22} color={theme.primary} />
            <View style={styles.documentInfo}>
              <Text
                style={[styles.documentName, { color: theme.text }]}
                numberOfLines={2}
              >
                {document.nome || "Documento PDF"}
              </Text>
              <Text style={[styles.documentMeta, { color: theme.subtext }]}>
                {metadata}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={localize("Abrir arquivo")}
              accessibilityHint={localize("Abre o PDF neste dispositivo")}
              disabled={isOpening || isDownloading || !isVehicleVerified}
              onPress={() => handleOpenDocument(document)}
              style={styles.iconButton}
            >
              {isOpening ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="open-outline" size={21} color={theme.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={localize("Baixar arquivo")}
              accessibilityHint={localize("Baixa o PDF neste dispositivo")}
              disabled={isOpening || isDownloading || !isVehicleVerified}
              onPress={() => handleDownloadDocument(document)}
              style={styles.iconButton}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="download-outline" size={21} color={theme.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={localize("Remover arquivo")}
              accessibilityHint={localize("Remove o PDF da sua conta")}
              disabled={isDeleting || !isVehicleVerified}
              onPress={() => confirmRemoveDocument(document)}
              style={styles.iconButton}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="trash-outline" size={21} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela do veículo"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Documentação do veículo
        </Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>
            Carregando documentos...
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          <View style={styles.errorContent}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            {requiresReauthentication ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={localize("Fazer login")}
                onPress={handleReauthentication}
                style={[styles.reauthenticationButton, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.pdfButtonText}>Fazer login</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Arquivos compartilhados da conta
        </Text>
        <Text style={[styles.manualCopy, { color: theme.subtext }]}>
          PDFs enviados ficam salvos na sua conta e podem ser acessados no aplicativo e na web.
        </Text>
        <View style={styles.uploadButtons}>
          {[
            ["manual", "Adicionar manual"],
            ["documento", "Adicionar documento"],
          ].map(([tipo, label]) => (
            <TouchableOpacity
              key={tipo}
              accessibilityRole="button"
              accessibilityLabel={localize(label)}
              accessibilityHint={localize("Escolha um arquivo PDF para enviar")}
              disabled={Boolean(uploadingType) || loading || !vehicle || !isVehicleVerified}
              onPress={() => handleUpload(tipo)}
              style={[
                styles.uploadButton,
                { backgroundColor: theme.primary },
                (uploadingType || loading || !vehicle || !isVehicleVerified) && styles.disabledButton,
              ]}
            >
              {uploadingType === tipo ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              )}
              <Text style={styles.pdfButtonText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showDocumentDemo || showManualDemo ? (
        <>
          <View style={[styles.notice, { backgroundColor: "#7f1d1d" }]}>
            <Ionicons name="warning-outline" size={22} color="#fff" />
            <Text style={styles.noticeText}>
              FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL
            </Text>
          </View>
          <Text style={[styles.disclaimer, { color: theme.subtext }]}>
            {demoDisclaimer}
          </Text>
        </>
      ) : null}

      {loading ? null : showDocumentDemo ? (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Dados demonstrativos
          </Text>
          {details.map(([label, value]) => (
            <View key={label} style={[styles.detail, { borderBottomColor: theme.box }]}>
              <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
              <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
            </View>
          ))}
        </View>
      ) : (
        renderUploadedDocuments("Documentos enviados", uploadedDocuments)
      )}

      {loading ? null : showManualDemo ? (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.manualHeading}>
            <Ionicons name="document-text-outline" size={23} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Manual do veículo (exemplo)
            </Text>
          </View>
          <Text style={[styles.manualCopy, { color: theme.subtext }]}>
            Guia demonstrativo para identificação e consulta do veículo. O conteúdo é fictício e não substitui instruções do fabricante, assistência técnica ou documentação oficial.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={localize("Visualizar PDF fictício")}
            onPress={openDemoPdf}
            style={[styles.pdfButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={styles.pdfButtonText}>Visualizar PDF fictício</Text>
          </TouchableOpacity>
          {pdfError ? (
            <Text style={styles.errorText}>
              Não foi possível abrir o PDF neste dispositivo. Use a visualização demonstrativa desta tela.
            </Text>
          ) : null}
        </View>
      ) : (
        renderUploadedDocuments("Manuais enviados", uploadedManuals)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 12 },
  loadingText: { fontSize: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 2 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 22, fontWeight: "bold" },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  noticeText: { color: "#fff", fontSize: 13, fontWeight: "bold", textAlign: "center" },
  disclaimer: { fontSize: 13, lineHeight: 20 },
  card: { padding: 16, borderRadius: 14, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "bold" },
  detail: { borderBottomWidth: 1, paddingBottom: 9, gap: 3 },
  label: { fontSize: 12 },
  value: { fontSize: 14, fontWeight: "600" },
  manualHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  manualCopy: { fontSize: 14, lineHeight: 21 },
  pdfButton: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pdfButtonText: { color: "#fff", fontWeight: "bold" },
  errorText: { color: "#ef4444", fontSize: 13, lineHeight: 19 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 12,
  },
  errorContent: { flex: 1, gap: 10 },
  reauthenticationButton: {
    minHeight: 40,
    alignSelf: "flex-start",
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtons: { gap: 10 },
  uploadButton: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: { opacity: 0.55 },
  emptyText: { fontSize: 14, lineHeight: 20, paddingVertical: 5 },
  documentRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  documentInfo: { flex: 1, gap: 3 },
  documentName: { fontSize: 14, fontWeight: "600" },
  documentMeta: { fontSize: 12 },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
