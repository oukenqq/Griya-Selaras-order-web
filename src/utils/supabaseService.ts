import { supabase } from "../lib/supabaseClient";
import { Order } from "../types";
import { StatusPembayaran, StatusPengerjaan, StatusPengambilan } from "../data/statusOptions";

/**
 * Mapper function to convert Supabase rows to Front-end Order object
 */
export const mapRowToOrder = (row: any): Order => {
  return {
    id: row.id || "",
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
  orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Order> => {
  const sisaBayar = Math.max(0, orderData.harga - orderData.dp);
  const nowStr = new Date().toISOString();

  // If no manually assigned ID is in params, create temporary or let supabase generate
  const mappedRow = {
    tanggal_masuk: orderData.tanggalMasuk,
    nama_pelanggan: orderData.namaCustomer,
    no_hp: orderData.nomorWhatsApp,
    jenis_layanan: orderData.jenisLayanan,
    detail_pesanan: orderData.catatanPesanan,
    ukuran: orderData.ukuran || "",
    harga: orderData.harga,
    dp: orderData.dp,
    sisa_bayar: sisaBayar,
    status_pesanan: orderData.statusPengerjaan,
    status_pembayaran: orderData.statusPembayaran,
    deadline: orderData.estimasiTanggalPengambilan,
    catatan: orderData.catatanOwner,
    created_at: nowStr,
    updated_at: nowStr,
  } as any;

  // Let's check if there is an id requested (e.g. ORD-0005)
  if (orderData.id) {
    mappedRow.id = orderData.id;
  }

  const { data, error } = await supabase
    .from("pesanan")
    .insert([mappedRow])
    .select()
    .single();

  if (error) {
    console.error("Error inserting order to Supabase:", error);
    throw error;
  }

  return mapRowToOrder(data);
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
