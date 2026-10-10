import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import PageTranslation from "@/components/PageTranslation";

function TranslationFixture() {
  const { setLanguage } = useLanguage();
  const [message, setMessage] = useState("Mensagem inicial");

  return (
    <>
      <button onClick={() => setLanguage("en-US")}>English</button>
      <button onClick={() => setLanguage("es-ES")}>Español</button>
      <button onClick={() => setLanguage("ja-JP")}>日本語</button>
      <button onClick={() => setMessage("Seu carrinho está vazio.")}>Atualizar</button>
      <p>Produtos em destaque</p>
      <p>Olá, Cliente 👋</p>
      <p>{3} de {6} etapas concluídas</p>
      <p>Seu Corolla está na etapa: Linha de produção.</p>
      <p>{message}</p>
      <input placeholder="Seu nome" />
      <img src="/toyota.png" alt="Veículo" />
    </>
  );
}

describe("PageTranslation", () => {
  beforeEach(() => localStorage.clear());

  it("translates rendered content and attributes after language changes and rerenders", async () => {
    render(
      <LanguageProvider>
        <PageTranslation />
        <TranslationFixture />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => {
      expect(screen.getByText("Featured Products")).toBeInTheDocument();
      expect(screen.getByText("Hello, Cliente 👋")).toBeInTheDocument();
      expect(screen.getByText("3 of 6 steps completed")).toBeInTheDocument();
      expect(screen.getByText("Your Corolla is at this stage: Production line.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
      expect(screen.getByAltText("Vehicle")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    await waitFor(() => {
      expect(screen.getByText("Productos destacados")).toBeInTheDocument();
      expect(screen.getByText("Hola, Cliente 👋")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
      expect(screen.getByText("Tu Corolla está en la etapa: Línea de producción.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "日本語" }));
    await waitFor(() => {
      expect(screen.getByText("おすすめ商品")).toBeInTheDocument();
      expect(screen.getByText("こんにちは、Cliente 👋")).toBeInTheDocument();
      expect(screen.getByText("Corollaの現在の段階: 生産ライン。" )).toBeInTheDocument();
      expect(screen.getByAltText("車両")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("氏名を入力")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => {
      expect(screen.getByText("カートは空です。")).toBeInTheDocument();
    });
  });
});