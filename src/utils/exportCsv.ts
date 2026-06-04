import { Order } from "../types";

export const downloadCsv = (orders: Order[], fileName = "laporan_pesanan_griya_selaras.csv"): void => {
  const headers = [
    "ID Pesanan",
    "Tanggal Masuk",
    "Nama Customer",
    "Nomor WhatsApp",
    "Jenis Layanan",
    "Catatan Pesanan",
    "Harga (Rp)",
    "DP / Uang Muka (Rp)",
    "Sisa Bayar (Rp)",
    "Status Pembayaran",
    "Status Pengerjaan",
    "Estimasi Pengambilan",
    "Tanggal Selesai",
    "Status Pengambilan",
    "Catatan Owner",
  ];

  const rows = orders.map((o) => [
    o.id,
    o.tanggalMasuk,
    o.namaCustomer,
    o.nomorWhatsApp,
    o.jenisLayanan,
    o.catatanPesanan.replace(/\n/g, " "),
    o.harga,
    o.dp,
    o.sisaBayar,
    o.statusPembayaran,
    o.statusPengerjaan,
    o.estimasiTanggalPengambilan,
    o.tanggalSelesai || "-",
    o.statusPengambilan,
    o.catatanOwner.replace(/\n/g, " "),
  ]);

  // Convert to CSV string, handling quotes and semicolons/commas
  // Semicolon (;) is typically better for Excel default regional settings in Indonesia, but we'll use comma with quote escaping, or just clean values
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((val) => {
          const stringVal = String(val ?? "");
          // Escape quotes
          if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
