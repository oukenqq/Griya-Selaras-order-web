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
    const isTaken = status === "Sudah Diambil";
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        {isTaken ? (
          <svg className="w-3 h-3 text-green-700 mr-1 shrink-0 bg-current/10 p-0.5 rounded-full" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
        )}
        {status}
      </span>
    );
  }

  // Type is pengambilan
  const isTaken = status === "Sudah Diambil";
  const bg = isTaken ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      {isTaken ? (
        <svg className="w-3 h-3 text-emerald-700 mr-1 shrink-0 bg-current/10 p-0.5 rounded-full" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      )}
      {status}
    </span>
  );
};
