export function getDocumentList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.documentos)) return payload.documentos;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

export function getAccessToken(user) {
  return typeof user?.accessToken === "string" ? user.accessToken.trim() : "";
}

export function partitionDocumentsByType(documents) {
  return getDocumentList(documents).reduce(
    (groups, document) => {
      const type = String(document?.tipo || "").trim().toLowerCase();
      if (type === "manual") {
        groups.manuals.push(document);
      } else {
        groups.documents.push(document);
      }
      return groups;
    },
    { manuals: [], documents: [] },
  );
}

export function getBearerHeaders(accessToken) {
  const token = String(accessToken || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isPdfSelection(asset) {
  if (!asset || (Number.isFinite(asset.size) && asset.size <= 0)) return false;

  const name = String(asset.name || asset.fileName || "").trim();
  const mimeType = String(asset.mimeType || asset.type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const hasPdfExtension = /\.pdf$/i.test(name);
  const hasOtherExtension = /\.[^./\\]+$/.test(name) && !hasPdfExtension;
  const hasPdfMimeType = ["application/pdf", "application/x-pdf"].includes(mimeType);
  const hasGenericMimeType = !mimeType || mimeType === "application/octet-stream";

  return (
    !hasOtherExtension &&
    (hasPdfExtension || hasPdfMimeType) &&
    (hasPdfMimeType || hasGenericMimeType)
  );
}

export function findNextReviewDate(appointments) {
  if (!Array.isArray(appointments)) return null;

  const reviewDates = appointments
    .filter((appointment) => {
      const serviceType = String(
        appointment?.tipoServico ||
          appointment?.tipo ||
          appointment?.servico ||
          "",
      )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return serviceType.includes("revis");
    })
    .map((appointment) => {
      const value = appointment?.data || appointment?.date;
      if (!value) return null;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;

      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    })
    .filter((timestamp) => timestamp !== null);

  if (!reviewDates.length) return null;

  const latestTimestamp = reviewDates.reduce(
    (latest, timestamp) => Math.max(latest, timestamp),
    Number.NEGATIVE_INFINITY,
  );
  const latest = new Date(latestTimestamp);
  const year = latest.getUTCFullYear() + 1;
  const month = latest.getUTCMonth();
  const day = Math.min(
    latest.getUTCDate(),
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
  );

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
