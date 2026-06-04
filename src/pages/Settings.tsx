import React, { useState } from "react";
import { UMKMProfile } from "../types";
import { ServiceConfig } from "../data/defaultServices";
import { ConfirmModal } from "../components/ConfirmModal";
import { 
  Building, Scissors, RefreshCw, Trash2, Save, Plus, Upload, 
  Download, Sparkles, Check, AlertTriangle, AlertCircle 
} from "lucide-react";
import { formatRupiah } from "../utils/formatCurrency";

interface SettingsProps {
  profile: UMKMProfile;
  services: ServiceConfig[];
  onSaveProfile: (profile: UMKMProfile) => void;
  onSaveServices: (services: ServiceConfig[]) => void;
  onClearAllData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  profile,
  services,
  onSaveProfile,
  onSaveServices,
  onClearAllData,
}) => {
  // Local state for profile inputs
  const [profileForm, setProfileForm] = useState({ ...profile });
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // Local state for services lists
  const [servicesList, setServicesList] = useState<ServiceConfig[]>([...services]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState<Omit<ServiceConfig, "id">>({
    name: "",
    defaultPriceMin: 0,
    defaultPriceMax: 0,
    estimatedDays: 5,
  });
  const [saveServicesSuccess, setSaveServicesSuccess] = useState(false);

  // Database triggers
  const [isDeleteDbModalOpen, setIsDeleteDbModalOpen] = useState(false);
  const [fileRestoreError, setFileRestoreError] = useState<string | null>(null);
  const [fileRestoreSuccess, setFileRestoreSuccess] = useState(false);

  // Submit profile edit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    setSaveProfileSuccess(true);
    setTimeout(() => setSaveProfileSuccess(false), 2000);
  };

  // Submit custom service addition
  const handleAddNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;

    const added: ServiceConfig = {
      id: `svc-${Date.now()}`,
      name: newService.name.trim(),
      defaultPriceMin: newService.defaultPriceMin,
      defaultPriceMax: newService.defaultPriceMax,
      estimatedDays: newService.estimatedDays,
    };

    const updated = [...servicesList, added];
    setServicesList(updated);
    onSaveServices(updated);
    
    // Clear form
    setNewService({
      name: "",
      defaultPriceMin: 0,
      defaultPriceMax: 0,
      estimatedDays: 5,
    });
    setShowAddService(false);
    
    setSaveServicesSuccess(true);
    setTimeout(() => setSaveServicesSuccess(false), 2000);
  };

  // Delete service callback
  const handleDeleteService = (svcId: string) => {
    const updated = servicesList.filter((s) => s.id !== svcId);
    setServicesList(updated);
    onSaveServices(updated);

    setSaveServicesSuccess(true);
    setTimeout(() => setSaveServicesSuccess(false), 2000);
  };

  // Update inline value of service estimates / boundaries
  const handleUpdateInlineService = (svcId: string, updates: Partial<ServiceConfig>) => {
    const updated = servicesList.map((s) => {
      if (s.id === svcId) {
        return { ...s, ...updates };
      }
      return s;
    });
    setServicesList(updated);
    onSaveServices(updated);
  };

  // File restored logic
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Simple sanity check
        if (parsed.griya_selaras_orders || parsed.griya_selaras_profile) {
          // Commit parsed items back in
          Object.keys(parsed).forEach((key) => {
            localStorage.setItem(key, parsed[key]);
          });
          setFileRestoreSuccess(true);
          setFileRestoreError(null);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setFileRestoreError("Format file tidak valid. Pastikan itu berkas backup Griya Selaras.");
        }
      } catch (err) {
        setFileRestoreError("Gagal membaca file backup. Pastikan file dalam format JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Easy JSON downloader for backups
  const handleExportJson = () => {
    const today = new Date().toISOString().split("T")[0];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `griya_selaras_full_backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-stone-950">Pengaturan</h2>
        <p className="text-xs text-stone-500 mt-1">
          Atur profil usaha jahit, daftar tarif layanan, dan manajemen data cadangan.
        </p>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Profile Settings */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
            <Building className="w-4.5 h-4.5 text-copper" />
            <span>Profil Usaha Jahit</span>
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Nama Usaha</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Pemilik Utama</label>
                <input
                  type="text"
                  value={profileForm.owner}
                  onChange={(e) => setProfileForm({ ...profileForm, owner: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Alamat Workshop</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Nomor WhatsApp Usaha</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveProfileSuccess ? (
                <span className="text-2xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Profil tersimpan</span>
                </span>
              ) : (
                <div />
              )}
              <button
                type="submit"
                className="flex items-center gap-1 py-2 px-4 bg-stone-900 hover:bg-stone-850 text-stone-100 font-bold rounded-lg text-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backup settings and data restore */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
            <RefreshCw className="w-4.5 h-4.5 text-copper" />
            <span>Manajemen & Cadangan Data</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 space-y-2.5">
              <span className="font-bold text-stone-800 flex items-center gap-1 text-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Semua Data Aman di HP</span>
              </span>
              <p className="text-stone-500 leading-relaxed text-2xs">
                Saat ini data pesanan Anda disimpan secara lokal di memori internet browser HP ini. Agar aman jika HP rusak atau ganti HP, simpan salinan cadangannya secara berkala.
              </p>
            </div>

            {fileRestoreSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-xl leading-normal text-2xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Berhasil memulihkan data backup! Website akan dimuat ulang...</span>
              </div>
            )}

            {fileRestoreError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl leading-normal text-2xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{fileRestoreError}</span>
              </div>
            )}

            {/* Actions list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-stone-250 hover:bg-stone-55 text-stone-700 bg-white font-bold rounded-xl transition"
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <span className="text-xs">Ekspor Backup JSON</span>
              </button>

              <label className="flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-stone-300 hover:border-indigo-500 hover:bg-indigo-50/20 text-stone-700 bg-stone-50/30 font-bold rounded-xl transition cursor-pointer text-center">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span className="text-xs">Impor Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset critical block */}
            <div className="pt-4 border-t border-stone-100 flex flex-col justify-between p-3 bg-red-50/40 rounded-xl border border-red-100">
              <span className="text-2xs font-bold text-red-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Zona Bahaya</span>
              </span>
              <p className="text-red-700 font-medium text-3xs leading-relaxed mt-1 mb-3">
                Menghapus seluruh pesanan, data layanan, dan profil usaha dari perangkat ini. Silakan ekspor data Anda terlebih dahulu jika ragu.
              </p>
              <button
                onClick={() => setIsDeleteDbModalOpen(true)}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 font-extrabold text-white text-xs rounded-xl shadow-sm transition-all"
              >
                Hapus Semua Data Aplikasi
              </button>
            </div>
          </div>
        </div>

        {/* Data Layanan / Services settings */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Scissors className="w-4.5 h-4.5 text-copper" />
              <span>Daftar Tarif Layanan Jahit & Estimasi Waktu</span>
            </h3>
            
            <button
              onClick={() => setShowAddService(!showAddService)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-2xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Layanan</span>
            </button>
          </div>

          {/* Form ADD custom service */}
          {showAddService && (
            <form onSubmit={handleAddNewService} className="bg-stone-50 p-4 rounded-xl border border-stone-150 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-stone-700">Nama Layanan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Jahit Jas Pria"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-250 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700">Tarif Atas (Min Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={newService.defaultPriceMin || ""}
                  onChange={(e) => setNewService({ ...newService, defaultPriceMin: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2 bg-white border border-stone-250 rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700">Tarif Bawah (Max Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={newService.defaultPriceMax || ""}
                  onChange={(e) => setNewService({ ...newService, defaultPriceMax: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2 bg-white border border-stone-250 rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700">Estimasi Waktu (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={newService.estimatedDays}
                    onChange={(e) => setNewService({ ...newService, estimatedDays: parseInt(e.target.value, 10) || 5 })}
                    className="w-full p-2 bg-white border border-stone-250 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-2 px-3 bg-stone-900 hover:bg-stone-850 text-white font-bold rounded-lg text-xs text-center"
                >
                  Simpan Layanan Baru
                </button>
              </div>
            </form>
          )}

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {servicesList.map((svc) => (
              <div key={svc.id} className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:border-amber-400/40 relative group space-y-3">
                {/* Delete service */}
                <button
                  onClick={() => handleDeleteService(svc.id)}
                  className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-red-600 rounded-lg bg-white/70 hover:bg-red-50 border border-stone-100 md:opacity-0 md:group-hover:opacity-100 transition"
                  title="Hapus Layanan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-0.5 pr-6">
                  <h4 className="font-bold text-stone-900 text-sm">{svc.name}</h4>
                  <span className="text-[10px] text-stone-450 block">Estimasi Pembuatan</span>
                </div>

                {/* Inline adjustments info */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-100 text-[11px] text-stone-750">
                  {/* Estimasi days */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">Waktu (Hari)</span>
                    <input
                      type="number"
                      min="1"
                      value={svc.estimatedDays}
                      onChange={(e) => handleUpdateInlineService(svc.id, { estimatedDays: parseInt(e.target.value, 10) || 5 })}
                      className="w-full bg-white border border-stone-200 rounded p-1 text-center font-mono font-bold font-sans"
                    />
                  </div>

                  {/* Min price */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">Harga Min</span>
                    <input
                      type="number"
                      min="0"
                      value={svc.defaultPriceMin}
                      onChange={(e) => handleUpdateInlineService(svc.id, { defaultPriceMin: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-white border border-stone-200 rounded p-1 text-center font-mono"
                    />
                  </div>

                  {/* Max price */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">Harga Max</span>
                    <input
                      type="number"
                      min="0"
                      value={svc.defaultPriceMax}
                      onChange={(e) => handleUpdateInlineService(svc.id, { defaultPriceMax: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-white border border-stone-200 rounded p-1 text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saveServicesSuccess && (
            <span className="text-2xs font-extrabold text-emerald-700 flex items-center gap-1 mt-2.5">
              <Check className="w-4.5 h-4.5 text-emerald-600" />
              <span>Daftar layanan diperbarui</span>
            </span>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={isDeleteDbModalOpen}
        onClose={() => setIsDeleteDbModalOpen(false)}
        onConfirm={() => {
          onClearAllData();
          window.location.reload();
        }}
        title="Hapus Semua Data Aplikasi?"
        message="Apakah Anda yakin ingin menghapus semua data? Penambahan pesanan jahit, kuitansi, riwayat pemasukan, profil, dan layanan jahit akan direset ke bawaan awal. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Reset Total"
        cancelText="Batal/Amankan"
      />
    </div>
  );
};
