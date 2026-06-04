import { StatusPengerjaan, StatusPembayaran, StatusPengambilan } from "./data/statusOptions";

export interface Order {
  id: string; // Format: ORD-0001, ORD-0002...
  tanggalMasuk: string; // YYYY-MM-DD
  namaCustomer: string;
  nomorWhatsApp: string;
  jenisLayanan: string;
  catatanPesanan: string;
  harga: number;
  dp: number;
  sisaBayar: number;
  statusPembayaran: StatusPembayaran;
  statusPengerjaan: StatusPengerjaan;
  estimasiTanggalPengambilan: string; // YYYY-MM-DD
  tanggalSelesai: string; // YYYY-MM-DD or empty
  statusPengambilan: StatusPengambilan;
  catatanOwner: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface UMKMProfile {
  name: string;
  owner: string;
  address: string;
  phone: string;
}
