import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import PageTranslation from "@/components/PageTranslation";

function TranslationFixture() {
  const { setLanguage } = useLanguage();
  const [message, setMessage] = useState("Mensagem inicial");

  return (
    <>
      <button onClick={() => setLanguage("pt-BR")}>Português</button>
      <button onClick={() => setLanguage("en-US")}>English</button>
      <button onClick={() => setLanguage("es-ES")}>Español</button>
      <button onClick={() => setLanguage("ja-JP")}>日本語</button>
      <button onClick={() => setMessage("Seu carrinho está vazio.")}>Atualizar</button>
      <p>Produtos em destaque</p>
      <p>Modelos</p>
      <p>Toyota do Brasil — Todos os direitos reservados</p>
      <p>Assistente virtual online</p>
      <p>Digitando...</p>
      <p>Não consegui entender sua pergunta.</p>
      <p>Erro ao conectar com o chatbot. Verifique se o Flask está rodando na porta 5000.</p>
      <p>Olá, Cliente 👋</p>
      <p>{3} de {6} etapas concluídas</p>
      <p>Seu Corolla está na etapa: Linha de produção.</p>
      <p>{message}</p>
      <input placeholder="Seu nome" />
      <img src="/toyota.png" alt="Veículo" />
      <img src="/toyota-logo.png" alt="Toyota Logo" />
      <button aria-label="Go to previous page">Previous</button>
      <span>More pages</span>
      <button aria-label="Close">Close</button>
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
      expect(screen.getByText("Models")).toBeInTheDocument();
      expect(screen.getByText("Toyota Brazil — All rights reserved")).toBeInTheDocument();
      expect(screen.getByText("Virtual assistant online")).toBeInTheDocument();
      expect(screen.getByText("Typing...")).toBeInTheDocument();
      expect(screen.getByText("I couldn't understand your question.")).toBeInTheDocument();
      expect(screen.getByText("Could not connect to the chatbot. Check that Flask is running on port 5000.")).toBeInTheDocument();
      expect(screen.getByText("Hello, Cliente 👋")).toBeInTheDocument();
      expect(screen.getByText("3 of 6 steps completed")).toBeInTheDocument();
      expect(screen.getByText("Your Corolla is at this stage: Production line.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
      expect(screen.getByAltText("Vehicle")).toBeInTheDocument();
      expect(screen.getByAltText("Toyota logo")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Go to previous page" })).toBeInTheDocument();
      expect(screen.getByText("More pages")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    await waitFor(() => {
      expect(screen.getByText("Productos destacados")).toBeInTheDocument();
      expect(screen.getByText("Modelos")).toBeInTheDocument();
      expect(screen.getByText("Toyota Brasil — Todos los derechos reservados")).toBeInTheDocument();
      expect(screen.getByText("Asistente virtual en línea")).toBeInTheDocument();
      expect(screen.getByText("Escribiendo...")).toBeInTheDocument();
      expect(screen.getByText("No pude entender tu pregunta.")).toBeInTheDocument();
      expect(screen.getByText("No se pudo conectar con el chatbot. Comprueba que Flask esté ejecutándose en el puerto 5000.")).toBeInTheDocument();
      expect(screen.getByText("Hola, Cliente 👋")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
      expect(screen.getByText("Tu Corolla está en la etapa: Línea de producción.")).toBeInTheDocument();
      expect(screen.getByAltText("Logotipo de Toyota")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ir a la página anterior" })).toBeInTheDocument();
      expect(screen.getByText("Más páginas")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "日本語" }));
    await waitFor(() => {
      expect(screen.getByText("おすすめ商品")).toBeInTheDocument();
      expect(screen.getByText("車種")).toBeInTheDocument();
      expect(screen.getByText("トヨタ・ブラジル — 無断転載を禁じます")).toBeInTheDocument();
      expect(screen.getByText("オンラインアシスタント")).toBeInTheDocument();
      expect(screen.getByText("入力中...")).toBeInTheDocument();
      expect(screen.getByText("ご質問を理解できませんでした。")).toBeInTheDocument();
      expect(screen.getByText("アシスタントに接続できません。Flaskがポート5000で起動しているか確認してください。")).toBeInTheDocument();
      expect(screen.getByText("こんにちは、Cliente 👋")).toBeInTheDocument();
      expect(screen.getByText("Corollaの現在の段階: 生産ライン。" )).toBeInTheDocument();
      expect(screen.getByAltText("車両")).toBeInTheDocument();
      expect(screen.getByAltText("トヨタのロゴ")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "前のページへ" })).toBeInTheDocument();
      expect(screen.getByText("他のページ")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "閉じる" })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("氏名を入力")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => {
      expect(screen.getByText("カートは空です。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Português" }));
    await waitFor(() => {
      expect(screen.getByText("Produtos em destaque")).toBeInTheDocument();
      expect(screen.getByText("Modelos")).toBeInTheDocument();
      expect(screen.getByText("Toyota do Brasil — Todos os direitos reservados")).toBeInTheDocument();
      expect(screen.getByText("Assistente virtual online")).toBeInTheDocument();
      expect(screen.getByText("Digitando...")).toBeInTheDocument();
      expect(screen.getByText("Não consegui entender sua pergunta.")).toBeInTheDocument();
      expect(screen.getByAltText("Logo Toyota")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ir para a página anterior" })).toBeInTheDocument();
      expect(screen.getByText("Mais páginas")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    });
  });
});