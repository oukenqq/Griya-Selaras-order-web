export const sanitizePhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return "";
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If starts with 0, replace with 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  
  // If it starts with 62, keep it. If anything else, assume indonesian if too short?
  // Mostly Indonesian numbers are 628...
  return cleaned;
};

export const getWhatsAppLink = (phone: string | undefined | null, text: string): string => {
  const sanitized = sanitizePhoneNumber(phone);
  if (!sanitized) return "";
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
};

export const getPesananSelesaiMsg = (customerName: string): string => {
  return `Halo Kak ${customerName}, pesanan jahit di Griya Selaras sudah selesai dan bisa diambil. Terima kasih. 🙏😊`;
};

export const getPengingatPengambilanMsg = (customerName: string): string => {
  return `Halo Kak ${customerName}, mengingatkan bahwa pesanan jahit di Griya Selaras sudah bisa diambil. Terima kasih. 🙏😊`;
};
