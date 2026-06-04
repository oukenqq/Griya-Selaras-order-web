import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronRight, Share, Smartphone, Monitor, Info, Layers, Compass } from "lucide-react";

interface PWABannerProps {
  isInstallable: boolean;
  onInstallApp: () => void;
}

export const PWABanner: React.FC<PWABannerProps> = ({
  isInstallable,
  onInstallApp,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    // Detect if already launched as standalone app (PWA)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check if user dismissed the banner recently in this session
    const isDismissed = sessionStorage.getItem("griya_pwa_banner_dismissed");
    if (!isDismissed) {
      // Delay display slightly for gorgeous entry transition feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("griya_pwa_banner_dismissed", "true");
  };

  const handleActionClick = () => {
    if (isInstallable) {
      onInstallApp();
    } else {
      // Show interactive manual guide instead if browser automatic prompt isn't supported yet
      setIsGuideOpen(true);
    }
  };

  // Auto detect user platform to set default guidance tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActiveTab("ios");
      } else {
        setActiveTab("android");
      }
    }
  }, []);

  return (
    <>
      {/* 1. FLOATING BLACK BANNER */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="griya-pwa-floating-banner"
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="fixed bottom-[74px] sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[410px] bg-stone-900/95 backdrop-blur-md text-stone-100 p-4.5 rounded-2xl border border-stone-850 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3.5"
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 text-stone-400 hover:text-white transition-colors bg-stone-800/60 p-1 rounded-lg"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Banner Header with Glowing Icon */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="relative shrink-0 mt-0.5">
                <div className="absolute -inset-1.5 bg-amber-500/10 rounded-xl blur-sm" />
                <div className="relative p-2.5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/25 rounded-xl text-amber-500">
                  <Sparkles className="w-5.5 h-5.5 animate-pulse" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Pasang Aplikasi Griya Order di HP
                </h4>
                <p className="text-stone-300 text-2xs leading-relaxed">
                  Akses lebih cepat, hemat kuota, dan rasakan performa aplikasi jahit yang mulus dengan ikon di layar utama HP Anda.
                </p>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleDismiss}
                className="w-1/3 py-2.5 px-3 border border-stone-800 hover:bg-stone-800/50 text-stone-400 hover:text-stone-200 text-xs font-bold rounded-xl transition duration-200"
              >
                Nanti Saja
              </button>
              
              <button
                onClick={handleActionClick}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all shadow-[0_4px_14px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Pasang Sekarang</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. INSTRUCTION GUIDE MODAL */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5.5 h-5.5 text-amber-500" />
                  <h3 className="text-base font-black text-white tracking-wide">
                    Cara Pasang Griya Order
                  </h3>
                </div>
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* OS Tabs */}
              <div className="flex border-b border-stone-850 p-2 bg-stone-950/30 gap-1">
                <button
                  onClick={() => setActiveTab("android")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "android"
                      ? "bg-stone-800 text-amber-500 border border-stone-750"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <span>🤖 Android / Chrome</span>
                </button>
                <button
                  onClick={() => setActiveTab("ios")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "ios"
                      ? "bg-stone-800 text-amber-500 border border-stone-750"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <span>🍎 iOS / Safari</span>
                </button>
              </div>

              {/* Steps Area */}
              <div className="p-6 space-y-5.5 max-h-[380px] overflow-y-auto">
                {activeTab === "android" ? (
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        1
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300">
                        Buka browser <strong className="text-white">Google Chrome</strong> di HP Anda, kemudian klik ikon menu titiik tiga (<strong className="text-white text-sm font-black">⋮</strong>) di sudut kanan atas layar.
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        2
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300">
                        Cari & klik menu <strong className="text-amber-400">"Tambahkan ke Layar utama"</strong> atau <strong className="text-amber-400">"Instal Aplikasi"</strong>.
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        3
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300">
                        Tekan konfirmasi <strong className="text-white">"Instal"</strong>. Ikon Griya Order akan otomatis muncul di menu aplikasi utama HP Anda!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        1
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300 flex flex-wrap items-center gap-1">
                        Buka browser <span className="text-white font-bold">Safari</span> di iPhone/iPad Anda, lalu cari & tekan tombol 
                        <span className="inline-flex items-center gap-1 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-amber-500 font-bold scale-95">
                          <Share className="w-3 h-3 inline" /> Bagikan (Share)
                        </span>
                        di panel menu bawah.
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        2
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300">
                        Gulir ke bawah dan ketuk opsi <strong className="text-amber-400">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3.5">
                      <div className="w-6 h-6 shrink-0 bg-stone-800 rounded-lg text-[11px] text-amber-500 font-extrabold flex items-center justify-center border border-stone-700/80">
                        3
                      </div>
                      <div className="text-xs leading-relaxed text-stone-300">
                        Ketuk <strong className="text-white">"Tambah" (Add)</strong> di pojok kanan atas. Griya Order siap dibuka kapan pun dari Home Screen Anda!
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional info badge */}
                <div className="p-3.5 bg-stone-850/65 rounded-xl border border-stone-800 mt-2 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-3xs text-stone-400 leading-normal">
                    Setelah dipasang, aplikasi Griya Order akan berjalan di layaknya aplikasi mandiri tanpa garis navigasi browser, sangat ringan, responsif, dan lancar digunakan sehari-hari.
                  </p>
                </div>
              </div>

              {/* Action Close */}
              <div className="p-4 bg-stone-950/40 border-t border-stone-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-5 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold rounded-xl transition-all"
                >
                  Dimengerti, Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
