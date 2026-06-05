import React, { useState } from "react";
import { Order } from "../types";
import { formatOrderId } from "../utils/supabaseService";
import { formatRupiah } from "../utils/formatCurrency";
import { formatIndonesianDate, isDatePassed } from "../utils/dateUtils";
import { StatusBadge } from "../components/StatusBadge";
import { getPesananSelesaiMsg, getPengingatPengambilanMsg, getWhatsAppLink } from "../utils/whatsappLink";
import { ConfirmModal } from "../components/ConfirmModal";
import { 
  ArrowLeft, Edit, CheckCircle2, PackageCheck, Receipt, Trash2, Send, 
  Phone, Calendar, ClipboardList, Scissors, FileText, AlertTriangle 
} from "lucide-react";
import { motion } from "motion/react";

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onEdit: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, updates: Partial<Order>) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onBack,
  onEdit,
  onDeleteOrder,
  onUpdateStatus,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isLate = order.statusPengerjaan !== "Selesai" && order.statusPengambilan !== "Sudah Diambil" && isDatePassed(order.estimasiTanggalPengambilan);

  // Quick Action triggers
  const handleMarkAsReady = () => {
    onUpdateStatus(order.id, {
      statusPengerjaan: "Selesai",
      tanggalSelesai: new Date().toISOString().split("T")[0],
    });
  };

  const handleMarkAsTaken = () => {
    onUpdateStatus(order.id, {
      statusPengerjaan: "Sudah Diambil",
      statusPengambilan: "Sudah Diambil",
      tanggalSelesai: order.tanggalSelesai || new Date().toISOString().split("T")[0],
    });
  };

  const handleMarkAsPaid = () => {
    onUpdateStatus(order.id, {
      statusPembayaran: "Lunas",
      dp: order.harga, // Full payment
    });
  };

  // WhatsApp Trigger helpers
  const handleSendReadyWhatsApp = () => {
    if (!order.nomorWhatsApp) return;
    const msg = getPesananSelesaiMsg(order.namaCustomer);
    const link = getWhatsAppLink(order.nomorWhatsApp, msg);
    window.open(link, "_blank");
  };

  const handleSendReminderWhatsApp = () => {
    if (!order.nomorWhatsApp) return;
    const msg = getPengingatPengambilanMsg(order.namaCustomer);
    const link = getWhatsAppLink(order.nomorWhatsApp, msg);
    window.open(link, "_blank");
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-stone-200 bg-white rounded-xl text-stone-700 hover:bg-stone-50 transition-all font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-stone-400 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg">
                {formatOrderId(order.id)}
              </span>
              <h2 className="text-xl font-bold text-stone-950">Detail Pesanan</h2>
            </div>
            <p className="text-3xs text-stone-500 font-mono mt-0.5">
              Terakhir diubah: {new Date(order.updatedAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Edit order */}
        <button
          onClick={() => onEdit(order.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-xl text-xs font-extrabold text-stone-700 transition"
        >
          <Edit className="w-3.5 h-3.5 text-copper" />
          <span>Ubah</span>
        </button>
      </div>

      {isLate && (
        <span className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-red-800 leading-relaxed font-semibold">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Estimasi pengambilan sudah lewat!</span> Pesanan ini dijadwalkan selesai tanggal {formatIndonesianDate(order.estimasiTanggalPengambilan)}, harap segera ubah status pengerjaan atau panggil pelanggan jika sudah selesai.
          </div>
        </span>
      )}

      {/* Main detail card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Client, service, sizes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card: Client profile */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <Scissors className="w-4.5 h-4.5 text-copper" />
              <span>Detail Pelanggan & Layanan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-stone-400 font-medium">Nama Pelanggan</span>
                <p className="font-bold text-stone-900 text-base">{order.namaCustomer}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-stone-400 font-medium">Nomor WhatsApp</span>
                {order.nomorWhatsApp ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-stone-905">{order.nomorWhatsApp}</span>
                    <a
                      href={getWhatsAppLink(order.nomorWhatsApp, "Halo Kak...")}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-lg transition"
                      title="Kirim Pesan WA Manual"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">Tidak ada nomor WhatsApp</p>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-stone-400 font-medium">Jenis Layanan</span>
                <p className="font-bold text-stone-800">{order.jenisLayanan}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-stone-400 font-medium">Tanggal Masuk</span>
                <p className="font-medium text-stone-800">{formatIndonesianDate(order.tanggalMasuk)}</p>
              </div>
            </div>
          </div>

          {/* Card: Notes & Sizes */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-1.5 flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-copper" />
              <span>Model & Informasi Jahitan</span>
            </h3>

            {order.ukuran && (
              <div className="space-y-1 bg-amber-500/5 p-3.5 border border-amber-500/10 rounded-xl">
                <span className="text-3xs font-extrabold uppercase tracking-widest text-amber-600 block">Ukuran Baju / Celana:</span>
                <p className="text-stone-900 font-bold text-sm leading-relaxed">{order.ukuran}</p>
              </div>
            )}

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100/60">
              <span className="text-3xs font-extrabold uppercase tracking-widest text-stone-450 block mb-1.5">Detail & Catatan Tambahan:</span>
              {order.catatanPesanan ? (
                <p className="text-stone-805 text-xs/relaxed whitespace-pre-wrap">{order.catatanPesanan}</p>
              ) : (
                <p className="text-stone-400 text-xs italic">Tidak ada catatan bentuk jahitan tambahan.</p>
              )}
            </div>

            {order.catatanOwner && (
              <div className="mt-4 pt-3 border-t border-stone-100">
                <span className="text-2xs font-extrabold uppercase tracking-wide text-stone-400 block mb-1">Catatan Internal Owner / Syuhada:</span>
                <p className="text-stone-600 text-xs leading-relaxed italic">{order.catatanOwner}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status info & actionable tools */}
        <div className="space-y-4">
          {/* Card: Status operational detail */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <PackageCheck className="w-4.5 h-4.5 text-copper" />
              <span>Status Operasional</span>
            </h3>

            <div className="space-y-3.5 text-xs text-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-stone-450 font-medium">Pembuatan Baju:</span>
                <StatusBadge type="pengerjaan" status={order.statusPengerjaan} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-450 font-medium">Pembayaran Tagihan:</span>
                <StatusBadge type="pembayaran" status={order.statusPembayaran} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-450 font-medium">Pengambilan Customer:</span>
                <StatusBadge type="pengambilan" status={order.statusPengambilan} />
              </div>

              <hr className="border-stone-100" />

              <div className="flex items-center justify-between">
                <span className="text-stone-450 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Estimasi Ambil:</span>
                </span>
                <span className="font-extrabold text-stone-900">
                  {formatIndonesianDate(order.estimasiTanggalPengambilan).split(", ")[1] || order.estimasiTanggalPengambilan}
                </span>
              </div>

              {order.tanggalSelesai && (
                <div className="flex items-center justify-between text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 mt-1">
                  <span>Tanggal Selesai Real:</span>
                  <span className="font-bold">{formatIndonesianDate(order.tanggalSelesai).split(", ")[1] || order.tanggalSelesai}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Financial review */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <Receipt className="w-4.5 h-4.5 text-copper" />
              <span>Rincian Biaya</span>
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-stone-500 text-xs">
                <span>Total Harga Jahit:</span>
                <span className="font-mono font-bold text-stone-800">{formatRupiah(order.harga)}</span>
              </div>

              <div className="flex justify-between text-stone-500 text-xs text-indigo-700">
                <span>DP / Uang Muka Masuk:</span>
                <span className="font-mono font-bold">{formatRupiah(order.dp)}</span>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
                <span className="text-stone-800 font-bold">Sisa Tagihan:</span>
                <span className={`font-mono text-base font-black ${order.sisaBayar > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {formatRupiah(order.sisaBayar)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK QUICK WORK ACTIONS ROW */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
        <h3 className="text-sm font-black text-stone-950 flex items-center gap-2">
          <span>⚡ Aksi Cepat Operasional</span>
          <span className="text-3xs font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">Tinggal Klik</span>
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Action: Tandai Selesai */}
          <button
            onClick={handleMarkAsReady}
            disabled={order.statusPengerjaan === "Selesai" || order.statusPengerjaan === "Sudah Diambil"}
            className="flex flex-col items-center justify-center p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl transition text-center disabled:opacity-50 disabled:pointer-events-none gap-2 font-bold"
          >
            <CheckCircle2 className="w-6 h-6 text-amber-600" />
            <span className="text-xs">Tandai Selesai</span>
          </button>

          {/* Action: Tandai Sudah Diambil */}
          <button
            onClick={handleMarkAsTaken}
            disabled={order.statusPengambilan === "Sudah Diambil"}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-55 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 rounded-xl transition text-center disabled:opacity-50 disabled:pointer-events-none gap-2 font-bold"
          >
            <PackageCheck className="w-6 h-6 text-green-600" />
            <span className="text-xs">Udah Diambil</span>
          </button>

          {/* Action: Tandai Lunas */}
          <button
            onClick={handleMarkAsPaid}
            disabled={order.statusPembayaran === "Lunas"}
            className="flex flex-col items-center justify-center p-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl transition text-center col-span-2 sm:col-span-1 disabled:opacity-50 disabled:pointer-events-none gap-2 font-bold"
          >
            <Receipt className="w-6 h-6 text-blue-600" />
            <span className="text-xs">Tandai Lunas</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP COMMUNICATIONS ACTION MODULE */}
      {order.nomorWhatsApp && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <Send className="w-4.5 h-4.5" />
            <span>Kirim Pesan WhatsApp Otomatis ke Customer</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Template Selesai */}
            <div className="border border-stone-200 p-4 rounded-xl hover:border-emerald-500/60 transition bg-stone-50/50 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-2xs font-bold text-indigo-700 uppercase tracking-widest">Pemberitahuan Jahitan Jadi</span>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 italic">
                  &quot;Halo Kak {order.namaCustomer}, pesanan jahit di Griya Selaras sudah selesai...&quot;
                </p>
              </div>
              <button
                onClick={handleSendReadyWhatsApp}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA: Kabari Selesai</span>
              </button>
            </div>

            {/* Template Pengingat */}
            <div className="border border-stone-200 p-4 rounded-xl hover:border-emerald-500/60 transition bg-stone-50/50 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-2xs font-bold text-amber-700 uppercase tracking-widest">Pengingat Pengambilan</span>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 italic">
                  &quot;Halo Kak {order.namaCustomer}, mengingatkan bahwa pesanan jahit sudah bisa diambil...&quot;
                </p>
              </div>
              <button
                onClick={handleSendReminderWhatsApp}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Kirim WA: Ingatkan Ambil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CRITICAL ACTION */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between text-sm">
        <span className="text-stone-500 font-medium text-xs">Penting: Data yang dihapus tidak bisa dikembalikan.</span>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 font-bold border border-red-200 rounded-xl text-xs transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeleteOrder(order.id);
          onBack();
        }}
        title="Hapus Pesanan?"
        message={`Apakah Anda benar-benar yakin ingin menghapus pesanan atas nama "${order.namaCustomer}" (${formatOrderId(order.id)})? Tindakan ini menghapus data selamanya.`}
        confirmText="Ya, Hapus Saja"
        cancelText="Batal/Kembali"
      />
    </div>
  );
};
