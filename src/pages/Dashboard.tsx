import React from "react";
import { Order } from "../types";
import { formatRupiah } from "../utils/formatCurrency";
import { formatIndonesianDate, isDatePassed, isDateNear } from "../utils/dateUtils";
import { StatusBadge } from "../components/StatusBadge";
import { Calendar, CheckCircle2, DollarSign, Hourglass, RefreshCw, AlertTriangle, ChevronRight, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  orders: Order[];
  onNavigateToTab: (tab: string) => void;
  onSelectOrder: (orderId: string) => void;
  onAddNewOrder: () => void;
  isInstallable?: boolean;
  onInstallApp?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  onNavigateToTab,
  onSelectOrder,
  onAddNewOrder,
  isInstallable = false,
  onInstallApp,
}) => {
  // Current month filter
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  // 1. Pesanan Aktif: Belum diambil & pengerjaan bukan Batal
  const activeOrders = orders.filter(
    (o) => o.statusPengerjaan !== "Batal" && o.statusPengambilan !== "Sudah Diambil"
  );

  // 2. Belum Lunas (Belum Bayar atau DP)
  const unpaidOrders = orders.filter(
    (o) => o.statusPembayaran === "Belum Bayar" || o.statusPembayaran === "DP"
  );

  // Helper to determine if order was created or completed in current month
  const isOrderThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  // 3. Pemasukan bulan ini: Real money received from orders created/logged in this month
  // - If Lunas: total harga
  // - If DP: total dp
  // - If Belum Bayar: 0
  const incomeThisMonth = orders
    .filter((o) => isOrderThisMonth(o.tanggalMasuk))
    .reduce((total, o) => {
      if (o.statusPembayaran === "Lunas") {
        return total + o.harga;
      } else if (o.statusPembayaran === "DP") {
        return total + o.dp;
      }
      return total;
    }, 0);

  // 4. Pesanan Selesai Bulan ini: Selesai atau Sudah Diambil, dan tanggal pengerjaan selesai di bulan ini
  const completedOrdersThisMonth = orders.filter((o) => {
    const isCompleted = o.statusPengerjaan === "Selesai" || o.statusPengerjaan === "Sudah Diambil";
    const dateToCompare = o.tanggalSelesai || o.estimasiTanggalPengambilan; // Fallback
    return isCompleted && isOrderThisMonth(dateToCompare);
  });

  // Urutan Terdekat Diambil: Tampilkan pesanan yang belum diambil dan pengerjaan bukan Batal
  // Urutkan berdasarkan estimasiTanggalPengambilan ASC
  const nearPickupOrders = [...orders]
    .filter((o) => o.statusPengambilan !== "Sudah Diambil" && o.statusPengerjaan !== "Batal")
    .sort((a, b) => {
      const dateA = new Date(a.estimasiTanggalPengambilan);
      const dateB = new Date(b.estimasiTanggalPengambilan);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5); // Max 5 items for dashboard simplicity

  // Check if any active order is past estimation date
  const lateOrdersCount = activeOrders.filter(
    (o) => o.statusPengerjaan !== "Selesai" && isDatePassed(o.estimasiTanggalPengambilan)
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Aplikasi Internal
          </span>
          <h2 className="text-2xl font-bold text-stone-950 mt-0.5">
            Halo, Griya Selaras 👋
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {formatIndonesianDate(today.toISOString().split("T")[0])}
          </p>
        </div>
        
        <button
          onClick={onAddNewOrder}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-stone-900 text-stone-100 hover:bg-stone-800 rounded-xl font-semibold shadow-md active:scale-95 transition-all text-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 text-amber-500" />
          <span>Tambah Pesanan Baru</span>
        </button>
      </div>

      {/* PWA Direct Installation Banner */}
      {isInstallable && onInstallApp && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-850 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg text-stone-100"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                Pasang Aplikasi Griya Order di HP
              </h4>
              <p className="text-stone-300 text-xs mt-1 max-w-xl">
                Dapatkan pengalaman seperti aplikasi asli (native app) langsung di Android / iOS Anda! Lebih cepat, hemat kuota, dan ikon aplikasi akan muncul di layar utama (Home-Screen).
              </p>
            </div>
          </div>
          <button
            onClick={onInstallApp}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span>Pasang Sekarang</span>
          </button>
        </motion.div>
      )}

      {/* Warning Banner if there is late orders */}
      {lateOrdersCount > 0 && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-950">
              Ada {lateOrdersCount} Pesanan Terlambat!
            </h4>
            <p className="text-xs text-red-700 mt-1">
              Tanggal estimasi pengambilan sudah lewat tetapi status pembuatannya belum selesai. Mohon segera periksa pesanan tersebut.
            </p>
            <button
              onClick={() => onNavigateToTab("orders")}
              className="text-xs font-semibold text-red-800 underline mt-2 block"
            >
              Lihat Semua Pesanan
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateToTab("orders")}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Pesanan Aktif
            </span>
            <div className="p-1.5 bg-stone-100 rounded-lg text-stone-700">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-stone-950 leading-none">
              {activeOrders.length}
            </h3>
            <p className="text-2xs text-stone-400 mt-2">
              Pesanan belum diambil
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateToTab("orders")}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Belum Lunas
            </span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-rose-600 leading-none">
              {unpaidOrders.length}
            </h3>
            <p className="text-2xs text-stone-400 mt-2">
              Belum lunas / sisa DP
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateToTab("finance")}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 font-sans">
              Pemasukan Bulan Ini
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-700 leading-none">
              {formatRupiah(incomeThisMonth)}
            </h3>
            <p className="text-2xs text-stone-400 mt-2">
              Uang terkumpul bulan ini
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateToTab("orders")}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Selesai Bulan Ini
            </span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-indigo-700 leading-none">
              {completedOrdersThisMonth.length}
            </h3>
            <p className="text-2xs text-stone-400 mt-2">
              Pesanan selesai dikerjakan
            </p>
          </div>
        </div>
      </div>

      {/* Near Pickup List (Pesanan terdekat diambil) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Pesanan Terdekat Diambil</span>
          </h3>
          <button
            onClick={() => onNavigateToTab("orders")}
            className="text-xs font-semibold text-stone-700 hover:text-amber-700 flex items-center gap-0.5 transition-all p-1"
          >
            <span>Semua Pesanan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {nearPickupOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-505 text-sm font-medium">
              Tidak ada pesanan aktif atau belum diambil saat ini. 😄
            </div>
          ) : (
            nearPickupOrders.map((order, idx) => {
              const isLate = order.statusPengerjaan !== "Selesai" && isDatePassed(order.estimasiTanggalPengambilan);
              const isNear = isDateNear(order.estimasiTanggalPengambilan);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onSelectOrder(order.id)}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs hover:shadow-sm cursor-pointer hover:border-amber-400/60 active:bg-stone-50 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-400">
                        {order.id}
                      </span>
                      <h4 className="font-bold text-stone-900 text-base">
                        {order.namaCustomer}
                      </h4>
                      {isLate ? (
                        <span className="px-2 py-0.5 rounded text-3xs font-extrabold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200 animate-pulse">
                          TERLAMBAT
                        </span>
                      ) : isNear ? (
                        <span className="px-2 py-0.5 rounded text-3xs font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200">
                          SEGERA
                        </span>
                      ) : null}
                    </div>
                    
                    <div className="grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <div>
                        Layanan: <span className="font-semibold text-stone-800">{order.jenisLayanan}</span>
                      </div>
                      <div className="md:border-l md:pl-4 border-stone-200">
                        Estimasi Ambil:{" "}
                        <span className="font-semibold text-stone-800">
                          {formatIndonesianDate(order.estimasiTanggalPengambilan).split(", ")[1] || order.estimasiTanggalPengambilan}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge type="pengerjaan" status={order.statusPengerjaan} />
                    <StatusBadge type="pembayaran" status={order.statusPembayaran} />
                    <ChevronRight className="w-5 h-5 text-stone-400 hidden md:block" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
