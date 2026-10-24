import { API_URL } from "@/services/api";
import {
  getVehicleDocumentFilePath,
  getVehicleDocumentsPath,
  type VehicleDocument,
  type VehicleDocumentType,
} from "@/lib/vehicleDocumentation";

function apiUrl(path: string) {
  return `${API_URL.replace(/\/$/, "")}${path}`;
}

function authHeaders(accessToken: string): HeadersInit {
  if (!accessToken.trim()) throw new Error("An access token is required");
  return { Authorization: `Bearer ${accessToken}` };
}

async function request<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(`Vehicle documents request failed (${response.status})`);
  }
  if (response.status === 204) return null as T;
  if (response.headers.get("content-type")?.includes("application/json")) {
    return response.json();
  }
  return null as T;
}

export const vehicleDocumentsApi = {
  list: (vehicleId: number, accessToken: string) =>
    request<VehicleDocument[]>(getVehicleDocumentsPath(vehicleId), accessToken),

  upload: (
    vehicleId: number,
    file: File,
    type: VehicleDocumentType,
    accessToken: string,
  ) => {
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("tipo", type);
    return request<VehicleDocument>(
      getVehicleDocumentsPath(vehicleId),
      accessToken,
      { method: "POST", body: formData },
    );
  },

  remove: (vehicleId: number, documentId: number | string, accessToken: string) =>
    request<void>(getVehicleDocumentFilePath(vehicleId, documentId), accessToken, {
      method: "DELETE",
    }),

  open: (vehicleId: number, documentId: number | string, accessToken: string) =>
    fetch(apiUrl(getVehicleDocumentFilePath(vehicleId, documentId)), {
      headers: authHeaders(accessToken),
    }),

  download: (vehicleId: number, documentId: number | string, accessToken: string) =>
    fetch(`${apiUrl(getVehicleDocumentFilePath(vehicleId, documentId))}?download=true`, {
      headers: authHeaders(accessToken),
    }),
};
