import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ImagePlus, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { vehicles } from "@/lib/mock-data";
import { api, type CatalogoVeiculo, type CatalogoVeiculoRequest } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const categories = ["Todos", "SUV", "Sedan", "Hatch", "Picape"] as const;
const catalogCategories = categories.filter((category) => category !== "Todos");

type VersionForm = { nome: string; motor: string; preco: string };
type ColorForm = { nome: string; hexadecimal: string };
type OptionalForm = { nome: string; preco: string };

type VehicleCardData = {
  id: number | string;
  name: string;
  category: string;
  price: string;
  year: number;
  image: string;
};

const newVersion = (): VersionForm => ({ nome: "", motor: "", preco: "" });
const newColor = (): ColorForm => ({ nome: "", hexadecimal: "#FFFFFF" });
const newOptional = (): OptionalForm => ({ nome: "", preco: "0" });

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

function CatalogVehicleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (vehicle: CatalogoVeiculo) => void;
}) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [modelo, setModelo] = useState("");
  const [categoria, setCategoria] = useState<(typeof catalogCategories)[number]>("SUV");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [precoBase, setPrecoBase] = useState("");
  const [motor, setMotor] = useState("");
  const [combustivel, setCombustivel] = useState("");
  const [cambio, setCambio] = useState("");
  const [fotoCarroUrl, setFotoCarroUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [versoes, setVersoes] = useState<VersionForm[]>([newVersion()]);
  const [cores, setCores] = useState<ColorForm[]>([newColor()]);
  const [opcionais, setOpcionais] = useState<OptionalForm[]>([]);

  const reset = () => {
    setModelo("");
    setCategoria("SUV");
    setAno(String(new Date().getFullYear()));
    setPrecoBase("");
    setMotor("");
    setCombustivel("");
    setCambio("");
    setFotoCarroUrl("");
    setPhotoName("");
    setVersoes([newVersion()]);
    setCores([newColor()]);
    setOpcionais([]);
  };

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error(t("Use uma imagem PNG, JPEG ou WebP."));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error(t("A imagem deve ter no máximo 3 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFotoCarroUrl(reader.result);
        setPhotoName(file.name);
      } else {
        toast.error(t("Não foi possível ler a imagem selecionada."));
      }
    };
    reader.onerror = () => toast.error(t("Não foi possível ler a imagem selecionada."));
    reader.readAsDataURL(file);
  };

  const updateVersion = (index: number, field: keyof VersionForm, value: string) => {
    setVersoes((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
  };

  const updateColor = (index: number, field: keyof ColorForm, value: string) => {
    setCores((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
  };

  const updateOptional = (index: number, field: keyof OptionalForm, value: string) => {
    setOpcionais((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CatalogoVeiculoRequest = {
      modelo: modelo.trim(),
      categoria,
      ano: Number(ano),
      precoBase: Number(precoBase),
      motor: motor.trim(),
      combustivel: combustivel.trim(),
      cambio: cambio.trim(),
      fotoCarroUrl,
      versoes: versoes.map((version) => ({
        nome: version.nome.trim(),
        motor: version.motor.trim(),
        preco: Number(version.preco),
      })),
      cores: cores.map((color) => ({
        nome: color.nome.trim(),
        hexadecimal: color.hexadecimal.trim(),
      })),
      opcionais: opcionais.map((option) => ({
        nome: option.nome.trim(),
        preco: Number(option.preco),
      })),
    };

    if (!fotoCarroUrl) {
      toast.error(t("Selecione a foto do veículo."));
      return;
    }
    if (versoes.some((version) => !version.nome.trim() || !version.motor.trim() || Number(version.preco) <= 0)) {
      toast.error(t("Preencha nome, motorização e preço para cada versão."));
      return;
    }
    if (cores.some((color) => !color.nome.trim() || !/^#[0-9a-fA-F]{6}$/.test(color.hexadecimal))) {
      toast.error(t("Preencha o nome e a cor no formato #RRGGBB."));
      return;
    }
    if (opcionais.some((option) => !option.nome.trim() || Number(option.preco) < 0)) {
      toast.error(t("Preencha nome e preço válido para cada opcional."));
      return;
    }

    setSaving(true);
    try {
      const created = await api.cadastrarCatalogoVeiculo(payload);
      onCreated(created);
      reset();
      onOpenChange(false);
      toast.success(t("Veículo adicionado ao catálogo."));
    } catch (error) {
      console.error("Erro ao cadastrar veículo no catálogo:", error);
      toast.error(error instanceof Error ? error.message : t("Não foi possível cadastrar o veículo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saving) onOpenChange(false);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Adicionar veículo ao catálogo")}</DialogTitle>
          <DialogDescription>
            {t("Cadastre os dados do modelo, versões, cores, opcionais e uma foto.")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={submit}>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="catalog-model">{t("Modelo")}</Label>
              <Input id="catalog-model" value={modelo} onChange={(event) => setModelo(event.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label>{t("Categoria")}</Label>
              <Select value={categoria} onValueChange={(value) => setCategoria(value as (typeof catalogCategories)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {catalogCategories.map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-year">{t("Ano")}</Label>
              <Input id="catalog-year" type="number" min="1900" max="2100" value={ano} onChange={(event) => setAno(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-base-price">{t("Preço base (R$)")}</Label>
              <Input id="catalog-base-price" type="number" min="0.01" step="0.01" value={precoBase} onChange={(event) => setPrecoBase(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-engine">{t("Motor")}</Label>
              <Input id="catalog-engine" value={motor} onChange={(event) => setMotor(event.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-fuel">{t("Combustível")}</Label>
              <Input id="catalog-fuel" value={combustivel} onChange={(event) => setCombustivel(event.target.value)} maxLength={50} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-transmission">{t("Câmbio")}</Label>
              <Input id="catalog-transmission" value={cambio} onChange={(event) => setCambio(event.target.value)} maxLength={80} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="catalog-photo">{t("Foto do veículo (PNG, JPEG ou WebP, até 3 MB)")}</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="catalog-photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="max-w-md"
                  onChange={(event) => choosePhoto(event.target.files?.[0])}
                />
                {photoName && <span className="text-sm text-muted-foreground">{photoName}</span>}
              </div>
              {fotoCarroUrl && <img src={fotoCarroUrl} alt={t("Prévia do veículo")} className="h-36 w-56 rounded-lg border object-contain" />}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{t("Versões")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setVersoes((items) => [...items, newVersion()])}>
                <Plus className="mr-1 h-4 w-4" /> {t("Adicionar versão")}
              </Button>
            </div>
            {versoes.map((version, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1.2fr_150px_auto]">
                <Input aria-label={t("Nome da versão")} placeholder={t("Nome da versão")} value={version.nome} onChange={(event) => updateVersion(index, "nome", event.target.value)} required />
                <Input aria-label={t("Motor da versão")} placeholder={t("Motor da versão")} value={version.motor} onChange={(event) => updateVersion(index, "motor", event.target.value)} required />
                <Input aria-label={t("Preço da versão")} type="number" min="0.01" step="0.01" placeholder={t("Preço")} value={version.preco} onChange={(event) => updateVersion(index, "preco", event.target.value)} required />
                <Button type="button" variant="ghost" size="icon" aria-label={t("Remover versão")} disabled={versoes.length === 1} onClick={() => setVersoes((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{t("Cores")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setCores((items) => [...items, newColor()])}>
                <Plus className="mr-1 h-4 w-4" /> {t("Adicionar cor")}
              </Button>
            </div>
            {cores.map((color, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input aria-label={t("Nome da cor")} placeholder={t("Nome da cor")} value={color.nome} onChange={(event) => updateColor(index, "nome", event.target.value)} required />
                <Input aria-label={t("Código hexadecimal da cor")} placeholder="#RRGGBB" value={color.hexadecimal} onChange={(event) => updateColor(index, "hexadecimal", event.target.value)} pattern="#[0-9a-fA-F]{6}" required />
                <Button type="button" variant="ghost" size="icon" aria-label={t("Remover cor")} disabled={cores.length === 1} onClick={() => setCores((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{t("Opcionais")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpcionais((items) => [...items, newOptional()])}>
                <Plus className="mr-1 h-4 w-4" /> {t("Adicionar opcional")}
              </Button>
            </div>
            {opcionais.length === 0 && <p className="text-sm text-muted-foreground">{t("Nenhum opcional adicionado.")}</p>}
            {opcionais.map((option, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_180px_auto]">
                <Input aria-label={t("Nome do opcional")} placeholder={t("Nome do opcional")} value={option.nome} onChange={(event) => updateOptional(index, "nome", event.target.value)} required />
                <Input aria-label={t("Preço do opcional")} type="number" min="0" step="0.01" placeholder={t("Preço")} value={option.preco} onChange={(event) => updateOptional(index, "preco", event.target.value)} required />
                <Button type="button" variant="ghost" size="icon" aria-label={t("Remover opcional")} onClick={() => setOpcionais((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("Cancelar")}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("Salvando...") : t("Salvar veículo")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const Vehicles = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [customVehicles, setCustomVehicles] = useState<CatalogoVeiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const loadCatalog = () => {
    api.listarCatalogoVeiculos()
      .then((data) => {
        setCustomVehicles(data);
        setCatalogError("");
      })
      .catch((error: unknown) => {
        console.error("Erro ao carregar o catálogo personalizado:", error);
        const message = error instanceof Error ? error.message : t("Não foi possível carregar os veículos adicionados.");
        setCatalogError(message);
      });
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const allVehicles: VehicleCardData[] = [
    ...vehicles.map((vehicle) => ({ ...vehicle, id: vehicle.id })),
    ...customVehicles.map((vehicle) => ({
      id: `catalog-${vehicle.id}`,
      name: vehicle.modelo,
      category: vehicle.categoria,
      price: money(vehicle.precoBase),
      year: vehicle.ano,
      image: vehicle.fotoCarroUrl,
    })),
  ];

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return allVehicles.filter((vehicle) => {
      const matchesCategory = category === "Todos" || vehicle.category === category;
      const matchesSearch = `${vehicle.name} ${vehicle.category}`
        .toLocaleLowerCase()
        .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [allVehicles, category, search]);

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
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <ImagePlus aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("Adicionar veículo")}
            </Button>
            <Button onClick={() => navigate("/pedidos/novo")}>
              {t("Novo pedido")} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {catalogError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>{catalogError}</span>
            <Button variant="outline" size="sm" onClick={loadCatalog}>{t("Tentar novamente")}</Button>
          </div>
        )}

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
                      <Link to={`/pedidos/novo?modelo=${encodeURIComponent(String(vehicle.id))}`}>
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
      <CatalogVehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(vehicle) => setCustomVehicles((current) => [...current, vehicle])}
      />
    </div>
  );
};

export default Vehicles;
