import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Download, Printer, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Language, useLanguage } from "@/contexts/LanguageContext";
import {
  isPdfFile,
  parseDocumentationVehicle,
  parseDocumentationVehicleId,
  safeDocumentFilename,
  type DocumentationVehicle,
  type VehicleDocument,
  type VehicleDocumentType,
} from "@/lib/vehicleDocumentation";
import { vehicleDocumentsApi } from "@/services/vehicleDocuments";

const labels: Record<Language, {
  title: string;
  subtitle: string;
  warning: string;
  manualPdfUrl: string;
  details: string;
  manualTitle: string;
  manualIntro: string;
  sections: { title: string; body: string }[];
  exampleNote: string;
  pdfTitle: string;
  openPdf: string;
  downloadPdf: string;
  print: string;
  back: string;
  fields: { key: keyof DocumentationVehicle; label: string; example: string }[];
}> = {
  "pt-BR": {
    title: "Documentação do veículo",
    subtitle: "Toyota ACE",
    warning: "MODELO DE DEMONSTRAÇÃO",
    manualPdfUrl: "/assets/manual-demonstracao-toyota-ace.pdf",
    details: "Dados de referência",
    manualTitle: "Manual fictício de demonstração",
    manualIntro: "Este conteúdo genérico é uma amostra de interface, não corresponde a um modelo, ano ou configuração real.",
    sections: [
      { title: "1. Antes de utilizar", body: "Confira o entorno do veículo e mantenha objetos soltos organizados. Os comandos e equipamentos variam conforme o veículo real; consulte materiais oficiais aplicáveis antes de qualquer uso." },
      { title: "2. Cuidados gerais", body: "Mantenha o interior limpo e observe o veículo quanto a alterações aparentes. Para limpeza, peças, fluidos ou qualquer procedimento, siga somente as informações oficiais do fabricante e procure um profissional qualificado." },
      { title: "3. Sinais de alerta", body: "Se houver luz de advertência, ruído incomum, odor ou comportamento inesperado, pare em local seguro quando possível e procure assistência qualificada. Esta demonstração não substitui diagnóstico ou orientação de emergência." },
      { title: "4. Inspeções e manutenção", body: "Intervalos, especificações e procedimentos dependem do veículo e das condições de uso. Confirme-os em documentação oficial específica ou com uma concessionária autorizada; não realize serviços com base nesta amostra." },
      { title: "5. Contatos e assistência", body: "Use os canais oficiais e serviços de emergência da sua região conforme a situação. Este exemplo não fornece contatos, garantias, cobertura ou compromissos de atendimento." },
    ],
    exampleNote: "Campos ausentes são preenchidos com exemplos ilustrativos. Esses exemplos não identificam nem descrevem o veículo real.",
    pdfTitle: "Arquivo PDF",
    openPdf: "Abrir PDF",
    downloadPdf: "Baixar PDF",
    print: "Imprimir esta página",
    back: "Voltar aos veículos",
    fields: [
      { key: "marcaVeiculo", label: "Marca", example: "Toyota ACE (exemplo)" },
      { key: "modeloVeiculo", label: "Modelo", example: "Corolla (exemplo)" },
      { key: "anoVeiculo", label: "Ano", example: "2025 (exemplo)" },
      { key: "corVeiculo", label: "Cor", example: "Prata (exemplo)" },
      { key: "motorVeiculo", label: "Motor", example: "Híbrido (exemplo)" },
      { key: "cambioVeiculo", label: "Câmbio", example: "Automático (exemplo)" },
      { key: "combustivelVeiculo", label: "Combustível", example: "Híbrido (exemplo)" },
    ],
  },
  "en-US": {
    title: "Vehicle documentation",
    subtitle: "Toyota ACE vehicle records",
    warning: "DEMONSTRATION SAMPLE",
    manualPdfUrl: "/assets/manual-demonstracao-toyota-ace.en-US.pdf",
    details: "Reference data",
    manualTitle: "Fictional demonstration manual",
    manualIntro: "This generic content is an interface sample and does not correspond to a real model, year, or configuration.",
    sections: [
      { title: "1. Before use", body: "Check the area around the vehicle and secure loose items. Controls and equipment vary by real vehicle; consult applicable official materials before use." },
      { title: "2. General care", body: "Keep the interior clean and watch for visible changes. For cleaning, parts, fluids, or any procedure, follow only the manufacturer's official information and consult a qualified professional." },
      { title: "3. Warning signs", body: "If a warning light, unusual noise, odor, or unexpected behavior occurs, stop in a safe place when possible and seek qualified assistance. This demonstration does not replace diagnosis or emergency advice." },
      { title: "4. Inspections and maintenance", body: "Intervals, specifications, and procedures depend on the vehicle and its use. Confirm them in vehicle-specific official documentation or with an authorized dealer; do not service a vehicle based on this sample." },
      { title: "5. Contacts and assistance", body: "Use official channels and local emergency services as appropriate. This sample provides no contacts, warranties, coverage, or service commitments." },
    ],
    exampleNote: "Missing fields are filled with illustrative examples. These examples do not identify or describe the real vehicle.",
    pdfTitle: "PDF file",
    openPdf: "Open PDF",
    downloadPdf: "Download PDF",
    print: "Print this page",
    back: "Back to vehicles",
    fields: [
      { key: "marcaVeiculo", label: "Make", example: "Toyota ACE (example)" },
      { key: "modeloVeiculo", label: "Model", example: "Corolla (example)" },
      { key: "anoVeiculo", label: "Year", example: "2025 (example)" },
      { key: "corVeiculo", label: "Color", example: "Silver (example)" },
      { key: "motorVeiculo", label: "Engine", example: "Hybrid (example)" },
      { key: "cambioVeiculo", label: "Transmission", example: "Automatic (example)" },
      { key: "combustivelVeiculo", label: "Fuel", example: "Hybrid (example)" },
    ],
  },
  "es-ES": {
    title: "Documentación del vehículo",
    subtitle: "Documentación de Toyota ACE",
    warning: "MODELO DE DEMOSTRACIÓN",
    manualPdfUrl: "/assets/manual-demonstracao-toyota-ace.es-ES.pdf",
    details: "Datos de referencia",
    manualTitle: "Manual ficticio de demostración",
    manualIntro: "Este contenido genérico es una muestra de interfaz y no corresponde a un modelo, año o configuración reales.",
    sections: [
      { title: "1. Antes de utilizar", body: "Compruebe el entorno del vehículo y mantenga organizados los objetos sueltos. Los mandos y equipos varían según el vehículo real; consulte los materiales oficiales aplicables antes de usarlo." },
      { title: "2. Cuidados generales", body: "Mantenga limpio el interior y observe si hay cambios visibles. Para la limpieza, piezas, líquidos o cualquier procedimiento, siga únicamente la información oficial del fabricante y consulte a un profesional cualificado." },
      { title: "3. Señales de advertencia", body: "Si aparece un testigo, ruido u olor inusual o un comportamiento inesperado, deténgase en un lugar seguro cuando sea posible y solicite asistencia cualificada. Esta demostración no sustituye un diagnóstico ni consejos de emergencia." },
      { title: "4. Inspecciones y mantenimiento", body: "Los intervalos, especificaciones y procedimientos dependen del vehículo y de su uso. Confírmelos en documentación oficial específica o con un concesionario autorizado; no realice servicios basándose en esta muestra." },
      { title: "5. Contactos y asistencia", body: "Utilice los canales oficiales y los servicios de emergencia de su zona según corresponda. Este ejemplo no ofrece contactos, garantías, cobertura ni compromisos de servicio." },
    ],
    exampleNote: "Los campos sin datos se completan con ejemplos ilustrativos. Estos ejemplos no identifican ni describen el vehículo real.",
    pdfTitle: "Archivo PDF",
    openPdf: "Abrir PDF",
    downloadPdf: "Descargar PDF",
    print: "Imprimir esta página",
    back: "Volver a los vehículos",
    fields: [
      { key: "marcaVeiculo", label: "Marca", example: "Toyota ACE (ejemplo)" },
      { key: "modeloVeiculo", label: "Modelo", example: "Corolla (ejemplo)" },
      { key: "anoVeiculo", label: "Año", example: "2025 (ejemplo)" },
      { key: "corVeiculo", label: "Color", example: "Plata (ejemplo)" },
      { key: "motorVeiculo", label: "Motor", example: "Híbrido (ejemplo)" },
      { key: "cambioVeiculo", label: "Transmisión", example: "Automática (ejemplo)" },
      { key: "combustivelVeiculo", label: "Combustible", example: "Híbrido (ejemplo)" },
    ],
  },
  "ja-JP": {
    title: "車両の資料",
    subtitle: "Toyota ACE 車両情報",
    warning: "デモ用サンプル",
    manualPdfUrl: "/assets/manual-demonstracao-toyota-ace.ja-JP.pdf",
    details: "参考データ",
    manualTitle: "架空のデモ用マニュアル",
    manualIntro: "これは画面表示用の一般的なサンプルであり、実在する車種、年式、仕様を示すものではありません。",
    sections: [
      { title: "1. 使用前の確認", body: "車両の周囲を確認し、車内の荷物を安全に整理してください。操作部や装備は実車によって異なります。使用前に該当する公式資料を確認してください。" },
      { title: "2. 日常のお手入れ", body: "車内を清潔に保ち、外観に変化がないか確認してください。清掃、部品、液体類、その他の作業については、必ずメーカーの公式情報を確認し、資格を持つ専門家に相談してください。" },
      { title: "3. 警告の兆候", body: "警告灯、異音、異臭、予期しない動作があった場合、安全を確保できる場所に停車し、専門家に相談してください。このデモは診断や緊急時の助言に代わるものではありません。" },
      { title: "4. 点検と整備", body: "点検時期、仕様、作業方法は車両や使用状況によって異なります。車両固有の公式資料または正規販売店で確認してください。このサンプルに基づく整備は行わないでください。" },
      { title: "5. 問い合わせとサポート", body: "状況に応じて、公式窓口または地域の緊急サービスをご利用ください。このサンプルは連絡先、保証、補償、対応を約束するものではありません。" },
    ],
    exampleNote: "未入力の項目には説明用の例を表示しています。例は実際の車両を特定・説明するものではありません。",
    pdfTitle: "PDF ファイル",
    openPdf: "PDF を開く",
    downloadPdf: "PDF をダウンロード",
    print: "このページを印刷",
    back: "車両一覧に戻る",
    fields: [
      { key: "marcaVeiculo", label: "メーカー", example: "Toyota ACE（例）" },
      { key: "modeloVeiculo", label: "車種", example: "カローラ（例）" },
      { key: "anoVeiculo", label: "年式", example: "2025年（例）" },
      { key: "corVeiculo", label: "色", example: "シルバー（例）" },
      { key: "motorVeiculo", label: "エンジン", example: "ハイブリッド（例）" },
      { key: "cambioVeiculo", label: "トランスミッション", example: "オートマチック（例）" },
      { key: "combustivelVeiculo", label: "燃料", example: "ハイブリッド（例）" },
    ],
  },
};

