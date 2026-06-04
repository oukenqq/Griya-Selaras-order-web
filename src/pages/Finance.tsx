import React, { useState } from "react";
import { Order } from "../types";
import { formatRupiah } from "../utils/formatCurrency";
import { formatIndonesianDate } from "../utils/dateUtils";
import { downloadCsv } from "../utils/exportCsv";
import { StatusBadge } from "../components/StatusBadge";
import { 
  TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign, Download, 
  Calendar, Layers, CheckSquare, Clock, FileJson 
} from "lucide-react";
import { motion } from "motion/react";

interface FinanceProps {
  orders: Order[];
}

type FinanceFilterOption = "semua" | "hari_ini" | "minggu_ini" | "bulan_ini";

export const Finance: React.FC<FinanceProps> = ({ orders }) => {
  const [filter, setFilter] = useState<FinanceFilterOption>("bulan_ini");

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  
  // Helper to determine date inclusion matches
  const isIncludedInFilter = (order: Order): boolean => {
    const orderDate = new Date(order.tanggalMasuk);
    orderDate.setHours(0, 0, 0, 0);

    if (filter === "hari_ini") {
      return order.tanggalMasuk === todayStr;
    }
    if (filter === "minggu_ini") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return orderDate.getTime() >= oneWeekAgo.getTime();
    }
    if (filter === "bulan_ini") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }
    return true; // "semua"
  };

  // 1. Get filtered list of orders
  const filteredOrders = orders.filter(isIncludedInFilter);

  // 2. Calculations based on filtered list
  // Uang Masuk Real:
  // - Lunas -> harga
  // - DP -> dp
  // - Belum Bayar -> 0
  const calculateReceivedMoney = (o: Order) => {
    if (o.statusPembayaran === "Lunas") return o.harga;
    if (o.statusPembayaran === "DP") return o.dp;
    return 0;
  };

  const totalReceipts = filteredOrders.reduce((total, o) => total + calculateReceivedMoney(o), 0);
  
  // Sisa bayar / Outstanding receivable (Piutang)
  const totalReceivables = filteredOrders.reduce((total, o) => total + o.sisaBayar, 0);

  // Sub-metrics
  const paidCount = filteredOrders.filter((o) => o.statusPembayaran === "Lunas").length;
  const dpCount = filteredOrders.filter((o) => o.statusPembayaran === "DP").length;
  const unpaidCount = filteredOrders.filter((o) => o.statusPembayaran === "Belum Bayar").length;

  const totalDpReceived = filteredOrders.reduce((total, o) => total + (o.statusPembayaran === "DP" ? o.dp : 0), 0);

  // Trigger JSON Backup
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `griya_selaras_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleExportCsv = () => {
    downloadCsv(filteredOrders, `laporan_keuangan_griya_selaras_${filter}_${todayStr}.csv`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200">
        <div>
          <h2 className="text-2xl font-bold text-stone-950">Rekap & Keuangan</h2>
          <p className="text-xs text-stone-500 mt-1">
            Pantau ringkasan pemasukan jahit Griya Selaras sederhana
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-xl">
          {(["hari_ini", "minggu_ini", "bulan_ini", "semua"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all capitalize select-none ${
                filter === opt
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {opt.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main financial cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Total Received */}
        <div className="bg-stone-900 p-6 rounded-2xl text-stone-100 border border-stone-800 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <TrendingUp className="w-40 h-40" />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase">Pemasukan Masuk (Terbayar)</h4>
            <div className="p-1.5 bg-stone-800 rounded-lg text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <span className="text-3xl font-black font-sans leading-none">
              {formatRupiah(totalReceipts)}
            </span>
            <p className="text-2xs text-stone-400 pt-1 leading-normal">
              Gabungan pembayaran Lunas dan nilai DP yang sudah diterima di saringan filter ini.
            </p>
          </div>
        </div>

        {/* Card: Total Outstanding (Piutang) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-500 tracking-wider uppercase">Piutang / Tagihan Belum Dibayar</h4>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <span className="text-3xl font-black font-sans text-stone-900 leading-none block">
              {formatRupiah(totalReceivables)}
            </span>
            <p className="text-2xs text-stone-400 pt-1 leading-normal">
              Jumlah sisa pembayaran dari pesanan berstatus DP atau Belum Bayar.
            </p>
          </div>
        </div>
      </div>

      {/* Payment details subcards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
        <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
          <span className="text-2xs font-medium text-stone-400 block">Pesanan Lunas</span>
          <p className="text-xl font-extrabold text-stone-800 block leading-none">{paidCount} pcs</p>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
          <span className="text-2xs font-medium text-stone-400 block">Pesanan DP</span>
          <p className="text-xl font-extrabold text-stone-850 block leading-none">{dpCount} pcs</p>
          <span className="text-3xs text-amber-600 font-bold block">{formatRupiah(totalDpReceived)} DP</span>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
          <span className="text-2xs font-medium text-stone-400 block">Belum Bayar</span>
          <p className="text-xl font-extrabold text-stone-850 block leading-none">{unpaidCount} pcs</p>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl space-y-1 col-span-2 sm:col-span-1">
          <span className="text-2xs font-medium text-stone-400 block">Total Transaksi</span>
          <p className="text-xl font-extrabold text-stone-850 block leading-none">{filteredOrders.length} pcs</p>
        </div>
      </div>

      {/* Data export controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleExportCsv}
          disabled={filteredOrders.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-750 text-white font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4 text-amber-500" />
          <span>Export Excel / CSV</span>
        </button>

        <button
          onClick={handleExportJson}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 text-stone-700 font-extrabold text-xs rounded-xl hover:bg-stone-100 transition shadow-3xs"
        >
          <FileJson className="w-4 h-4 text-indigo-500" />
          <span>Simpan Salinan Cadangan (JSON)</span>
        </button>
      </div>

      {/* Transactions listing */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-stone-900">Rincian Transaksi Saringan Ini</h3>

        {/* Table for large devices, Stack cards for mobile */}
        <div className="block lg:hidden space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-400 text-sm">
              Tidak ada riwayat dana masuk di filter ini.
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div key={o.id} className="bg-white p-3.5 rounded-xl border border-stone-150 text-xs space-y-2">
                <div className="flex justify-between font-mono text-3xs font-bold text-stone-400">
                  <span>{o.id}</span>
                  <span>{o.tanggalMasuk}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-stone-950 text-sm">{o.namaCustomer}</p>
                    <p className="text-3xs text-stone-500 mt-0.5">{o.jenisLayanan}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-stone-900">{formatRupiah(o.harga)}</p>
                    {o.dp > 0 && <p className="text-3xs text-indigo-600 font-bold">DP: {formatRupiah(o.dp)}</p>}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-50">
                  <StatusBadge type="pembayaran" status={o.statusPembayaran} />
                  <span className="text-3xs font-medium text-stone-400">
                    Sisa: <span className="font-mono text-stone-700 font-bold">{formatRupiah(o.sisaBayar)}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-2xs font-extrabold">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Jenis Layanan</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Biaya (Rp)</th>
                <th className="py-3 px-4 text-right">DP Masuk (Rp)</th>
                <th className="py-3 px-4 text-right">Uang Masuk Real (Rp)</th>
                <th className="py-3 px-4 text-right">Sisa Tagih (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    Tidak ada riwayat transaksi keuangan pada saringan tanggal terpilih. 😊
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const realIn = calculateReceivedMoney(o);
                  return (
                    <tr key={o.id} className="hover:bg-stone-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-stone-400">{o.tanggalMasuk}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">{o.namaCustomer}</td>
                      <td className="py-3 px-4">{o.jenisLayanan}</td>
                      <td className="py-3 px-4">
                        <StatusBadge type="pembayaran" status={o.statusPembayaran} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{formatRupiah(o.harga)}</td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-600">{formatRupiah(o.dp)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold bg-emerald-50/30">{formatRupiah(realIn)}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">{formatRupiah(o.sisaBayar)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
