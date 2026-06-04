import { Order, UMKMProfile } from "../types";
import { INITIAL_SERVICES, ServiceConfig } from "../data/defaultServices";

const STORAGE_KEYS = {
  ORDERS: "griya_selaras_orders",
  PROFILE: "griya_selaras_profile",
  SERVICES: "griya_selaras_services",
};

const DEFAULT_PROFILE: UMKMProfile = {
  name: "Griya Selaras by Syuhada",
  owner: "Bapak Syuhada",
  address: "Desa Randegan, Wangon, Banyumas",
  phone: "6282138492049", // Example owner phone
};

// Initial mock data if storage is completely empty
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-0001",
    tanggalMasuk: "2026-06-01",
    namaCustomer: "Ibu Fatimah",
    nomorWhatsApp: "6281234567890",
    jenisLayanan: "Jahit Kebaya",
    catatanPesanan: "Model encim modern dengan brokat bunga warna lilac. Lingkar dada: 95cm, Panjang lengan: 52cm, Lingkar pinggang: 78cm.",
    harga: 220000,
    dp: 100000,
    sisaBayar: 120000,
    statusPembayaran: "DP",
    statusPengerjaan: "Sedang Dikerjakan",
    estimasiTanggalPengambilan: "2026-06-15",
    tanggalSelesai: "",
    statusPengambilan: "Belum Diambil",
    catatanOwner: "Brokat disediakan pelanggan, furing dari kita.",
    createdAt: "2026-06-01T08:30:00.000Z",
    updatedAt: "2026-06-01T08:30:00.000Z",
  },
  {
    id: "ORD-0002",
    tanggalMasuk: "2026-06-03",
    namaCustomer: "Mas Robert",
    nomorWhatsApp: "6289876543210",
    jenisLayanan: "Permak Pakaian",
    catatanPesanan: "Potong celana jins Levi's biru tua sebanyak 5 cm. Samakan jahitan bawah dengan aslinya (original hem).",
    harga: 50000,
    dp: 20000,
    sisaBayar: 30000,
    statusPembayaran: "DP",
    statusPengerjaan: "Selesai",
    estimasiTanggalPengambilan: "2026-06-07",
    tanggalSelesai: "2026-06-04",
    statusPengambilan: "Belum Diambil",
    catatanOwner: "Minta benang warna emas/oranye khas Levi's.",
    createdAt: "2026-06-03T10:15:00.000Z",
    updatedAt: "2026-06-04T02:00:00.000Z",
  },
  {
    id: "ORD-0003",
    tanggalMasuk: "2026-06-03",
    namaCustomer: "Mbak Sila",
    nomorWhatsApp: "6285512345678",
    jenisLayanan: "Jahit Seragam",
    catatanPesanan: "Jahit baju batik kerja lengan panjang ber-furing Hero. Kerah keranjang, kancing dalam.",
    harga: 85000,
    dp: 85000,
    sisaBayar: 0,
    statusPembayaran: "Lunas",
    statusPengerjaan: "Pesanan Masuk",
    estimasiTanggalPengambilan: "2026-06-10",
    tanggalSelesai: "",
    statusPengambilan: "Belum Diambil",
    catatanOwner: "Kain batik katun halus.",
    createdAt: "2026-06-03T14:45:00.000Z",
    updatedAt: "2026-06-03T14:45:00.000Z",
  },
  {
    id: "ORD-0004",
    tanggalMasuk: "2026-05-28",
    namaCustomer: "Pak Gunawan",
    nomorWhatsApp: "",
    jenisLayanan: "Jahit Custom",
    catatanPesanan: "Kemeja formal lengan pendek bahan linen import warna sage green. Ada saku di dada kiri.",
    harga: 125000,
    dp: 0,
    sisaBayar: 125000,
    statusPembayaran: "Belum Bayar",
    statusPengerjaan: "Sudah Diambil",
    estimasiTanggalPengambilan: "2026-06-03",
    tanggalSelesai: "2026-06-02",
    statusPengambilan: "Sudah Diambil",
    catatanOwner: "Sudah diambil sore-sore oleh adiknya.",
    createdAt: "2026-05-28T09:00:00.000Z",
    updatedAt: "2026-06-03T17:00:00.000Z",
  }
];

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(MOCK_ORDERS));
    return MOCK_ORDERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return MOCK_ORDERS;
  }
};

export const saveOrders = (orders: Order[]): void => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const generateNextOrderId = (orders: Order[]): string => {
  if (orders.length === 0) return "ORD-0001";
  
  let maxIdNum = 0;
  orders.forEach((o) => {
    const parts = o.id.split("-");
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });
  
  const nextNum = maxIdNum + 1;
  return `ORD-${String(nextNum).padStart(4, "0")}`;
};

export const addOrder = (
  orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt">
): Order => {
  const orders = getOrders();
  const nextId = generateNextOrderId(orders);
  
  const sisaBayar = Math.max(0, orderData.harga - orderData.dp);
  const now = new Date().toISOString();
  
  const newOrder: Order = {
    ...orderData,
    id: nextId,
    sisaBayar,
    createdAt: now,
    updatedAt: now,
  };
  
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrder = (id: string, orderData: Partial<Order>): Order => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    throw new Error(`Order with ID ${id} not found.`);
  }
  
  const existingOrder = orders[index];
  const merged = { ...existingOrder, ...orderData };
  
  // Recalculate sisa bayar
  merged.sisaBayar = Math.max(0, merged.harga - merged.dp);
  merged.updatedAt = new Date().toISOString();
  
  orders[index] = merged;
  saveOrders(orders);
  return merged;
};

export const deleteOrder = (id: string): void => {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== id);
  saveOrders(filtered);
};

export const getProfile = (): UMKMProfile => {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = (profile: UMKMProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getServices = (): ServiceConfig[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    return INITIAL_SERVICES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SERVICES;
  }
};

export const saveServices = (services: ServiceConfig[]): void => {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ORDERS);
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.SERVICES);
};