const documentManagementText: Record<Language, {
  title: string;
  description: string;
  typeLabel: string;
  manual: string;
  document: string;
  fileLabel: string;
  chooseFile: string;
  upload: string;
  uploading: string;
  loading: string;
  empty: string;
  missingVehicle: string;
  missingAuth: string;
  signIn: string;
  loadError: string;
  downloadError: string;
  openError: string;
  uploadError: string;
  deleteError: string;
  invalidPdf: string;
  uploaded: string;
  demoFiles: string;
  userFiles: string;
  open: string;
  download: string;
  remove: string;
  removing: string;
  bytes: string;
  added: string;
}> = {
  "pt-BR": {
    title: "Seus arquivos",
    description: "Envie PDFs do veículo. Os arquivos ficam associados a este veículo na sua conta e são compartilhados com o app mobile.",
    typeLabel: "Tipo de arquivo",
    manual: "Manual",
    document: "Documento",
    fileLabel: "Arquivo PDF",
    chooseFile: "Selecione um arquivo PDF",
    upload: "Enviar PDF",
    uploading: "Enviando…",
    loading: "Carregando arquivos…",
    empty: "Nenhum arquivo enviado para este veículo.",
    missingVehicle: "Não foi possível identificar o veículo. Volte à lista e abra a documentação pelo veículo selecionado.",
    missingAuth: "Sua sessão não está autenticada. Entre novamente para acessar os arquivos do veículo.",
    signIn: "Entrar novamente",
    loadError: "Não foi possível carregar os arquivos. Tente novamente.",
    downloadError: "Não foi possível baixar o arquivo. Tente novamente.",
    openError: "Não foi possível abrir o arquivo. Tente novamente.",
    uploadError: "Não foi possível enviar o arquivo. Tente novamente.",
    deleteError: "Não foi possível remover o arquivo. Tente novamente.",
    invalidPdf: "Selecione um arquivo PDF válido.",
    uploaded: "Arquivo enviado com sucesso.",
    demoFiles: "Material demonstrativo (não enviado)",
    userFiles: "Arquivos enviados por você",
    open: "Abrir",
    download: "Baixar",
    remove: "Remover",
    removing: "Removendo…",
    bytes: "bytes",
    added: "Adicionado",
  },
  "en-US": {
    title: "Your files",
    description: "Upload vehicle PDFs. Files are stored with this vehicle in your account and shared with the mobile app.",
    typeLabel: "File type",
    manual: "Manual",
    document: "Document",
    fileLabel: "PDF file",
    chooseFile: "Choose a PDF file",
    upload: "Upload PDF",
    uploading: "Uploading…",
    loading: "Loading files…",
    empty: "No files have been uploaded for this vehicle.",
    missingVehicle: "The vehicle could not be identified. Return to the list and open documentation for the selected vehicle.",
    missingAuth: "Your session is not authenticated. Sign in again to access vehicle files.",
    signIn: "Sign in again",
    loadError: "Could not load files. Please try again.",
    downloadError: "Could not download the file. Please try again.",
    openError: "Could not open the file. Please try again.",
    uploadError: "Could not upload the file. Please try again.",
    deleteError: "Could not remove the file. Please try again.",
    invalidPdf: "Choose a valid PDF file.",
    uploaded: "File uploaded successfully.",
    demoFiles: "Demonstration material (not uploaded)",
    userFiles: "Files you uploaded",
    open: "Open",
    download: "Download",
    remove: "Remove",
    removing: "Removing…",
    bytes: "bytes",
    added: "Added",
  },
  "es-ES": {
    title: "Tus archivos",
    description: "Sube archivos PDF del vehículo. Se guardan asociados a este vehículo en tu cuenta y se comparten con la aplicación móvil.",
    typeLabel: "Tipo de archivo",
    manual: "Manual",
    document: "Documento",
    fileLabel: "Archivo PDF",
    chooseFile: "Selecciona un archivo PDF",
    upload: "Subir PDF",
    uploading: "Subiendo…",
    loading: "Cargando archivos…",
    empty: "No se han subido archivos para este vehículo.",
    missingVehicle: "No se pudo identificar el vehículo. Vuelve a la lista y abre la documentación del vehículo seleccionado.",
    missingAuth: "Tu sesión no está autenticada. Inicia sesión de nuevo para acceder a los archivos del vehículo.",
    signIn: "Iniciar sesión de nuevo",
    loadError: "No se pudieron cargar los archivos. Inténtalo de nuevo.",
    downloadError: "No se pudo descargar el archivo. Inténtalo de nuevo.",
    openError: "No se pudo abrir el archivo. Inténtalo de nuevo.",
    uploadError: "No se pudo subir el archivo. Inténtalo de nuevo.",
    deleteError: "No se pudo eliminar el archivo. Inténtalo de nuevo.",
    invalidPdf: "Selecciona un archivo PDF válido.",
    uploaded: "Archivo subido correctamente.",
    demoFiles: "Material de demostración (no subido)",
    userFiles: "Archivos que has subido",
    open: "Abrir",
    download: "Descargar",
    remove: "Eliminar",
    removing: "Eliminando…",
    bytes: "bytes",
    added: "Añadido",
  },
  "ja-JP": {
    title: "登録したファイル",
    description: "車両の PDF をアップロードできます。ファイルはアカウント内のこの車両に保存され、モバイルアプリとも共有されます。",
    typeLabel: "ファイルの種類",
    manual: "マニュアル",
    document: "書類",
    fileLabel: "PDF ファイル",
    chooseFile: "PDF ファイルを選択",
    upload: "PDF をアップロード",
    uploading: "アップロード中…",
    loading: "ファイルを読み込み中…",
    empty: "この車両にアップロードされたファイルはありません。",
    missingVehicle: "車両を確認できません。車両一覧に戻り、選択した車両の資料を開いてください。",
    missingAuth: "セッションを認証できません。車両ファイルにアクセスするには、もう一度ログインしてください。",
    signIn: "再度ログイン",
    loadError: "ファイルを読み込めませんでした。もう一度お試しください。",
    downloadError: "ファイルをダウンロードできませんでした。もう一度お試しください。",
    openError: "ファイルを開けませんでした。もう一度お試しください。",
    uploadError: "ファイルをアップロードできませんでした。もう一度お試しください。",
    deleteError: "ファイルを削除できませんでした。もう一度お試しください。",
    invalidPdf: "有効な PDF ファイルを選択してください。",
    uploaded: "ファイルをアップロードしました。",
    demoFiles: "デモ用資料（アップロードされていません）",
    userFiles: "アップロードしたファイル",
    open: "開く",
    download: "ダウンロード",
    remove: "削除",
    removing: "削除中…",
    bytes: "バイト",
    added: "追加日",
  },
};

