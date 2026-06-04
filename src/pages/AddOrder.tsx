import React, { useState, useEffect } from "react";
import { Order } from "../types";
import { ServiceConfig } from "../data/defaultServices";
import { STATUS_PEMBAYARAN_LIST, STATUS_PENGERJAAN_LIST, STATUS_PENGAMBILAN_LIST, StatusPembayaran, StatusPengerjaan, StatusPengambilan } from "../data/statusOptions";
import { getTodayDateString } from "../utils/dateUtils";
import { ArrowLeft, Save, Sparkles, X, Plus, Users, Calculator, Phone, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { formatRupiah } from "../utils/formatCurrency";

interface AddOrderProps {
  editOrder?: Order | null;
  services: ServiceConfig[];
  onSave: (orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export const AddOrder: React.FC<AddOrderProps> = ({
  editOrder,
  services,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    tanggalMasuk: getTodayDateString(),
    namaCustomer: "",
    nomorWhatsApp: "",
    jenisLayanan: services[0]?.name || "Permak Pakaian",
    catatanPesanan: "",
    harga: 0,
    dp: 0,
    statusPembayaran: "Belum Bayar" as StatusPembayaran,
    statusPengerjaan: "Pesanan Masuk" as StatusPengerjaan,
    estimasiTanggalPengambilan: "",
    tanggalSelesai: "",
    statusPengambilan: "Belum Diambil" as StatusPengambilan,
    catatanOwner: "",
  });

  const [notification, setNotification] = useState<string | null>(null);

  // If in edit mode, populate data
  useEffect(() => {
    if (editOrder) {
      setFormData({
        tanggalMasuk: editOrder.tanggalMasuk,
        namaCustomer: editOrder.namaCustomer,
        nomorWhatsApp: editOrder.nomorWhatsApp,
        jenisLayanan: editOrder.jenisLayanan,
        catatanPesanan: editOrder.catatanPesanan,
        harga: editOrder.harga,
        dp: editOrder.dp,
        statusPembayaran: editOrder.statusPembayaran,
        statusPengerjaan: editOrder.statusPengerjaan,
        estimasiTanggalPengambilan: editOrder.estimasiTanggalPengambilan,
        tanggalSelesai: editOrder.tanggalSelesai || "",
        statusPengambilan: editOrder.statusPengambilan,
        catatanOwner: editOrder.catatanOwner || "",
      });
    } else {
      // Set default estimasi pickup date based on selected service estimatedDays
      const currentSvc = services.find((s) => s.name === formData.jenisLayanan);
      if (currentSvc) {
        const estDays = currentSvc.estimatedDays;
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + estDays);
        setFormData((prev) => ({
          ...prev,
          estimasiTanggalPengambilan: defaultDate.toISOString().split("T")[0],
        }));
      } else {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 5); // Fallback 5 days
        setFormData((prev) => ({
          ...prev,
          estimasiTanggalPengambilan: defaultDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [editOrder, services]);

  // Handle changing service -> Auto-populate default price and estimasi date (if creating, not editing)
  const handleServiceChange = (svcName: string) => {
    const selectedSvc = services.find((s) => s.name === svcName);
    if (!selectedSvc) return;

    const changes: Partial<typeof formData> = { jenisLayanan: svcName };

    // Fill in values if NOT editing
    if (!editOrder) {
      // Let's use the average of PriceMin and PriceMax as starter price
      const avgPrice = Math.round((selectedSvc.defaultPriceMin + selectedSvc.defaultPriceMax) / 2);
      changes.harga = avgPrice;

      // Also set estimated completion date
      const estDays = selectedSvc.estimatedDays;
      const targetDate = new Date(formData.tanggalMasuk);
      targetDate.setDate(targetDate.getDate() + estDays);
      changes.estimasiTanggalPengambilan = targetDate.toISOString().split("T")[0];
    }

    setFormData((prev) => ({ ...prev, ...changes }));
  };

  // Change tanggalMasuk -> update estimasi date accordingly (if creating)
  const handleTanggalMasukChange = (dateVal: string) => {
    const selectedSvc = services.find((s) => s.name === formData.jenisLayanan);
    const estDays = selectedSvc ? selectedSvc.estimatedDays : 5;
    
    const changes: Partial<typeof formData> = { tanggalMasuk: dateVal };
    
    if (!editOrder) {
      const targetDate = new Date(dateVal);
      targetDate.setDate(targetDate.getDate() + estDays);
      changes.estimasiTanggalPengambilan = targetDate.toISOString().split("T")[0];
    }
    
    setFormData((prev) => ({ ...prev, ...changes }));
  };

  // Auto-calculated fields and payment status rules on price/DP change
  const sisaBayar = Math.max(0, formData.harga - formData.dp);

  // Auto handle payment status dropdown triggers on price or DP modifications
  const handlePriceOrDpChange = (field: "harga" | "dp", value: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Calculate sisa
      const priceVal = updated.harga;
      const dpVal = updated.dp;
      let calculatedStatus = prev.statusPembayaran;

      if (dpVal === 0 && priceVal > 0) {
        calculatedStatus = "Belum Bayar";
      } else if (dpVal > 0 && dpVal < priceVal) {
        calculatedStatus = "DP";
      } else if (dpVal >= priceVal && priceVal > 0) {
        calculatedStatus = "Lunas";
      }

      return {
        ...updated,
        statusPembayaran: calculatedStatus,
      };
    });
  };

  const handleStatusPengerjaanChange = (val: StatusPengerjaan) => {
    // If status pengerjaan is marked as "Selesai" or "Sudah Diambil", auto-populate tanggalSelesai to today
    const changes: Partial<typeof formData> = { statusPengerjaan: val };
    
    if (val === "Selesai" || val === "Sudah Diambil") {
      changes.tanggalSelesai = getTodayDateString();
    }
    if (val === "Sudah Diambil") {
      changes.statusPengambilan = "Sudah Diambil";
    }

    setFormData((prev) => ({ ...prev, ...changes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaCustomer.trim()) {
      alert("Nama Pelanggan wajib diisi!");
      return;
    }

    // Call onSave function
    onSave(formData);
    
    setNotification("Pesanan berhasil disimpan.");
    
    // Clear notification after 1.5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 1500);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top action header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 border border-stone-200 bg-white rounded-xl text-stone-700 hover:bg-stone-50 transition-all font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-stone-950">
            {editOrder ? "Edit Data Pesanan" : "Tambah Pesanan Jahit"}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {editOrder ? `Mengubah data pesanan ${editOrder.id}` : "Catat pesanan jahitan pelanggan baru"}
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{notification}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setNotification(null)} />
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Customer Profile */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 text-stone-800 font-bold border-b border-stone-100 pb-2 text-sm">
            <Users className="w-4.5 h-4.5 text-copper" />
            <span>Informasi Pelanggan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal Masuk */}
            <div className="space-y-1.5Col">
              <label className="block text-xs font-bold text-stone-700">
                Tanggal Masuk <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.tanggalMasuk}
                onChange={(e) => handleTanggalMasukChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Nama Customer */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-stone-700">
                Nama Customer / Pelanggan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap pelanggan"
                value={formData.namaCustomer}
                onChange={(e) => setFormData({ ...formData, namaCustomer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700">
                Nomor WhatsApp <span className="text-2xs text-stone-400">(Sangat disarankan untuk notifikasi)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold font-mono text-sm">
                  +62
                </div>
                <input
                  type="tel"
                  placeholder="8XXXXXXXX (Contoh: 812345678)"
                  value={formData.nomorWhatsApp.startsWith("62") ? formData.nomorWhatsApp.substring(2) : formData.nomorWhatsApp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    // Add standard 62 prefix on save, but display cleanly here
                    setFormData({ ...formData, nomorWhatsApp: cleaned ? "62" + cleaned : "" });
                  }}
                  className="w-full pl-12 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Order Detail and Sizes */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 text-stone-800 font-bold border-b border-stone-100 pb-2 text-sm">
            <Sparkles className="w-4.5 h-4.5 text-copper" />
            <span>Jenis Layanan & Catatan Jahitan</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Jenis Layanan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Jenis Layanan Jahit</label>
              <select
                value={formData.jenisLayanan}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-medium"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.name}>
                    {svc.name} (Estimasi {svc.estimatedDays} hari)
                  </option>
                ))}
              </select>
            </div>

            {/* Catatan detail / Ukuran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Detail Pesanan & Catatan Ukuran</label>
              <textarea
                rows={4}
                placeholder="Tulis detail ukuran baju (LD, Lp, Pj Lengan, Pj Baju), model pakaian, permintaan payet, warna benang, atau catatan khusus lainnya..."
                value={formData.catatanPesanan}
                onChange={(e) => setFormData({ ...formData, catatanPesanan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Finance input */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 text-stone-800 font-bold border-b border-stone-100 pb-2 text-sm">
            <Calculator className="w-4.5 h-4.5 text-copper" />
            <span>Biaya & Pembayaran</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Harga */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Harga Jahit / Total Biaya (Rp)</label>
              <input
                type="number"
                min="0"
                value={formData.harga || ""}
                onChange={(e) => handlePriceOrDpChange("harga", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-bold font-mono"
              />
              <span className="text-3xs text-stone-400 block font-mono">{formatRupiah(formData.harga)}</span>
            </div>

            {/* DP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">DP masuk / Uang Muka (Rp)</label>
              <input
                type="number"
                min="0"
                value={formData.dp || ""}
                onChange={(e) => handlePriceOrDpChange("dp", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-bold font-mono"
              />
              <span className="text-3xs text-stone-400 block font-mono">{formatRupiah(formData.dp)}</span>
            </div>

            {/* Sisa bayar (auto calculated) */}
            <div className="space-y-1.5 bg-stone-50/60 p-3.5 rounded-xl border border-stone-100/60">
              <label className="block text-3xs font-semibold text-stone-500 uppercase tracking-wide">Sisa Tagihan</label>
              <span className="text-base font-extrabold text-stone-805 block font-mono mt-1">
                {formatRupiah(sisaBayar)}
              </span>
              <span className="text-3xs text-stone-400">Dihitung otomatis (Harga - DP)</span>
            </div>

            {/* Status Pembayaran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Status Pembayaran</label>
              <select
                value={formData.statusPembayaran}
                onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value as StatusPembayaran })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-semibold"
              >
                {STATUS_PEMBAYARAN_LIST.map((pb) => (
                  <option key={pb} value={pb}>
                    {pb}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Operational Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 text-stone-800 font-bold border-b border-stone-100 pb-2 text-sm">
            <Calendar className="w-4.5 h-4.5 text-copper" />
            <span>Estimasi & Status Operasional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Pengerjaan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Status Pengerjaan</label>
              <select
                value={formData.statusPengerjaan}
                onChange={(e) => handleStatusPengerjaanChange(e.target.value as StatusPengerjaan)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-semibold"
              >
                {STATUS_PENGERJAAN_LIST.map((pj) => (
                  <option key={pj} value={pj}>
                    {pj}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimasi Tanggal Ambil */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Estimasi Tanggal Pengambilan</label>
              <input
                type="date"
                required
                value={formData.estimasiTanggalPengambilan}
                onChange={(e) => setFormData({ ...formData, estimasiTanggalPengambilan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-medium"
              />
            </div>

            {/* Status Pengambilan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Status Pengambilan</label>
              <select
                value={formData.statusPengambilan}
                onChange={(e) => setFormData({ ...formData, statusPengambilan: e.target.value as StatusPengambilan })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-medium"
              >
                {STATUS_PENGAMBILAN_LIST.map((pa) => (
                  <option key={pa} value={pa}>
                    {pa}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Tanggal Selesai (Boleh kosong)</label>
              <input
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Catatan Owner / Internal */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">Catatan Internal / Keterangan Owner</label>
              <input
                type="text"
                placeholder="Misal: Kain sisa ditaruh plastik terpisah, furing katun hero sisa diletakkan di lemari."
                value={formData.catatanOwner}
                onChange={(e) => setFormData({ ...formData, catatanOwner: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Submission Bottom Actions - Inline list above the bottom navigation bar to avoid overlaying on mobile */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-stone-200/60 mt-6 font-bold z-10">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 md:w-auto py-3.5 px-6 rounded-xl text-sm font-bold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-all active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="submit"
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 py-3.5 px-8 bg-stone-900 hover:bg-stone-850 rounded-xl text-sm font-extrabold text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4.5 h-4.5 text-amber-500" />
            <span>Simpan Pesanan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
