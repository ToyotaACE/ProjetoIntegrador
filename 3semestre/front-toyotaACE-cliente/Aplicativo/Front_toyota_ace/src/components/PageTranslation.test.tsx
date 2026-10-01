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
      <button onClick={() => setMessage("Seu carrinho está vazio.")}>Atualizar</button>
      <p>Produtos em destaque</p>
      <p>Olá, Cliente 👋</p>
      <p>{message}</p>
      <input placeholder="Seu nome" />
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
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    await waitFor(() => {
      expect(screen.getByText("Productos destacados")).toBeInTheDocument();
      expect(screen.getByText("Hola, Cliente 👋")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => {
      expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    });
  });
});