function parseDownloadedFilename(disposition: string | null, fallback: string) {
  if (!disposition) return safeDocumentFilename(fallback);
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const regular = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  let name = regular || fallback;
  if (encoded) {
    try {
      name = decodeURIComponent(encoded);
    } catch {
      name = fallback;
    }
  }
  return safeDocumentFilename(name);
}

function isVehicleDocument(value: unknown): value is VehicleDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<VehicleDocument>;
  return (typeof document.id === "number" || typeof document.id === "string") &&
    (typeof document.id === "number"
      ? Number.isSafeInteger(document.id) && document.id > 0
      : /^[A-Za-z0-9_-]+$/.test(document.id)) &&
    typeof document.nome === "string" &&
    (document.tipo === "manual" || document.tipo === "documento") &&
    typeof document.tamanho === "number" &&
    typeof document.dataCriacao === "string";
}

function displayFileSize(bytes: number, unit: string) {
  return `${Math.max(0, bytes).toLocaleString()} ${unit}`;
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && /\((401|403)\)$/.test(error.message);
}

const validLanguages: Language[] = ["pt-BR", "en-US", "es-ES", "ja-JP"];

export default function VehicleDocumentationPage() {
  const { language, setLanguage } = useLanguage();
  const { accessToken, isLoading: authLoading, logout } = useAuth();
  const content = labels[language];
  const documentText = documentManagementText[language];
  const vehicle = parseDocumentationVehicle(window.location.search);
  const vehicleId = parseDocumentationVehicleId(window.location.search);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<number | string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<VehicleDocumentType>("documento");
  const [documentError, setDocumentError] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const hasUploadedDocument = documents.some((file) => file.tipo === "documento");
  const hasUploadedManual = documents.some((file) => file.tipo === "manual");
  const signInUrl = `/login?returnTo=${encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  )}`;

  useEffect(() => {
    const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
    if (requestedLanguage && validLanguages.includes(requestedLanguage as Language)) {
      setLanguage(requestedLanguage as Language);
    }
  }, [setLanguage]);

  useEffect(() => {
    let active = true;
    setDocuments([]);
    setDocumentError("");

    if (!vehicleId) {
      setDocumentsLoading(false);
      return () => { active = false; };
    }
    if (authLoading) return () => { active = false; };
    if (!accessToken) {
      setDocumentsLoading(false);
      return () => { active = false; };
    }

    setDocumentsLoading(true);
    vehicleDocumentsApi.list(vehicleId, accessToken)
      .then((result) => {
        if (active) setDocuments(Array.isArray(result) ? result.filter(isVehicleDocument) : []);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isUnauthorizedError(error)) {
          logout();
          return;
        }
        setDocumentError(documentManagementText[language].loadError);
      })
      .finally(() => {
        if (active) setDocumentsLoading(false);
      });

    return () => { active = false; };
  }, [vehicleId, language, accessToken, authLoading, logout]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDocumentError("");
    setDocumentStatus("");
    if (!vehicleId) {
      setDocumentError(documentText.missingVehicle);
      return;
    }
    if (!accessToken) {
      setDocumentError(documentText.missingAuth);
      return;
    }
    if (!selectedFile || !isPdfFile(selectedFile)) {
      setDocumentError(documentText.invalidPdf);
      return;
    }

    setUploading(true);
    try {
      await vehicleDocumentsApi.upload(vehicleId, selectedFile, documentType, accessToken);
      setSelectedFile(null);
      const input = document.getElementById("vehicle-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setDocumentStatus(documentText.uploaded);
      try {
        const refreshed = await vehicleDocumentsApi.list(vehicleId, accessToken);
        setDocuments(Array.isArray(refreshed) ? refreshed.filter(isVehicleDocument) : []);
      } catch {
        setDocumentError(documentText.loadError);
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        logout();
      } else {
        setDocumentError(documentText.uploadError);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: VehicleDocument) => {
    if (!vehicleId || !accessToken) return;
    setDocumentError("");
    let objectUrl: string | null = null;
    try {
      const response = await vehicleDocumentsApi.download(vehicleId, file.id, accessToken);
      if (!response.ok) throw new Error(`Vehicle documents request failed (${response.status})`);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      objectUrl = downloadUrl;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = parseDownloadedFilename(
        response.headers.get("Content-Disposition"),
        file.nome,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (isUnauthorizedError(error)) {
        logout();
      } else {
        setDocumentError(documentText.downloadError);
      }
    }
  };

  const handleOpen = async (file: VehicleDocument) => {
    if (!vehicleId || !accessToken) return;
    const openedWindow = window.open("about:blank", "_blank");
    if (!openedWindow) {
      setDocumentError(documentText.openError);
      return;
    }
    openedWindow.opener = null;
    setDocumentError("");
    let objectUrl: string | null = null;
    try {
      const response = await vehicleDocumentsApi.open(vehicleId, file.id, accessToken);
      if (!response.ok) throw new Error(`Vehicle documents request failed (${response.status})`);
      objectUrl = URL.createObjectURL(await response.blob());
      openedWindow.location.href = objectUrl;
      window.setTimeout(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }, 300000);
    } catch (error) {
      openedWindow.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (isUnauthorizedError(error)) {
        logout();
      } else {
        setDocumentError(documentText.openError);
      }
    }
  };

  const handleRemove = async (file: VehicleDocument) => {
    if (!vehicleId || !accessToken) return;
    setDocumentError("");
    setDocumentStatus("");
    setRemovingId(file.id);
    try {
      await vehicleDocumentsApi.remove(vehicleId, file.id, accessToken);
      setDocuments((current) => current.filter((document) => document.id !== file.id));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        logout();
      } else {
        setDocumentError(documentText.deleteError);
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="order-0 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link to="/veiculo"><ArrowLeft aria-hidden="true" />{content.back}</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden="true" />{content.print}
            </Button>
            {!hasUploadedManual && (
              <>
                <Button asChild variant="outline">
                  <a href={content.manualPdfUrl} target="_blank" rel="noreferrer">
                    <Download aria-hidden="true" />{content.openPdf}
                  </a>
                </Button>
                <Button asChild>
                  <a href={content.manualPdfUrl} download>
                    <Download aria-hidden="true" />{content.downloadPdf}
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>

        <header className="order-1 space-y-2 border-b pb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">Toyota ACE · {content.subtitle}</p>
          <h1 className="text-3xl font-bold">{content.title}</h1>
          {(!hasUploadedDocument || !hasUploadedManual) && (
            <p className="rounded-md border-2 border-red-700 bg-red-50 p-4 font-bold text-red-900 dark:bg-red-950 dark:text-red-100">
              {content.warning}
            </p>
          )}
        </header>

        {!hasUploadedDocument && <Card className="order-3">
          <CardHeader><CardTitle>{content.details}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.fields.map(({ key, label, example }) => (
                <div key={key} className="rounded-md border p-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{vehicle[key]?.trim() || example}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">{content.exampleNote}</p>
          </CardContent>
        </Card>}

        <Card className="order-2 print:hidden">
          <CardHeader>
            <CardTitle>{documentText.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{documentText.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-end">
              <div className="space-y-2">
                <label htmlFor="vehicle-document-type" className="text-sm font-medium">
                  {documentText.typeLabel}
                </label>
                <select
                  id="vehicle-document-type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as VehicleDocumentType)}
                  disabled={!vehicleId || !accessToken || authLoading || uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="manual">{documentText.manual}</option>
                  <option value="documento">{documentText.document}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="vehicle-document-file" className="text-sm font-medium">
                  {documentText.fileLabel}
                </label>
                <input
                  id="vehicle-document-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={!vehicleId || !accessToken || authLoading || uploading}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] || null;
                    setDocumentError("");
                    setDocumentStatus("");
                    if (file && !isPdfFile(file)) {
                      setSelectedFile(null);
                      event.currentTarget.value = "";
                      setDocumentError(documentText.invalidPdf);
                      return;
                    }
                    setSelectedFile(file);
                  }}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1"
                />
              </div>
              <Button type="submit" disabled={!vehicleId || !accessToken || authLoading || !selectedFile || uploading}>
                <Upload aria-hidden="true" />
                {uploading ? documentText.uploading : documentText.upload}
              </Button>
            </form>

            {!vehicleId && (
              <p role="alert" className="text-sm text-destructive">{documentText.missingVehicle}</p>
            )}
            {!authLoading && vehicleId && !accessToken && (
              <div className="flex flex-wrap items-center gap-3" role="alert">
                <p className="text-sm text-destructive">{documentText.missingAuth}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to={signInUrl}>{documentText.signIn}</Link>
                </Button>
              </div>
            )}
            {documentError && <p role="alert" className="text-sm text-destructive">{documentError}</p>}
            {documentStatus && <p role="status" aria-live="polite" className="text-sm text-green-700 dark:text-green-400">{documentStatus}</p>}

            <section aria-labelledby="uploaded-vehicle-files">
              <h2 id="uploaded-vehicle-files" className="mb-3 text-lg font-semibold">
                {documentText.userFiles}
              </h2>
              {documentsLoading ? (
                <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                  {documentText.loading}
                </p>
              ) : documentError === documentText.loadError ? null : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{documentText.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {documents.map((file) => {
                    const filename = safeDocumentFilename(file.nome);
                    const createdAt = new Date(file.dataCriacao);
                    const createdAtLabel = Number.isNaN(createdAt.getTime())
                      ? ""
                      : `${documentText.added}: ${new Intl.DateTimeFormat(language).format(createdAt)}`;
                    return (
                      <li key={String(file.id)} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words font-medium">{filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.tipo === "manual" ? documentText.manual : documentText.document}
                            {" · "}{displayFileSize(file.tamanho, documentText.bytes)}
                            {createdAtLabel && <> · {createdAtLabel}</>}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpen(file)}>
                            {documentText.open}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                            <Download aria-hidden="true" />{documentText.download}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={removingId !== null}
                            onClick={() => handleRemove(file)}
                          >
                            <Trash2 aria-hidden="true" />
                            {removingId === file.id ? documentText.removing : documentText.remove}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </CardContent>
        </Card>

        {!hasUploadedManual && (
        <Card className="order-4">
          <CardHeader>
            <CardTitle>{content.manualTitle}</CardTitle>
            <p className="text-sm font-semibold text-muted-foreground">{documentText.demoFiles}</p>
            <p className="text-sm text-muted-foreground">{content.manualIntro}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-1 text-lg font-semibold">{section.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </CardContent>
        </Card>
        )}

        {!hasUploadedManual && <Card className="order-5 print:hidden">
          <CardHeader><CardTitle>{content.pdfTitle}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={content.manualPdfUrl} target="_blank" rel="noreferrer">{content.openPdf}</a>
            </Button>
            <Button asChild variant="outline">
              <a href={content.manualPdfUrl} download>{content.downloadPdf}</a>
            </Button>
          </CardContent>
        </Card>}
      </div>
    </main>
  );
}
