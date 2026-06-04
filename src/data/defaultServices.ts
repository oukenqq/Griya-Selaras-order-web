export interface ServiceConfig {
  id: string;
  name: string;
  defaultPriceMin: number;
  defaultPriceMax: number;
  estimatedDays: number;
}

export const INITIAL_SERVICES: ServiceConfig[] = [
  {
    id: "svc-1",
    name: "Permak Pakaian",
    defaultPriceMin: 45000,
    defaultPriceMax: 50000,
    estimatedDays: 3,
  },
  {
    id: "svc-2",
    name: "Jahit Kebaya",
    defaultPriceMin: 150000,
    defaultPriceMax: 250000,
    estimatedDays: 14,
  },
  {
    id: "svc-3",
    name: "Jahit Seragam",
    defaultPriceMin: 75000,
    defaultPriceMax: 85000,
    estimatedDays: 7,
  },
  {
    id: "svc-4",
    name: "Jahit Custom",
    defaultPriceMin: 115000,
    defaultPriceMax: 175000,
    estimatedDays: 10,
  },
  {
    id: "svc-5",
    name: "Pesanan Jumlah Banyak",
    defaultPriceMin: 500000,
    defaultPriceMax: 2000000,
    estimatedDays: 20,
  },
  {
    id: "svc-6",
    name: "Lainnya",
    defaultPriceMin: 20000,
    defaultPriceMax: 100000,
    estimatedDays: 5,
  },
];
