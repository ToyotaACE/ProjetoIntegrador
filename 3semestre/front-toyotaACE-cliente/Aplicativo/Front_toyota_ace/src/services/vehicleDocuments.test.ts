import { afterEach, describe, expect, it, vi } from "vitest";
import { vehicleDocumentsApi } from "./vehicleDocuments";

const successfulJsonResponse = () => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json" },
  json: vi.fn().mockResolvedValue([]),
});

describe("vehicleDocumentsApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the selected PDF, type, and bearer token to the vehicle upload route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulJsonResponse());
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["pdf"], "manual.pdf", { type: "application/pdf" });

    await vehicleDocumentsApi.upload(42, file, "manual", "web-access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/veiculos\/42\/documentos$/),
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer web-access-token" },
      }),
    );
    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
    const formData = requestOptions.body as FormData;
    expect(formData.get("arquivo")).toBe(file);
    expect(formData.get("tipo")).toBe("manual");
    expect(requestOptions.headers).not.toHaveProperty("Content-Type");
  });

  it("uses bearer auth and /arquivo for listing, opening, download, and deletion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulJsonResponse());
    vi.stubGlobal("fetch", fetchMock);

    await vehicleDocumentsApi.list(42, "web-access-token");
    await vehicleDocumentsApi.open(42, "doc_7", "web-access-token");
    await vehicleDocumentsApi.download(42, "doc_7", "web-access-token");
    await vehicleDocumentsApi.remove(42, "doc_7", "web-access-token");

    expect(fetchMock.mock.calls.map(([url]) => String(url).replace(/^https?:\/\/[^/]+/, ""))).toEqual([
      "/api/veiculos/42/documentos",
      "/api/veiculos/42/documentos/doc_7/arquivo",
      "/api/veiculos/42/documentos/doc_7/arquivo?download=true",
      "/api/veiculos/42/documentos/doc_7/arquivo",
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect((options as RequestInit).headers).toEqual({
        Authorization: "Bearer web-access-token",
      });
    }
    expect(fetchMock.mock.calls[3][1]).toEqual({
      method: "DELETE",
      headers: { Authorization: "Bearer web-access-token" },
    });
  });

  it("does not send requests without a token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(vehicleDocumentsApi.list(42, "")).rejects.toThrow("access token");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
