import { TrendingUp, Car, Users, Target, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { salesData, vehicles } from "@/lib/mock-data";
import { useAppContext } from "@/contexts/AppContext";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const SALES_BLUE_THRESHOLD = 15000;
const AVERAGE_MONTHLY_SALES = 13300;
const CHART_STEP = 5000;
const LOW_SALES_COLOR = [203, 213, 225];
const HIGH_SALES_COLOR = [30, 64, 175];

const getSalesColor = (sales: number) => {
  const normalizedSales =
    Math.min(Math.max(sales, 0), SALES_BLUE_THRESHOLD) / SALES_BLUE_THRESHOLD;
  const progress = Math.sqrt(normalizedSales);

  const color = LOW_SALES_COLOR.map((channel, index) =>
    Math.round(channel + (HIGH_SALES_COLOR[index] - channel) * progress)
  );

  return `rgb(${color.join(", ")})`;
};

const FeaturedCarousel = () => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => { checkScroll(); }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-reveal-up delay-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">{t("Destaques da loja")}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} disabled={!canScrollLeft} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} disabled={!canScrollRight} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-primary/15 transition-colors disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} onScroll={checkScroll} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
        {vehicles.map((v) => (
          <div key={v.id} className="shrink-0 w-44 rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-all group cursor-pointer">
            <div className="flex h-24 items-center justify-center overflow-hidden bg-muted p-2">
              <img src={v.image} alt={v.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{v.name}</p>
              <p className="text-xs text-primary font-bold tabular-nums">{v.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { userName, selectedBranch, clients, appointments } = useAppContext();
  const { t, dateLocale, language } = useLanguage();
  const numberLocale = { pt: "pt-BR", en: "en-US", es: "es-ES", ja: "ja-JP" }[language];
  const numberFormatter = new Intl.NumberFormat(numberLocale);
  const compactNumberFormatter = new Intl.NumberFormat(numberLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const todayFormat =
    language === "pt"
      ? "d 'de' MMMM, yyyy"
      : language === "es"
        ? "d 'de' MMMM 'de' yyyy"
        : language === "ja"
          ? "yyyy年M月d日"
          : "MMMM d, yyyy";
  const today = format(new Date(), todayFormat, { locale: dateLocale });

  const closedCount = clients.filter((c) => c.status === "fechado").length;
  const conversionRate = clients.length > 0 ? Math.round((closedCount / clients.length) * 100) : 0;
  const todayAppointments = appointments.filter((a) => a.date === "2026-03-21").length;
  const chartMax = Math.max(
    SALES_BLUE_THRESHOLD + CHART_STEP,
    Math.ceil(Math.max(...salesData.map(({ vendas }) => vendas)) / CHART_STEP) * CHART_STEP
  );

  const metrics = [
    { label: "Vendas do mês", value: String(closedCount), icon: TrendingUp, change: t("{count} agendamentos hoje", { count: todayAppointments }) },
    { label: "Veículos disponíveis", value: String(vehicles.length), icon: Car, change: "no catálogo" },
    { label: "Clientes ativos", value: String(clients.length), icon: Users, change: t("{count} leads", { count: clients.filter((c) => c.status === "lead").length }) },
    { label: "Taxa de conversão", value: `${conversionRate}%`, icon: Target, change: t("{closed} fechados de {total}", { closed: closedCount, total: clients.length }) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold animate-reveal-up">
          {t("Bom dia, {name}", { name: userName || t("Vendedor") })}
        </h1>
        <p className="text-sm text-muted-foreground animate-reveal-up delay-1">
          {selectedBranch || "Toyota"} · {today}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={`p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors animate-reveal-up delay-${i + 1}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{t(m.label)}</span>
              <m.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t(m.change)}</p>
          </div>
        ))}
      </div>

      <FeaturedCarousel />

      <div className="rounded-lg border border-border bg-card p-4 animate-reveal-up delay-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium">{t("Vendas Toyota Brasil (estimativa)")}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Unidades vendidas por mês (dados ilustrativos)")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("Até 5.000 vendas")}</span>
            <span
              aria-hidden="true"
              className="h-2.5 w-20 rounded-full"
              style={{
                background: `linear-gradient(90deg, rgb(${LOW_SALES_COLOR.join(", ")}), rgb(${HIGH_SALES_COLOR.join(", ")}))`,
              }}
            />
            <span>{t("15.000+ vendas")}</span>
          </div>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(month) => t(month)} axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, chartMax]}
                ticks={[0, 5000, 10000, 15000, chartMax]}
                tickFormatter={(value) => compactNumberFormatter.format(value)}
                tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
                      <p className="text-xs font-semibold">
                        {t("Mês: {month}", { month: String(label) })}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {numberFormatter.format(Number(payload[0].value))} {t("vendas")}
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={AVERAGE_MONTHLY_SALES}
                stroke="#4f75a2"
                strokeDasharray="4 4"
                label={{
                  value: t("Referência mensal: ~{count} vendas", {
                    count: numberFormatter.format(AVERAGE_MONTHLY_SALES),
                  }),
                  fill: "#0003cb",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Bar
                dataKey="vendas"
                isAnimationActive={false}
                name="Vendas"
                radius={[4, 4, 0, 0]}
              >
                {salesData.map((entry) => (
                  <Cell key={entry.month} fill={getSalesColor(entry.vendas)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
