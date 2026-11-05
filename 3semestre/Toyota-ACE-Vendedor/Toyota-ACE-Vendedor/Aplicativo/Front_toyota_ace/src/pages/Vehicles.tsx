import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { vehicles } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = ["Todos", "SUV", "Sedan", "Hatch", "Picape"] as const;

const Vehicles = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesCategory = category === "Todos" || vehicle.category === category;
      const matchesSearch = `${vehicle.name} ${vehicle.category}`
        .toLocaleLowerCase()
        .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          {t("Catálogo Toyota")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("Encontre o Toyota ideal")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("Explore os modelos disponíveis e inicie uma configuração de pedido para o seu cliente.")}
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("Modelos Toyota")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("{count} modelos disponíveis", { count: filteredVehicles.length })}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("Buscar modelo...")}
                aria-label={t("Buscar modelo...")}
                className="pl-9"
              />
            </div>
            <Button onClick={() => navigate("/pedidos/novo")}>
              {t("Novo pedido")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label={t("Categorias")}>
          {categories.map((item) => (
            <Button
              key={item}
              variant={category === item ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item === "Todos" ? <SlidersHorizontal aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> : null}
              {t(item)}
            </Button>
          ))}
        </div>

        {filteredVehicles.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            {t("Nenhum modelo encontrado.")}
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <article key={vehicle.id} className="group overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-md">
                <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted p-3">
                  <img
                    src={vehicle.image}
                    alt={t(vehicle.name)}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{t(vehicle.name)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {vehicle.year} · {t(vehicle.category)}
                      </p>
                    </div>
                    <Badge variant="secondary">{t("Disponível")}</Badge>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("A partir de")}</p>
                      <p className="text-lg font-semibold">{vehicle.price}</p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/pedidos/novo?modelo=${vehicle.id}`}>
                        {t("Configurar")} <ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Vehicles;
