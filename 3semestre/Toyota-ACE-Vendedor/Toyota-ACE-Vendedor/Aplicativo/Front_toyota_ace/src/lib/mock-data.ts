/* =========================
   IMPORT DAS IMAGENS
========================= */

import corollaCross from "@/assets/vehicles/corolla-cross.png";
import corollaSedan from "@/assets/vehicles/corolla-sedan.png";
import yarisSedan from "@/assets/vehicles/yaris-sedan.png";
import yarisHatch from "@/assets/vehicles/yaris-hatch.png";
import yarisCross from "@/assets/vehicles/yaris-cross.png";
import hilux from "@/assets/vehicles/hilux.png";

/* =========================
   FILIAIS
========================= */

export const branches = [
  { id: 1, name: "Toyota Centro", address: "Av. Paulista, 1500 - São Paulo" },
  { id: 2, name: "Toyota Zona Sul", address: "Av. Santo Amaro, 3200 - São Paulo" },
  { id: 3, name: "Toyota Campinas", address: "Rod. Anhanguera, km 95 - Campinas" },
  { id: 4, name: "Toyota ABC", address: "Av. Industrial, 800 - Santo André" },
];

/* =========================
   VEÍCULOS
========================= */

export const vehicles = [
  {
    id: 1,
    name: "Corolla Cross",
    category: "SUV",
    price: "R$ 189.990",
    year: 2025,
    image: corollaCross,
  },
  {
    id: 2,
    name: "Corolla Sedan",
    category: "Sedan",
    price: "R$ 179.990",
    year: 2025,
    image: corollaSedan,
  },
  {
    id: 3,
    name: "Yaris Sedan",
    category: "Sedan",
    price: "R$ 129.990",
    year: 2025,
    image: yarisSedan,
  },
  {
    id: 4,
    name: "Yaris Hatch",
    category: "Hatch",
    price: "R$ 109.990",
    year: 2024,
    image: yarisHatch,
  },
  {
    id: 5,
    name: "Yaris Cross",
    category: "SUV",
    price: "R$ 149.990",
    year: 2025,
    image: yarisCross,
  },
  {
    id: 6,
    name: "Hilux",
    category: "Picape",
    price: "R$ 299.990",
    year: 2025,
    image: hilux,
  },
];

/* =========================
   CLIENTES
========================= */

export type ClientStatus = "lead" | "negociacao" | "fechado";

export const clients = [
  {
    id: 1,
    name: "Carlos Mendes",
    phone: "(11) 98765-4321",
    status: "lead" as ClientStatus,
    vehicle: "Corolla Cross",
    lastContact: "Hoje",
  },
  {
    id: 2,
    name: "Ana Beatriz Silva",
    phone: "(11) 91234-5678",
    status: "negociacao" as ClientStatus,
    vehicle: "Hilux SRV",
    lastContact: "Ontem",
  },
  {
    id: 3,
    name: "Roberto Almeida",
    phone: "(19) 99876-5432",
    status: "fechado" as ClientStatus,
    vehicle: "SW4 Diamond",
    lastContact: "15/03",
  },
  {
    id: 4,
    name: "Juliana Costa",
    phone: "(11) 97654-3210",
    status: "lead" as ClientStatus,
    vehicle: "Yaris Hatch",
    lastContact: "Hoje",
  },
  {
    id: 5,
    name: "Fernando Dias",
    phone: "(11) 93456-7890",
    status: "negociacao" as ClientStatus,
    vehicle: "RAV4 Hybrid",
    lastContact: "18/03",
  },
  {
    id: 6,
    name: "Mariana Oliveira",
    phone: "(11) 92345-6789",
    status: "fechado" as ClientStatus,
    vehicle: "Corolla Altis",
    lastContact: "12/03",
  },
];

/* =========================
   AGENDAMENTOS
========================= */

export const appointments = [
  {
    id: 1,
    time: "09:00",
    client: "Carlos Mendes",
    type: "visita" as const,
    description: "Apresentação Corolla Cross",
  },
  {
    id: 2,
    time: "10:30",
    client: "Ana Beatriz Silva",
    type: "test-drive" as const,
    description: "Test drive Hilux SRV",
  },
  {
    id: 3,
    time: "13:00",
    client: "Juliana Costa",
    type: "ligacao" as const,
    description: "Follow-up proposta Yaris",
  },
  {
    id: 4,
    time: "14:30",
    client: "Fernando Dias",
    type: "visita" as const,
    description: "Negociação RAV4 Hybrid",
  },
  {
    id: 5,
    time: "16:00",
    client: "Novo Lead",
    type: "ligacao" as const,
    description: "Primeiro contato - interesse SW4",
  },
];

/* =========================
   DADOS DE VENDAS
========================= */

export const salesData = [
  { month: "Out", vendas: 9800 },
  { month: "Nov", vendas: 14200 },
  { month: "Dez", vendas: 17100 },
  { month: "Jan", vendas: 10800 },
  { month: "Fev", vendas: 15000 },
  { month: "Mar", vendas: 12900 },
];