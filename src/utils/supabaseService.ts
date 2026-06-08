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
 */
/**
 * Mapper function to convert Front-end Order parameter updates to Supabase parameters
 * with strict column whitelisting to ensure columns like sisa_bayar, id, created_at, or updated_at are never sent.
 */
export const buildPesananPayload = (data: any): any => {
  if (!data) return {};

  // Extract from either snake_case (e.g. from user form) or camelCase (e.g. from Order interface) structures
  const nama_pelanggan = data.nama_pelanggan !== undefined ? data.nama_pelanggan : (data.namaCustomer !== undefined ? data.namaCustomer : undefined);
  const no_hp = data.no_hp !== undefined ? data.no_hp : (data.nomorWhatsApp !== undefined ? data.nomorWhatsApp : undefined);
  const jenis_layanan = data.jenis_layanan !== undefined ? data.jenis_layanan : (data.jenisLayanan !== undefined ? data.jenisLayanan : undefined);
  const detail_pesanan = data.detail_pesanan !== undefined ? data.detail_pesanan : (data.catatanPesanan !== undefined ? data.catatanPesanan : undefined);
  const ukuran = data.ukuran !== undefined ? data.ukuran : undefined;
  const tanggal_masuk = data.tanggal_masuk !== undefined ? data.tanggal_masuk : (data.tanggalMasuk !== undefined ? data.tanggalMasuk : undefined);
  const deadline = data.deadline !== undefined ? data.deadline : (data.estimasiTanggalPengambilan !== undefined ? data.estimasiTanggalPengambilan : undefined);
  const harga = data.harga !== undefined ? Number(data.harga) : undefined;
  const dp = data.dp !== undefined ? Number(data.dp) : undefined;
  const status_pesanan = data.status_pesanan !== undefined ? data.status_pesanan : (data.statusPengerjaan !== undefined ? data.statusPengerjaan : undefined);
  const status_pembayaran = data.status_pembayaran !== undefined ? data.status_pembayaran : (data.statusPembayaran !== undefined ? data.statusPembayaran : undefined);
  const status_pengambilan = data.status_pengambilan !== undefined ? data.status_pengambilan : (data.statusPengambilan !== undefined ? data.statusPengambilan : undefined);
  const catatan = data.catatan !== undefined ? data.catatan : (data.catatanOwner !== undefined ? data.catatanOwner : undefined);

  // Date format helper to strip times if any
  const toYYYYMMDD = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === "string") {
      return val.split("T")[0];
    }
    return val;
  };

  const payload: any = {};
  if (nama_pelanggan !== undefined) payload.nama_pelanggan = nama_pelanggan;
  if (no_hp !== undefined) payload.no_hp = no_hp;
  if (jenis_layanan !== undefined) payload.jenis_layanan = jenis_layanan;
  if (detail_pesanan !== undefined) payload.detail_pesanan = detail_pesanan;
  if (ukuran !== undefined) payload.ukuran = ukuran;
  if (tanggal_masuk !== undefined) payload.tanggal_masuk = toYYYYMMDD(tanggal_masuk);
  if (deadline !== undefined) payload.deadline = toYYYYMMDD(deadline);
  if (harga !== undefined) payload.harga = harga;
  if (dp !== undefined) payload.dp = dp;
  if (status_pesanan !== undefined) payload.status_pesanan = status_pesanan;
  if (status_pembayaran !== undefined) payload.status_pembayaran = status_pembayaran;
  if (status_pengambilan !== undefined) payload.status_pengambilan = status_pengambilan;
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
    .select()
    .single();

  if (error) {
    console.error(`Error updating order ${id} in Supabase:`, error);
    throw error;
  }

  return mapRowToOrder(data);
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
