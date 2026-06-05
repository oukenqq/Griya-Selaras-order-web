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
export const mapOrderToRow = (order: Partial<Order>): any => {
  const row: any = {};
  
  if (order.id !== undefined) row.id = order.id;
  if (order.tanggalMasuk !== undefined) row.tanggal_masuk = order.tanggalMasuk;
  if (order.namaCustomer !== undefined) row.nama_pelanggan = order.namaCustomer;
  if (order.nomorWhatsApp !== undefined) row.no_hp = order.nomorWhatsApp;
  if (order.jenisLayanan !== undefined) row.jenis_layanan = order.jenisLayanan;
  if (order.catatanPesanan !== undefined) row.detail_pesanan = order.catatanPesanan;
  if (order.ukuran !== undefined) row.ukuran = order.ukuran;
  if (order.harga !== undefined) row.harga = order.harga;
  if (order.dp !== undefined) row.dp = order.dp;
  if (order.sisaBayar !== undefined) row.sisa_bayar = order.sisaBayar;
  if (order.statusPembayaran !== undefined) row.status_pembayaran = order.statusPembayaran;
  
  // The user uses "status_pesanan" for process advancement
  if (order.statusPengerjaan !== undefined) {
    row.status_pesanan = order.statusPengerjaan;
  }
  
  if (order.estimasiTanggalPengambilan !== undefined) row.deadline = order.estimasiTanggalPengambilan;
  if (order.catatanOwner !== undefined) row.catatan = order.catatanOwner;
  if (order.createdAt !== undefined) row.created_at = order.createdAt;
  if (order.updatedAt !== undefined) row.updated_at = order.updatedAt;

  return row;
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
  // Format harga & dp to strict number
  const hargaNumber = Number(orderData.harga) || 0;
  const dpNumber = Number(orderData.dp) || 0;

  // Format tanggal_masuk and deadline to strict YYYY-MM-DD
  const formatToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  // Payload insertion strictly following the 12 columns requested (no ID columns, automatic on Supabase)
  const payload = {
    nama_pelanggan: orderData.namaCustomer || "",
    no_hp: orderData.nomorWhatsApp || "",
    jenis_layanan: orderData.jenisLayanan || "",
    detail_pesanan: orderData.catatanPesanan || "",
    ukuran: orderData.ukuran || "",
    tanggal_masuk: formatToYYYYMMDD(orderData.tanggalMasuk),
    deadline: formatToYYYYMMDD(orderData.estimasiTanggalPengambilan),
    harga: hargaNumber,
    dp: dpNumber,
    status_pesanan: orderData.statusPengerjaan || "Pesanan Masuk",
    status_pembayaran: orderData.statusPembayaran || "Belum Bayar",
    catatan: orderData.catatanOwner || "",
  };

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
  // Recalculate sisa bayar dynamically if price or deposit was modified
  const updatesPatch = { ...ordersUpdates };
  if (updatesPatch.harga !== undefined || updatesPatch.dp !== undefined) {
    const currentPrice = updatesPatch.harga !== undefined ? updatesPatch.harga : 0;
    const currentDp = updatesPatch.dp !== undefined ? updatesPatch.dp : 0;
    updatesPatch.sisaBayar = Math.max(0, currentPrice - currentDp);
  }

  updatesPatch.updatedAt = new Date().toISOString();
  const rowPatch = mapOrderToRow(updatesPatch);

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
