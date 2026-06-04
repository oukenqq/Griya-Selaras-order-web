import React from "react";
import { getStatusPembayaranStyle, getStatusPengerjaanStyle, StatusPembayaran, StatusPengerjaan } from "../data/statusOptions";

interface StatusBadgeProps {
  type: "pembayaran" | "pengerjaan" | "pengambilan";
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  if (type === "pembayaran") {
    const style = getStatusPembayaranStyle(status as StatusPembayaran);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
        {status}
      </span>
    );
  }
  
  if (type === "pengerjaan") {
    const style = getStatusPengerjaanStyle(status as StatusPengerjaan);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
        {status}
      </span>
    );
  }

  // Type is pengambilan
  const isTaken = status === "Sudah Diambil";
  const bg = isTaken ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
