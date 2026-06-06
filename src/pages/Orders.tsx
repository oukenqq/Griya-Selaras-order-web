import React, { useState } from "react";
import { Order } from "../types";
import { formatOrderId } from "../utils/supabaseService";
import { formatRupiah } from "../utils/formatCurrency";
import { formatIndonesianDate, isDatePassed, isDateNear } from "../utils/dateUtils";
import { StatusBadge } from "../components/StatusBadge";
import { Search, SlidersHorizontal, Plus, Phone, Calendar, ArrowUpDown, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { StatusPembayaran, StatusPengerjaan, STATUS_PEMBAYARAN_LIST, STATUS_PENGERJAAN_LIST } from "../data/statusOptions";

interface OrdersProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onAddNewOrder: () => void;
}

type DateFilterOption = "semua" | "hari_ini" | "terlambat" | "minggu_ini" | "bulan_ini";

export const Orders: React.FC<OrdersProps> = ({ orders, onSelectOrder, onAddNewOrder }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pengerjaanFilter, setPengerjaanFilter] = useState<StatusPengerjaan | "Semua">("Semua");
  const [pembayaranFilter, setPembayaranFilter] = useState<StatusPembayaran | "Semua">("Semua");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("semua");
  const [sortBy, setSortBy] = useState<"estimasi_asc" | "estimasi_desc" | "terbaru" | "terlama">("estimasi_asc");
  const [showFilters, setShowFilters] = useState(false);

  // Filter & Search logic
  const filteredOrders = orders.filter((order) => {
    // 1. Search name or whatsapp
    const matchesSearch =
      order.namaCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.nomorWhatsApp.includes(searchTerm) ||
      formatOrderId(order.id).toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filter pengerjaan
    let matchesPengerjaan = false;
    if (pengerjaanFilter === "Semua") {
      // Hide 'Sudah Diambil' by default on 'Semua' view to keep list focused on active ones,
      // override this if there's an active text search or other specific filters are on.
      if (searchTerm.trim() !== "" || dateFilter !== "semua" || pembayaranFilter !== "Semua") {
        matchesPengerjaan = true;
      } else {
        matchesPengerjaan = order.statusPengerjaan !== "Sudah Diambil";
      }
    } else {
      matchesPengerjaan = order.statusPengerjaan === pengerjaanFilter;
    }

    // 3. Filter pembayaran
    const matchesPembayaran = pembayaranFilter === "Semua" || order.statusPembayaran === pembayaranFilter;

    // 4. Filter date condition
    let matchesDate = true;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const orderDate = new Date(order.tanggalMasuk);
    orderDate.setHours(0, 0, 0, 0);

    const estimasiDate = new Date(order.estimasiTanggalPengambilan);
    estimasiDate.setHours(0, 0, 0, 0);

    if (dateFilter === "hari_ini") {
      matchesDate = order.tanggalMasuk === now.toISOString().split("T")[0];
    } else if (dateFilter === "terlambat") {
      matchesDate = order.statusPengerjaan !== "Selesai" && order.statusPengerjaan !== "Sudah Diambil" && order.statusPengambilan !== "Sudah Diambil" && isDatePassed(order.estimasiTanggalPengambilan);
    } else if (dateFilter === "minggu_ini") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesDate = orderDate.getTime() >= oneWeekAgo.getTime();
    } else if (dateFilter === "bulan_ini") {
      matchesDate = orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
    }

    return matchesSearch && matchesPengerjaan && matchesPembayaran && matchesDate;
  });

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Primary sort: if one is already taken and the other is active, put taken at the bottom
    const isTakenA = a.statusPengerjaan === "Sudah Diambil" ? 1 : 0;
    const isTakenB = b.statusPengerjaan === "Sudah Diambil" ? 1 : 0;
    if (isTakenA !== isTakenB) {
      return isTakenA - isTakenB; // Active (0) first, taken (1) at the bottom
    }

    const timeA = new Date(a.estimasiTanggalPengambilan).getTime();
    const timeB = new Date(b.estimasiTanggalPengambilan).getTime();
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();

    if (sortBy === "estimasi_asc") return timeA - timeB;
    if (sortBy === "estimasi_desc") return timeB - timeA;
    if (sortBy === "terbaru") return createdB - createdA;
    if (sortBy === "terlama") return createdA - createdB;
    return 0;
  });

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-950">Daftar Pesanan</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Total {sortedOrders.length} pesanan ditemukan
          </p>
        </div>
        
        <button
          onClick={onAddNewOrder}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-stone-100 hover:bg-stone-800 rounded-xl font-bold text-sm shadow active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, nomor WA, atau ID pesanan..."
            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {/* Quick Filter toggle & Sort */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold ${
              showFilters
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"
            } transition-all`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Saring & Atur</span>
          </button>

          {/* Quick chip for Late/Terlambat to immediately action late orders */}
          <button
            onClick={() => setDateFilter(dateFilter === "terlambat" ? "semua" : "terlambat")}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold border ${
              dateFilter === "terlambat"
                ? "bg-red-50 border-red-300 text-red-700 font-sans"
                : "border-stone-200 text-stone-600 bg-white"
            }`}
          >
            ⚠️ Terlambat
          </button>

          {/* Quick chip for Sudah Diambil to view finished/taken orders */}
          <button
            onClick={() => {
              setPengerjaanFilter(pengerjaanFilter === "Sudah Diambil" ? "Semua" : "Sudah Diambil");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
              pengerjaanFilter === "Sudah Diambil"
                ? "bg-green-50 border-green-300 text-green-700"
                : "border-stone-200 text-stone-600 bg-white hover:bg-stone-50"
            }`}
          >
            <span>✅ Sudah Diambil</span>
          </button>
        </div>

        {/* Expandable filters block */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-stone-800 text-xs"
          >
            {/* Filter Pengerjaan */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Status Pembuatan:</label>
              <select
                value={pengerjaanFilter}
                onChange={(e) => setPengerjaanFilter(e.target.value as any)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="Semua">Semua Status</option>
                {STATUS_PENGERJAAN_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Pembayaran */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Status Pembayaran:</label>
              <select
                value={pembayaranFilter}
                onChange={(e) => setPembayaranFilter(e.target.value as any)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="Semua">Semua Pembayaran</option>
                {STATUS_PEMBAYARAN_LIST.map((pb) => (
                  <option key={pb} value={pb}>
                    {pb}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Waktu Masuk:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="semua">Semua Waktu</option>
                <option value="hari_ini">Masuk Hari Ini</option>
                <option value="minggu_ini">7 Hari Terakhir</option>
                <option value="bulan_ini">Bulan Ini</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Urutkan Berdasarkan:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="estimasi_asc">Estimasi Ambil (Terdekat)</option>
                <option value="estimasi_desc">Estimasi Ambil (Terjauh)</option>
                <option value="terbaru">Paling Baru Dibuat</option>
                <option value="terlama">Paling Lama Dibuat</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Orders list in mobile friendly card grids */}
      <div className="space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
            Tidak ada data pesanan yang cocok dengan saringan filter Anda. 🧐
          </div>
        ) : (
          sortedOrders.map((order, index) => {
            const isLate = order.statusPengerjaan !== "Selesai" && order.statusPengerjaan !== "Sudah Diambil" && order.statusPengambilan !== "Sudah Diambil" && isDatePassed(order.estimasiTanggalPengambilan);
            const isNear = isDateNear(order.estimasiTanggalPengambilan);
            const isTaken = order.statusPengerjaan === "Sudah Diambil";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => onSelectOrder(order.id)}
                className={`bg-white p-4 rounded-xl border ${
                  isTaken
                    ? "border-green-200 bg-green-50/5 hover:border-green-350 opacity-90"
                    : isLate
                    ? "border-red-300 bg-red-50/10 hover:border-red-400"
                    : "border-stone-200 hover:border-amber-400/60"
                } shadow-3xs hover:shadow-xs cursor-pointer active:bg-stone-50 transition-all flex flex-col gap-3.5`}
              >
                {/* ID customer / Header inside card */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 border-stone-200 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-3xs font-extrabold text-stone-400 bg-stone-100/80 border border-stone-200/60 px-1.5 py-0.5 rounded-md">
                        {formatOrderId(order.id)}
                      </span>
                      <h4 className="font-bold text-stone-900 text-base leading-tight">
                        {order.namaCustomer}
                      </h4>
                    </div>

                    {order.nomorWhatsApp ? (
                      <div className="flex items-center text-stone-500 font-mono text-2xs select-all">
                        <Phone className="w-3 h-3 text-emerald-500 mr-1" />
                        <span>{order.nomorWhatsApp}</span>
                      </div>
                    ) : (
                      <span className="text-3xs text-stone-400 italic">No WhatsApp kosong</span>
                    )}
                  </div>

                  {/* Pricing indicator */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-stone-400">Total Harga</span>
                    <p className="text-sm font-extrabold text-stone-900">{formatRupiah(order.harga)}</p>
                  </div>
                </div>

                {/* Service type & pickup date info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-y border-stone-100 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400">Layanan: </span>
                    <span className="font-bold text-stone-800 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md inline-block">
                      {order.jenisLayanan}
                    </span>
                  </div>

                  <div className="flex items-center text-stone-600 gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ambil: </span>
                    <span className={`font-bold ${isLate ? "text-red-600 animate-pulse font-extrabold" : "text-stone-800"}`}>
                      {formatIndonesianDate(order.estimasiTanggalPengambilan).split(", ")[1] || order.estimasiTanggalPengambilan}
                    </span>
                    {isLate && (
                      <span className="text-3xs font-bold bg-red-600 text-white rounded px-1 animate-pulse">
                        TERLAMBAT
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom badges & quick review button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge type="pengerjaan" status={order.statusPengerjaan} />
                    <StatusBadge type="pembayaran" status={order.statusPembayaran} />
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-amber-700">
                    <span>Aksi & Detail</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
