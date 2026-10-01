import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Veiculo } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Percent,
  Calendar,
  CreditCard,
  ShieldCheck,
  Car,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

const fmt = (v?: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getMesPagoKey = (veiculoId?: number) =>
  `toyota_ultimo_mes_pago_${veiculoId}`;

const FinancingPage = () => {
  const { user } = useAuth();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [ultimoMesPago, setUltimoMesPago] = useState("Janeiro");

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("cartao");
  const [nomeCartao, setNomeCartao] = useState("");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    async function carregarFinanciamento() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro("");

        const resposta = await api.listarVeiculosCliente(user.id);
        setVeiculos(resposta);

        if (resposta.length > 0) {
          const primeiro = resposta[0];
          setSelectedVehicleId(primeiro.id || null);

          const mesSalvo = localStorage.getItem(getMesPagoKey(primeiro.id));
          setUltimoMesPago(mesSalvo || "Janeiro");
        }
      } catch (err) {
        setErro(
          err instanceof Error
            ? err.message
            : "Erro ao carregar financiamento."
        );
      } finally {
        setLoading(false);
      }
    }

    carregarFinanciamento();
  }, [user?.id]);

  const veiculoSelecionado = useMemo(() => {
    return (
      veiculos.find((veiculo) => veiculo.id === selectedVehicleId) ||
      veiculos[0] ||
      null
    );
  }, [veiculos, selectedVehicleId]);

  useEffect(() => {
    if (veiculoSelecionado?.id) {
      const mesSalvo = localStorage.getItem(
        getMesPagoKey(veiculoSelecionado.id)
      );

      setUltimoMesPago(mesSalvo || "Janeiro");
    }
  }, [veiculoSelecionado?.id]);

  const valorTotal = veiculoSelecionado?.valorTotal ?? 0;
  const entrada = veiculoSelecionado?.valorEntrada ?? 0;
  const parcelasTotais = veiculoSelecionado?.parcelasTotais ?? 0;
  const parcelasPagas = veiculoSelecionado?.parcelasPagas ?? 0;
  const parcelasRestantes = veiculoSelecionado?.parcelasRestantes ?? 0;
  const valorParcela = veiculoSelecionado?.valorParcela ?? 0;
  const taxa = veiculoSelecionado?.taxaJuros ?? 0;

  const valorFinanciado =
    veiculoSelecionado?.valorFinanciado ?? Math.max(valorTotal - entrada, 0);

  const valorPendente =
    parcelasRestantes > 0 && valorParcela > 0
      ? parcelasRestantes * valorParcela
      : valorFinanciado;

  const avancarMes = () => {
    const indexAtual = meses.indexOf(ultimoMesPago);
    const proximoIndex = indexAtual >= 0 ? (indexAtual + 1) % meses.length : 1;
    return meses[proximoIndex];
  };

  const pagarParcela = async () => {
    if (!veiculoSelecionado?.id) {
      toast.error("Selecione um veículo.");
      return;
    }

    if (parcelasRestantes <= 0) {
      toast.success("Financiamento já quitado!");
      return;
    }

    try {
      setPagando(true);

      const novasParcelasPagas = parcelasPagas + 1;
      const novasParcelasRestantes = Math.max(parcelasRestantes - 1, 0);
      const novoValorFinanciado = Math.max(valorFinanciado - valorParcela, 0);
      const novoMes = avancarMes();

      const atualizado = await api.atualizarVeiculo(veiculoSelecionado.id, {
        parcelasPagas: novasParcelasPagas,
        parcelasRestantes: novasParcelasRestantes,
        valorFinanciado: novoValorFinanciado,
        statusFinanciamento:
          novasParcelasRestantes === 0 ? "QUITADO" : "ATIVO",
      });

      setVeiculos((prev) =>
        prev.map((v) => (v.id === atualizado.id ? atualizado : v))
      );

      localStorage.setItem(getMesPagoKey(veiculoSelecionado.id), novoMes);
      setUltimoMesPago(novoMes);

      toast.success("Parcela paga com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao pagar parcela."
      );
    } finally {
      setPagando(false);
    }
  };

  const confirmarPagamento = async () => {
    if (!formaPagamento) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }

    if (formaPagamento === "cartao") {
      if (!nomeCartao || !numeroCartao || !validade || !cvv || !cpf) {
        toast.error("Preencha todos os dados do cartão.");
        return;
      }
    }

    if (formaPagamento === "pix" && !cpf) {
      toast.error("Informe o CPF para gerar o PIX.");
      return;
    }

    await pagarParcela();

    setModalPagamentoAberto(false);
    setNomeCartao("");
    setNumeroCartao("");
    setValidade("");
    setCvv("");
    setCpf("");
    setFormaPagamento("cartao");
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando financiamento...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Financiamento
            </h1>

            <p className="text-gray-500 mt-2">
              Veja e simule o pagamento das parcelas por veículo.
            </p>

            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
          </div>

          {veiculos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nenhum veículo com financiamento encontrado.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative">
                {veiculos.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        document.getElementById("finance-carousel")?.scrollBy({
                          left: -340,
                          behavior: "smooth",
                        });
                      }}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20"
                    >
                      ‹
                    </button>

                    <button
                      onClick={() => {
                        document.getElementById("finance-carousel")?.scrollBy({
                          left: 340,
                          behavior: "smooth",
                        });
                      }}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20"
                    >
                      ›
                    </button>
                  </>
                )}

                <div
                  id="finance-carousel"
                  className="flex gap-4 overflow-x-hidden scroll-smooth snap-x snap-mandatory px-16"
                >
                  {veiculos.map((veiculo) => {
                    const active = veiculo.id === veiculoSelecionado?.id;

                    return (
                      <button
                        key={veiculo.id}
                        onClick={() => setSelectedVehicleId(veiculo.id || null)}
                        className={`min-w-[220px] max-w-[220px] flex-shrink-0 snap-start text-left rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all ${
                          active
                            ? "border-red-600 ring-2 ring-zinc-400/30"
                            : "border-border hover:border-zinc-400"
                        }`}
                      >
                        {veiculo.fotoCarroUrl ? (
                          <img
                            src={veiculo.fotoCarroUrl}
                            alt={veiculo.modeloVeiculo || "Veículo"}
                            className="w-full h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full h-36 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Car className="h-10 w-10 text-gray-400" />
                          </div>
                        )}

                        <div className="p-4">
                          <p className="font-semibold">
                            {veiculo.modeloVeiculo || "Veículo Toyota"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {veiculo.anoVeiculo || "Ano não informado"} ·{" "}
                            {veiculo.corVeiculo || "Cor não informada"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                <FinanceCard
                  icon={<DollarSign className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Valor Total"
                  value={fmt(valorTotal)}
                  subtitle={
                    veiculoSelecionado?.modeloVeiculo || "Veículo Toyota"
                  }
                />

                <FinanceCard
                  icon={<CreditCard className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Entrada"
                  value={fmt(entrada)}
                  subtitle={
                    valorTotal
                      ? `${((entrada / valorTotal) * 100).toFixed(0)}% do valor`
                      : "Não informado"
                  }
                />

                <FinanceCard
                  icon={<Calendar className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Parcelas"
                  value={
                    parcelasTotais
                      ? `${parcelasTotais}x de ${fmt(valorParcela)}`
                      : "Não informado"
                  }
                  subtitle={`${parcelasPagas} pagas · ${parcelasRestantes} restantes`}
                />

                <FinanceCard
                  icon={<Wallet className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Valor Pendente"
                  value={fmt(valorPendente)}
                  subtitle={`Último mês pago: ${ultimoMesPago}`}
                />

                <FinanceCard
                  icon={<Percent className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Taxa de Juros"
                  value={taxa ? `${taxa}% a.m.` : "Não informado"}
                  subtitle={taxa ? `${(taxa * 12).toFixed(2)}% ao ano` : ""}
                />

                <FinanceCard
                  icon={<ShieldCheck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
                  title="Garantia"
                  value={veiculoSelecionado?.statusGarantia || "Não informado"}
                  subtitle={`Financiamento: ${
                    veiculoSelecionado?.statusFinanciamento || "Não informado"
                  }`}
                />
              </div>

              <Card className="bg-white dark:bg-red-600 border shadow-sm">
                <CardHeader>
                  <CardTitle>Pagamento simulado</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Próxima parcela</p>

                    <p className="text-2xl font-bold">{fmt(valorParcela)}</p>

                    <p className="text-sm text-gray-500">
                      Escolha a forma de pagamento e confirme para dar baixa na
                      parcela.
                    </p>
                  </div>

                  <Button
                    onClick={() => setModalPagamentoAberto(true)}
                    disabled={pagando || parcelasRestantes <= 0}
                    className="bg-red-600 hover:bg-zinc-800 text-white"
                  >
                    {parcelasRestantes <= 0
                      ? "Financiamento quitado"
                      : "Pagar parcela"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {modalPagamentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Pagamento da parcela</h2>

            <p className="text-sm text-gray-500 mb-4">
              Valor da parcela:{" "}
              <span className="font-semibold text-black dark:text-white">
                {fmt(valorParcela)}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Forma de pagamento
                </label>

                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                >
                  <option value="cartao">Cartão de crédito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              {formaPagamento === "cartao" && (
                <>
                  <input
                    placeholder="Nome impresso no cartão"
                    value={nomeCartao}
                    onChange={(e) => setNomeCartao(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />

                  <input
                    placeholder="Número do cartão"
                    value={numeroCartao}
                    onChange={(e) => setNumeroCartao(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Validade"
                      value={validade}
                      onChange={(e) => setValidade(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2"
                    />

                    <input
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2"
                    />
                  </div>

                  <input
                    placeholder="CPF do titular"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </>
              )}

              {formaPagamento === "pix" && (
                <input
                  placeholder="CPF para gerar PIX"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              )}

              {formaPagamento === "boleto" && (
                <p className="text-sm text-gray-500 bg-gray-100 dark:bg-zinc-800 p-3 rounded-md">
                  O boleto será gerado após confirmar o pagamento.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setModalPagamentoAberto(false)}
                  disabled={pagando}
                >
                  Cancelar
                </Button>

                <Button
                  onClick={confirmarPagamento}
                  disabled={pagando}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  {pagando ? "Processando..." : "Confirmar pagamento"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function FinanceCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {icon}
        </div>

        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold">{value}</p>

        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default FinancingPage;