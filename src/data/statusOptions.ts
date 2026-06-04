export type StatusPengerjaan = "Pesanan Masuk" | "Sedang Dikerjakan" | "Selesai" | "Sudah Diambil" | "Batal";
export type StatusPembayaran = "Belum Bayar" | "DP" | "Lunas";
export type StatusPengambilan = "Belum Diambil" | "Sudah Diambil";

export const STATUS_PENGERJAAN_LIST: StatusPengerjaan[] = [
  "Pesanan Masuk",
  "Sedang Dikerjakan",
  "Selesai",
  "Sudah Diambil",
  "Batal"
];

export const STATUS_PEMBAYARAN_LIST: StatusPembayaran[] = [
  "Belum Bayar",
  "DP",
  "Lunas"
];

export const STATUS_PENGAMBILAN_LIST: StatusPengambilan[] = [
  "Belum Diambil",
  "Sudah Diambil"
];

export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
}

export const getStatusPengerjaanStyle = (status: StatusPengerjaan): StatusStyle => {
  switch (status) {
    case "Pesanan Masuk":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-300"
      };
    case "Sedang Dikerjakan":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-300"
      };
    case "Selesai":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-300"
      };
    case "Sudah Diambil":
      return {
        bg: "bg-green-100/80",
        text: "text-green-800",
        border: "border-green-400"
      };
    case "Batal":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300"
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200"
      };
  }
};

export const getStatusPembayaranStyle = (status: StatusPembayaran): StatusStyle => {
  switch (status) {
    case "Belum Bayar":
      return {
        bg: "bg-rose-100",
        text: "text-rose-700",
        border: "border-rose-300"
      };
    case "DP":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-300"
      };
    case "Lunas":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-300"
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200"
      };
  }
};
