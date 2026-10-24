export type DocumentationVehicle = {
  marcaVeiculo?: string;
  modeloVeiculo?: string;
  anoVeiculo?: string;
  corVeiculo?: string;
  motorVeiculo?: string;
  cambioVeiculo?: string;
  combustivelVeiculo?: string;
};

export function parseDocumentationVehicle(search: string): DocumentationVehicle {
  const serializedVehicle = new URLSearchParams(search).get("vehicle");
  if (!serializedVehicle) return {};

  try {
    const parsed: unknown = JSON.parse(serializedVehicle);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const source = parsed as Record<string, unknown>;
    const keys: (keyof DocumentationVehicle)[] = [
      "marcaVeiculo",
      "modeloVeiculo",
      "anoVeiculo",
      "corVeiculo",
      "motorVeiculo",
      "cambioVeiculo",
      "combustivelVeiculo",
    ];
    return Object.fromEntries(
      keys.map((key) => [
        key,
        typeof source[key] === "string" ? source[key].slice(0, 100) : undefined,
      ]),
    ) as DocumentationVehicle;
  } catch {
    return {};
  }
}

export function parseDocumentationVehicleId(search: string): number | null {
  const value = new URLSearchParams(search).get("vehicleId");
  if (!value || !/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export type VehicleDocumentType = "manual" | "documento";

export type VehicleDocument = {
  id: number | string;
  nome: string;
  tipo: VehicleDocumentType;
  tamanho: number;
  dataCriacao: string;
};

function safeResourceId(value: number | string): string {
  const id = String(value);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("Invalid document identifier");
  }
  return id;
}

export function getVehicleDocumentsPath(vehicleId: number): string {
  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
    throw new Error("Invalid vehicle identifier");
  }
  return `/veiculos/${vehicleId}/documentos`;
}

export function getVehicleDocumentFilePath(
  vehicleId: number,
  documentId: number | string,
): string {
  return `${getVehicleDocumentPath(vehicleId, documentId)}/arquivo`;
}

export function getVehicleDocumentPath(
  vehicleId: number,
  documentId: number | string,
): string {
  return `${getVehicleDocumentsPath(vehicleId)}/${safeResourceId(documentId)}`;
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" ||
    (!file.type && file.name.toLowerCase().endsWith(".pdf"));
}

export function safeDocumentFilename(name: string): string {
  const lastSegment = name.split(/[\\/]/).pop() || "";
  const safeName = lastSegment
    .replace(/[<>:"|?*]/g, "")
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, 150);
  const baseName = safeName.replace(/\.pdf$/i, "").trim() || "documento";
  return `${baseName}.pdf`;
}
