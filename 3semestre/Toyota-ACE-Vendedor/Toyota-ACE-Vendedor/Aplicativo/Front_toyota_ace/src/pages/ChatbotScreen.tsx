"use client";

import { X, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  type: "bot" | "user";
  text: string;
};

export default function ChatbotScreen() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      text: "Olá! 👋 Bem-vindo ao Toyota ACE. Como posso ajudar você hoje?",
    },
  ]);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatRef.current &&
        !chatRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const textoDigitado = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: textoDigitado,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: textoDigitado,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na resposta do servidor");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.resposta || "Não consegui entender sua pergunta.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Erro ao conectar com o chatbot. Verifique se o Flask está rodando na porta 5000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const sendSuggestion = (text: string) => {
    setInput(text);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-red-700 hover:bg-red-600 transition-all shadow-2xl rounded-full p-4 text-white"
      >
        {open ? (
          <X size={24} />
        ) : (
          <img
            src="/favicon.ico"
            alt="Chat Bot"
            className="w-10 h-10 object-contain scale-125"
          />
        )}
      </button>

      {open && (
        <div
          ref={chatRef}
          className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-red-700 px-5 py-4 flex items-center justify-between border-b border-red-600">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-red-700 font-bold text-lg">
                <img
                  src="/favicon.ico"
                  alt="Chat Bot"
                  className="w-10 h-10 object-contain scale-125"
                />
              </div>

              <div>
                <h1 className="text-white font-bold text-lg">
                  Toyota ACE
                </h1>

                <p className="text-red-100 text-xs">
                  Assistente virtual online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>

              <span className="text-white text-xs">
                Online
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                    message.type === "user"
                      ? "bg-red-700 text-white rounded-br-sm"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-100 border border-zinc-700 px-4 py-3 rounded-2xl rounded-bl-sm text-sm shadow-lg">
                  Digitando...
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-zinc-800 flex flex-wrap gap-2 bg-zinc-900">
            <button
              onClick={() => sendSuggestion("garantia")}
              className="px-3 py-2 bg-zinc-800 hover:bg-red-700 transition rounded-full text-xs text-white border border-zinc-700"
            >
              🛡️ Garantia
            </button>

            <button
              onClick={() => sendSuggestion("financeiro")}
              className="px-3 py-2 bg-zinc-800 hover:bg-red-700 transition rounded-full text-xs text-white border border-zinc-700"
            >
              💰 Financiamento
            </button>

            <button
              onClick={() => sendSuggestion("retirada")}
              className="px-3 py-2 bg-zinc-800 hover:bg-red-700 transition rounded-full text-xs text-white border border-zinc-700"
            >
              📅 Retirada
            </button>
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-red-600"
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition p-3 rounded-2xl text-white shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}