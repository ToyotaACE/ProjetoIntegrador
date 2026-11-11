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
      <p>Acompanhe o progresso das etapas de produção em tempo real</p>
      <p>Progresso Geral</p>
      <p>Seu pedido foi registrado com sucesso.</p>
      <p>Produto em processo de fabricação.</p>
      <p>Qualidade sendo verificada.</p>
      <p>Produto em processo de acabamento.</p>
      <p>Enviado para a concessionária.</p>
      <p>Seu pedido está pronto para ser retirado.</p>
      <p>Você será notificado em todas as atualizações do seu pedido.</p>
      <p>Seu Pedido</p>
      <p>Número do pedido</p>
      <p>Data do Pedido</p>
      <p>Motor 2.0 Flex</p>
      <p>Vermelho</p>
      <p>Automático</p>
      <p>Flex</p>
      <p>{message}</p>
      <input placeholder="Seu nome" />
      <input aria-label="Selecionar concessionária" placeholder="Selecione uma concessionária" />
      <input aria-label="Selecionar veículo" placeholder="Selecione um veículo" />
      <input aria-label="Selecionar serviço" placeholder="Selecione o serviço" />
      <input aria-label="Selecionar horário disponível" placeholder="Selecione um horário" />
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
      expect(screen.getByText("Track production progress in real time")).toBeInTheDocument();
      expect(screen.getByText("Overall progress")).toBeInTheDocument();
      expect(screen.getByText("Your order has been placed successfully.")).toBeInTheDocument();
      expect(screen.getByText("Vehicle is being manufactured.")).toBeInTheDocument();
      expect(screen.getByText("Quality inspection in progress.")).toBeInTheDocument();
      expect(screen.getByText("Vehicle is in the finishing stage.")).toBeInTheDocument();
      expect(screen.getByText("Sent to the dealership.")).toBeInTheDocument();
      expect(screen.getByText("Your vehicle is ready for pickup.")).toBeInTheDocument();
      expect(screen.getByText("You will be notified about all updates to your order.")).toBeInTheDocument();
      expect(screen.getByText("Your order")).toBeInTheDocument();
      expect(screen.getByText("Order number")).toBeInTheDocument();
      expect(screen.getByText("Order date")).toBeInTheDocument();
      expect(screen.getByText("2.0 Flex-fuel engine")).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText("Automatic")).toBeInTheDocument();
      expect(screen.getByText("Flex-fuel")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
      expect(screen.getByLabelText("Select a dealership")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Select a vehicle")).toBeInTheDocument();
      expect(screen.getByLabelText("Select a vehicle")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Select a service")).toBeInTheDocument();
      expect(screen.getByLabelText("Select a service")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Select a time")).toBeInTheDocument();
      expect(screen.getByLabelText("Select an available time")).toBeInTheDocument();
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
      expect(screen.getByLabelText("Seleccionar concesionario")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Selecciona un vehículo")).toBeInTheDocument();
      expect(screen.getByLabelText("Seleccionar vehículo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Selecciona un servicio")).toBeInTheDocument();
      expect(screen.getByLabelText("Seleccionar servicio")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Selecciona un horario")).toBeInTheDocument();
      expect(screen.getByLabelText("Seleccionar horario disponible")).toBeInTheDocument();
      expect(screen.getByText("Tu Corolla está en la etapa: Línea de producción.")).toBeInTheDocument();
      expect(screen.getByText("Sigue el progreso de producción en tiempo real")).toBeInTheDocument();
      expect(screen.getByText("Progreso general")).toBeInTheDocument();
      expect(screen.getByText("Tu pedido se registró correctamente.")).toBeInTheDocument();
      expect(screen.getByText("El vehículo está en proceso de fabricación.")).toBeInTheDocument();
      expect(screen.getByText("Se está verificando la calidad.")).toBeInTheDocument();
      expect(screen.getByText("El vehículo está en la etapa de acabado.")).toBeInTheDocument();
      expect(screen.getByText("Enviado al concesionario.")).toBeInTheDocument();
      expect(screen.getByText("Tu vehículo está listo para recoger.")).toBeInTheDocument();
      expect(screen.getByText("Recibirás notificaciones sobre todas las actualizaciones de tu pedido.")).toBeInTheDocument();
      expect(screen.getByText("Tu pedido")).toBeInTheDocument();
      expect(screen.getByText("Número del pedido")).toBeInTheDocument();
      expect(screen.getByText("Fecha del pedido")).toBeInTheDocument();
      expect(screen.getByText("Motor 2.0 Flex")).toBeInTheDocument();
      expect(screen.getByText("Rojo")).toBeInTheDocument();
      expect(screen.getByText("Automático")).toBeInTheDocument();
      expect(screen.getByText("Flex")).toBeInTheDocument();
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
      expect(screen.getByLabelText("販売店を選択")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("車両を選択")).toBeInTheDocument();
      expect(screen.getByLabelText("車両を選択")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("サービスを選択")).toBeInTheDocument();
      expect(screen.getByLabelText("サービスを選択")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("時間を選択")).toBeInTheDocument();
      expect(screen.getByLabelText("空いている時間を選択")).toBeInTheDocument();
      expect(screen.getByText("生産工程の進捗をリアルタイムで確認できます")).toBeInTheDocument();
      expect(screen.getByText("全体の進捗")).toBeInTheDocument();
      expect(screen.getByText("ご注文が正常に登録されました。")).toBeInTheDocument();
      expect(screen.getByText("車両を製造中です。")).toBeInTheDocument();
      expect(screen.getByText("品質検査中です。")).toBeInTheDocument();
      expect(screen.getByText("車両の仕上げ工程中です。")).toBeInTheDocument();
      expect(screen.getByText("販売店へ輸送中です。")).toBeInTheDocument();
      expect(screen.getByText("お車をお受け取りいただけます。")).toBeInTheDocument();
      expect(screen.getByText("ご注文に関するすべての更新をお知らせします。")).toBeInTheDocument();
      expect(screen.getByText("ご注文")).toBeInTheDocument();
      expect(screen.getByText("注文番号")).toBeInTheDocument();
      expect(screen.getByText("注文日")).toBeInTheDocument();
      expect(screen.getByText("2.0 フレックス燃料エンジン")).toBeInTheDocument();
      expect(screen.getByText("赤")).toBeInTheDocument();
      expect(screen.getByText("オートマチック")).toBeInTheDocument();
      expect(screen.getByText("フレックス燃料")).toBeInTheDocument();
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