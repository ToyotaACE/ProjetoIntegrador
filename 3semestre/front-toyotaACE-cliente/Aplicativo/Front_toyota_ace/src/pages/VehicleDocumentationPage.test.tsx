import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import VehicleDocumentationPage from "./VehicleDocumentationPage";
import { format } from "date-fns";
import { afterEach, vi } from "vitest";
import { getNextReviewDate } from "@/lib/vehicleMaintenance";
import {
  getVehicleDocumentFilePath,
  getVehicleDocumentsPath,
  isPdfFile,
  parseDocumentationVehicle,
  parseDocumentationVehicleId,
  safeDocumentFilename,
} from "@/lib/vehicleDocumentation";

describe("VehicleDocumentationPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/documentacao");
  });

  it("parses vehicle values from the new-tab query and safely handles malformed input", () => {
    const vehicle = { modeloVeiculo: "Corolla", anoVeiculo: "2024" };
    const search = new URLSearchParams({ vehicle: JSON.stringify(vehicle) }).toString();

    expect(parseDocumentationVehicle(`?${search}`)).toEqual(vehicle);
    expect(parseDocumentationVehicle("?vehicle=invalid-json")).toEqual({});
    expect(parseDocumentationVehicle("")).toEqual({});
  });

  it("reads only a positive, safe vehicle ID from the documentation query", () => {
    expect(parseDocumentationVehicleId("?vehicleId=42")).toBe(42);
    expect(parseDocumentationVehicleId("?vehicleId=-1")).toBeNull();
    expect(parseDocumentationVehicleId("?vehicleId=1%2F2")).toBeNull();
    expect(parseDocumentationVehicleId("?vehicleId=9007199254740992")).toBeNull();
  });

  it("builds scoped document API paths and accepts PDF files only", () => {
    expect(getVehicleDocumentsPath(42)).toBe("/veiculos/42/documentos");
    expect(getVehicleDocumentFilePath(42, "doc_7")).toBe(
      "/veiculos/42/documentos/doc_7/arquivo",
    );
    expect(() => getVehicleDocumentFilePath(42, "../other")).toThrow();
    expect(safeDocumentFilename("../../manual\r\n.pdf")).toBe("manual.pdf");
    expect(isPdfFile(new File(["pdf"], "manual.pdf", { type: "application/pdf" }))).toBe(true);
    expect(isPdfFile(new File(["text"], "manual.txt", { type: "text/plain" }))).toBe(false);
  });

  it("recommends one year after the most recent saved review appointment", () => {
    const recommendation = getNextReviewDate([
      { data: "2024-06-10", tipoServico: "Revisão" },
      { data: "2025-02-05", tipoServicio: "AGENDAMENTO DE REVISA\u0303O" },
      { data: "2025-12-01", tipoServico: "Retirada" },
      { data: "not-a-date", tipoServico: "Revisão" },
    ]);

    expect(recommendation).not.toBeNull();
    expect(format(recommendation!, "yyyy-MM-dd")).toBe("2026-02-05");
    expect(getNextReviewDate([{ data: "2025-01-01", tipoServico: "Retirada" }])).toBeNull();
  });

  it("loads appointments through the authenticated client's appointment route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.buscarAgendamentosCliente(42);

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/agendamentos\/cliente\/42$/);
  });

  it("passes the login bearer token from AuthContext to the document listing request", async () => {
    localStorage.setItem("toyota-auth", JSON.stringify({
      id: 42,
      nome: "Driver",
      email: "driver@example.com",
      accessToken: "saved-access-token",
    }));
    window.history.replaceState({}, "", "/documentacao?vehicleId=42");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    await waitFor(() => {
      const documentRequest = fetchMock.mock.calls.find(([url]) =>
        String(url).endsWith("/veiculos/42/documentos"),
      );
      expect(documentRequest).toBeDefined();
      expect((documentRequest?.[1] as RequestInit).headers).toEqual({
        Authorization: "Bearer saved-access-token",
      });
    });
  });

  it("shows explicit demo disclaimers, selected vehicle data, examples, and PDF actions", () => {
    const query = new URLSearchParams({
      vehicle: JSON.stringify({ modeloVeiculo: "Corolla", anoVeiculo: "2024" }),
      lang: "pt-BR",
    });
    window.history.replaceState({}, "", `/documentacao?${query}`);

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: "Documentação do veículo" })).toBeInTheDocument();
    expect(screen.getByText("MODELO DE DEMONSTRAÇÃO")).toBeInTheDocument();
    expect(screen.queryByText(/Este material foi criado apenas para demonstrar/)).not.toBeInTheDocument();
    expect(screen.getByText("Corolla")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("Toyota ACE (exemplo)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manual fictício de demonstração" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Abrir PDF" })[0]).toHaveAttribute(
      "href",
      "/assets/manual-demonstracao-toyota-ace.pdf",
    );
    expect(screen.getAllByRole("link", { name: "Baixar PDF" })[0]).toHaveAttribute("download");
  });

  it("offers a sign-in action for legacy sessions without an access token", async () => {
    localStorage.setItem("toyota-auth", JSON.stringify({
      id: 42,
      nome: "Driver",
      email: "driver@example.com",
    }));
    window.history.replaceState({}, "", "/documentacao?vehicleId=42");

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(await screen.findByText(/Sua sessão não está autenticada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar novamente" })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?returnTo="),
    );
  });

  it("clears an expired document session and offers sign-in again", async () => {
    localStorage.setItem("toyota-auth", JSON.stringify({
      id: 42,
      nome: "Driver",
      email: "driver@example.com",
      accessToken: "expired-access-token",
    }));
    window.history.replaceState({}, "", "/documentacao?vehicleId=42");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
    }));

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(await screen.findByRole("link", { name: "Entrar novamente" })).toBeInTheDocument();
    expect(localStorage.getItem("toyota-auth")).toBeNull();
  });

  it("replaces demo document and manual content with uploaded PDFs of the same type", async () => {
    localStorage.setItem("toyota-auth", JSON.stringify({
      id: 42,
      nome: "Driver",
      email: "driver@example.com",
      accessToken: "saved-access-token",
    }));
    window.history.replaceState({}, "", "/documentacao?vehicleId=42");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: vi.fn().mockResolvedValue([
        { id: 1, nome: "documento-real.pdf", tipo: "documento", tamanho: 1024, dataCriacao: "2025-01-01" },
        { id: 2, nome: "manual-real.pdf", tipo: "manual", tamanho: 2048, dataCriacao: "2025-01-02" },
      ]),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(await screen.findByText("documento-real.pdf")).toBeInTheDocument();
    expect(screen.getByText("manual-real.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dados de referência" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Manual fictício de demonstração" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abrir PDF" })).not.toBeInTheDocument();
    expect(screen.queryByText("MODELO DE DEMONSTRAÇÃO")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seus arquivos" })).toBeInTheDocument();
  });

  it.each([
    ["en-US", "Vehicle documentation", "DEMONSTRATION SAMPLE", "/assets/manual-demonstracao-toyota-ace.en-US.pdf"],
    ["es-ES", "Documentación del vehículo", "MODELO DE DEMOSTRACIÓN", "/assets/manual-demonstracao-toyota-ace.es-ES.pdf"],
    ["ja-JP", "車両の資料", "デモ用サンプル", "/assets/manual-demonstracao-toyota-ace.ja-JP.pdf"],
  ])("uses %s copy for the documentation screen", (language, title, warning, pdfUrl) => {
    localStorage.setItem("a11y-language", JSON.stringify(language));

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(warning))).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /PDF/ })[0]).toHaveAttribute("href", pdfUrl);
    expect(screen.getAllByRole("link", { name: /PDF/ })[1]).toHaveAttribute("href", pdfUrl);
  });

  it.each([
    ["pt-BR", "Seus arquivos", "Enviar PDF"],
    ["en-US", "Your files", "Upload PDF"],
    ["es-ES", "Tus archivos", "Subir PDF"],
    ["ja-JP", "登録したファイル", "PDF をアップロード"],
  ])("translates uploaded-file controls for %s", (language, title, upload) => {
    localStorage.setItem("a11y-language", JSON.stringify(language));

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(upload) })).toBeDisabled();
  });

  it("uses the language requested in the new-tab URL when selecting the PDF", async () => {
    localStorage.setItem("a11y-language", JSON.stringify("en-US"));
    window.history.replaceState({}, "", "/documentacao?lang=ja-JP");

    render(
      <AuthProvider>
        <LanguageProvider>
          <MemoryRouter>
            <VehicleDocumentationPage />
          </MemoryRouter>
        </LanguageProvider>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "車両の資料" })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /PDF/ })[0]).toHaveAttribute(
        "href",
        "/assets/manual-demonstracao-toyota-ace.ja-JP.pdf",
      );
    });
  });
});
