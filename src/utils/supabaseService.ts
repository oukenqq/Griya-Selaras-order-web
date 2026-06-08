import { supabase } from "../lib/supabaseClient";
import { Order } from "../types";
import { StatusPembayaran, StatusPengerjaan, StatusPengambilan } from "../data/statusOptions";

/**
 * Mapper function to convert Supabase rows to Front-end Order object
 */
export const mapRowToOrder = (row: any): Order => {
  const rowId = row.id !== undefined && row.id !== null ? String(row.id) : "";
  return {
    id: rowId,
    tanggalMasuk: row.tanggal_masuk || "",
    namaCustomer: row.nama_pelanggan || "",
    nomorWhatsApp: row.no_hp || "",
    jenisLayanan: row.jenis_layanan || "",
    catatanPesanan: row.detail_pesanan || "",
    ukuran: row.ukuran || "",
    harga: Number(row.harga) || 0,
    dp: Number(row.dp) || 0,
    sisaBayar: Number(row.sisa_bayar) || 0,
    statusPembayaran: (row.status_pembayaran || "Belum Bayar") as StatusPembayaran,
    statusPengerjaan: (row.status_pesanan || "Pesanan Masuk") as StatusPengerjaan,
    estimasiTanggalPengambilan: row.deadline || "",
    tanggalSelesai: row.updated_at ? row.updated_at.split("T")[0] : "",
    statusPengambilan: (row.status_pesanan === "Sudah Diambil" ? "Sudah Diambil" : "Belum Diambil") as StatusPengambilan,
    catatanOwner: row.catatan || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
};

/**
 * Format any ID (usually database integer/bigint) safely into dynamic show format (ORD-XXXX)
 */
export const formatOrderId = (id: string | number): string => {
  if (!id) return "";
  const numericId = Number(id);
  if (!isNaN(numericId) && Number.isInteger(numericId)) {
    return `ORD-${String(numericId).padStart(4, "0")}`;
  }
  return String(id);
};

/**
 * Mapper function to convert Front-end Order parameter updates to Supabase parameters
 * with strict column whitelisting to ensure columns like sisa_bayar, id, created_at, or updated_at are never sent.
 */
export const buildPesananPayload = (data: any): any => {
  if (!data) return {};

  const payload: any = {};

  // 1. nama_pelanggan
  const nama_pelanggan = data.nama_pelanggan !== undefined ? data.nama_pelanggan : data.namaCustomer;
  if (nama_pelanggan !== undefined) payload.nama_pelanggan = nama_pelanggan;

  // 2. no_hp
  const no_hp = data.no_hp !== undefined ? data.no_hp : data.nomorWhatsApp;
  if (no_hp !== undefined) payload.no_hp = no_hp;

  // 3. jenis_layanan
  const jenis_layanan = data.jenis_layanan !== undefined ? data.jenis_layanan : data.jenisLayanan;
  if (jenis_layanan !== undefined) payload.jenis_layanan = jenis_layanan;

  // 4. detail_pesanan
  const detail_pesanan = data.detail_pesanan !== undefined ? data.detail_pesanan : data.catatanPesanan;
  if (detail_pesanan !== undefined) payload.detail_pesanan = detail_pesanan;

  // 5. ukuran
  if (data.ukuran !== undefined) payload.ukuran = data.ukuran;

  // 6. tanggal_masuk
  const tanggal_masuk = data.tanggal_masuk !== undefined ? data.tanggal_masuk : data.tanggalMasuk;
  if (tanggal_masuk !== undefined) {
    payload.tanggal_masuk = typeof tanggal_masuk === "string" ? tanggal_masuk.split("T")[0] : tanggal_masuk;
  }

  // 7. deadline
  const deadline = data.deadline !== undefined ? data.deadline : data.estimasiTanggalPengambilan;
  if (deadline !== undefined) {
    payload.deadline = typeof deadline === "string" ? deadline.split("T")[0] : deadline;
  }

  // 8. harga
  const harga = data.harga !== undefined ? data.harga : undefined;
  if (harga !== undefined) payload.harga = Number(harga) || 0;

  // 9. dp
  const dp = data.dp !== undefined ? data.dp : undefined;
  if (dp !== undefined) payload.dp = Number(dp) || 0;

  // 10. status_pesanan
  const status_pesanan = data.status_pesanan !== undefined ? data.status_pesanan : data.statusPengerjaan;
  if (status_pesanan !== undefined) payload.status_pesanan = status_pesanan;

  // 11. status_pembayaran
  const status_pembayaran = data.status_pembayaran !== undefined ? data.status_pembayaran : data.statusPembayaran;
  if (status_pembayaran !== undefined) payload.status_pembayaran = status_pembayaran;

  // 12. catatan
  const catatan = data.catatan !== undefined ? data.catatan : data.catatanOwner;
  if (catatan !== undefined) payload.catatan = catatan;

  return payload;
};

export const mapOrderToRow = (order: Partial<Order>): any => {
  return buildPesananPayload(order);
};

/**
 * Fetch all orders from Supabase public.pesanan
 */
export const fetchSupabaseOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("pesanan")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders from Supabase:", error);
    throw error;
  }

  return (data || []).map(mapRowToOrder);
};

/**
 * Insert a new order to Supabase public.pesanan
 */
export const insertSupabaseOrder = async (
  orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt">
): Promise<Order> => {
  const payload = buildPesananPayload(orderData);

  // Run the insert action directly on Supabase table public.pesanan
  const { data, error } = await supabase
    .from("pesanan")
    .insert([payload])
    .select();

  if (error) {
    console.error("Gagal insert pesanan:", error);
    alert(`Gagal menambahkan data: ${error.message}`);
    throw error;
  }

  const insertedRow = Array.isArray(data) ? data[0] : data;
  if (!insertedRow) {
    throw new Error("No data returned from insert");
  }

  return mapRowToOrder(insertedRow);
};

/**
 * Update an existing order in Supabase
 */
export const updateSupabaseOrder = async (
  id: string,
  ordersUpdates: Partial<Order>
): Promise<Order> => {
  const rowPatch = buildPesananPayload(ordersUpdates);

  const { data, error } = await supabase
    .from("pesanan")
    .update(rowPatch)
    .eq("id", id)
    .select();

  if (error) {
    console.error(`Error updating order ${id} in Supabase:`, error);
    throw error;
  }

  const updatedRow = Array.isArray(data) ? data[0] : data;
  if (!updatedRow) {
    throw new Error("No data returned from update");
  }

  return mapRowToOrder(updatedRow);
};

/**
 * Delete an order from Supabase
 */
export const deleteSupabaseOrder = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("pesanan")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting order ${id} from Supabase:`, error);
    throw error;
  }
};
