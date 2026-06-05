import { useState, useEffect } from "react";
import { 
  getProfile, saveProfile, getServices, saveServices, clearAllData
} from "./utils/storage";
import { Order, UMKMProfile } from "./types";
import { ServiceConfig } from "./data/defaultServices";
import { supabase } from "./lib/supabaseClient";
import { 
  fetchSupabaseOrders, insertSupabaseOrder, 
  updateSupabaseOrder, deleteSupabaseOrder 
} from "./utils/supabaseService";

// Import Pages
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { AddOrder } from "./pages/AddOrder";
import { OrderDetail } from "./pages/OrderDetail";
import { Finance } from "./pages/Finance";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { PWABanner } from "./components/PWABanner";

// Import Icons
import { 
  LayoutDashboard, ClipboardList, PlusCircle, TrendingUp, Settings as SettingsIcon,
  Scissors, Phone, MapPin, Menu, User, Sparkles, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UMKMProfile>({ name: "", owner: "", address: "", phone: "" });
  const [services, setServices] = useState<ServiceConfig[]>([]);

  // Supabase Auth State
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Helper function to sync orders from Supabase table
  const refreshOrders = async () => {
    try {
      const data = await fetchSupabaseOrders();
      setOrders(data);
    } catch (e) {
      console.error("Gagal sinkronisasi data dari Supabase:", e);
      setOrders([]);
    }
  };

  // Load Initial Data on Mount & setting PWA listeners & checking Auth
  useEffect(() => {
    // Check initial Supabase user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
      if (session) {
        refreshOrders();
      }
    });

    // Listen to Auth State triggers
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingAuth(false);
      if (session) {
        refreshOrders();
      } else {
        setOrders([]);
      }
    });

    setProfile(getProfile());
    setServices(getServices());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If already launched in standalone screen mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      subscription.unsubscribe();
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Logout handler
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari panel admin?");
    if (confirmLogout) {
      await supabase.auth.signOut();
    }
  };

  // Handlers for Data adjustments connected with Supabase real-time backend
  const handleAddNewOrder = async (orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt">) => {
    try {
      const freshOrder = await insertSupabaseOrder(orderData);
      await refreshOrders(); // Reload lists from DB
      
      // Auto redirect to its newly made kuitansi / details page
      setSelectedOrderId(freshOrder.id);
      setActiveTab("orders");
    } catch (e: any) {
      console.error("Gagal menambahkan data ke database Supabase:", e);
      alert("Gagal menambahkan data ke database Supabase: " + (e.message || e));
    }
  };

  const handleEditOrderSubmit = async (orderData: Omit<Order, "id" | "sisaBayar" | "createdAt" | "updatedAt">) => {
    if (!editingOrderId) return;
    try {
      await updateSupabaseOrder(editingOrderId, orderData);
      await refreshOrders(); // Reload lists from DB
      
      // Redirect back to detailed inspect view
      setSelectedOrderId(editingOrderId);
      setEditingOrderId(null);
    } catch (e: any) {
      alert("Gagal memperbarui data di database Supabase: " + (e.message || e));
    }
  };

  const handleDeleteOrderSubmit = async (id: string) => {
    try {
      await deleteSupabaseOrder(id);
      await refreshOrders(); // Reload lists from DB
      setSelectedOrderId(null);
    } catch (e: any) {
      alert("Gagal menghapus data dari database Supabase: " + (e.message || e));
    }
  };

  const handleUpdateStatusSubmit = async (id: string, updates: Partial<Order>) => {
    try {
      await updateSupabaseOrder(id, updates);
      await refreshOrders(); // Reload lists from DB
    } catch (e: any) {
      alert("Gagal mengubah status di database Supabase: " + (e.message || e));
    }
  };

  const handleSaveProfileSubmit = (updatedProfile: UMKMProfile) => {
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleSaveServicesSubmit = (updatedServices: ServiceConfig[]) => {
    saveServices(updatedServices);
    setServices(updatedServices);
  };

  const handlePurgeAllSubmit = () => {
    clearAllData();
    // React state will reload on manual browser refresh initiated by page reload inside settings modal confirm.
  };

  // Safe navigation triggers
  const executeNavigateToTab = (tab: string) => {
    setSelectedOrderId(null);
    setEditingOrderId(null);
    setActiveTab(tab);
  };

  const executeInspectOrderDetails = (id: string) => {
    setSelectedOrderId(id);
    setEditingOrderId(null);
  };

  const executeBeginEditOrder = (id: string) => {
    setEditingOrderId(id);
    setSelectedOrderId(id); // Stay in details context as fallback
  };

  // Get active order details if selected
  const activeOrderDetails = orders.find((o) => o.id === selectedOrderId);
  const editingOrderDetails = orders.find((o) => o.id === editingOrderId);

  // Render correct content inside container
  const renderTabContent = () => {
    // 1. Stack view: Editing form takes absolute priority
    if (editingOrderId && editingOrderDetails) {
      return (
        <AddOrder
          editOrder={editingOrderDetails}
          services={services}
          onSave={handleEditOrderSubmit}
          onCancel={() => setEditingOrderId(null)}
        />
      );
    }

    // 2. Stack view: Detail inspection view
    if (selectedOrderId && activeOrderDetails) {
      return (
        <OrderDetail
          order={activeOrderDetails}
          onBack={() => setSelectedOrderId(null)}
          onEdit={executeBeginEditOrder}
          onDeleteOrder={handleDeleteOrderSubmit}
          onUpdateStatus={handleUpdateStatusSubmit}
        />
      );
    }

    // 3. Normal Tab navigation views
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            orders={orders}
            onNavigateToTab={executeNavigateToTab}
            onSelectOrder={executeInspectOrderDetails}
            onAddNewOrder={() => executeNavigateToTab("add_order")}
            isInstallable={isInstallable}
            onInstallApp={handleInstallApp}
          />
        );
      case "orders":
        return (
          <Orders
            orders={orders}
            onSelectOrder={executeInspectOrderDetails}
            onAddNewOrder={() => executeNavigateToTab("add_order")}
          />
        );
      case "add_order":
        return (
          <AddOrder
            services={services}
            onSave={handleAddNewOrder}
            onCancel={() => executeNavigateToTab("dashboard")}
          />
        );
      case "finance":
        return <Finance orders={orders} />;
      case "settings":
        return (
          <Settings
            profile={profile}
            services={services}
            onSaveProfile={handleSaveProfileSubmit}
            onSaveServices={handleSaveServicesSubmit}
            onClearAllData={handlePurgeAllSubmit}
          />
        );
      default:
        return (
          <Dashboard
            orders={orders}
            onNavigateToTab={executeNavigateToTab}
            onSelectOrder={executeInspectOrderDetails}
            onAddNewOrder={() => executeNavigateToTab("add_order")}
          />
        );
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-amber-500 rounded-2xl animate-pulse text-stone-950">
            <Scissors className="w-8 h-8 text-stone-950" />
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-black uppercase tracking-wider text-amber-500">Griya Selaras</h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest text-center">Menghubungkan ke secure database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="min-h-screen bg-bg-utama font-sans flex flex-col md:flex-row text-primary-dark">
      
      {/* 1. DESKTOP SIDEBAR - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-100 border-r border-stone-850 shrink-0 sticky top-0 h-screen select-none">
        {/* Sidebar Header branding */}
        <div className="p-6 border-b border-stone-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-copper rounded-xl text-stone-900 shadow">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide leading-none uppercase text-amber-500">Griya Selaras</h1>
              <span className="text-[10px] font-semibold text-stone-400 block mt-1 tracking-wider uppercase">Order System</span>
            </div>
          </div>
          {profile.owner && (
            <div className="pt-2 flex items-center gap-1.5 text-stone-400 text-3xs">
              <User className="w-3 h-3 text-copper" />
              <span>Tailor: {profile.owner}</span>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <button
            onClick={() => executeNavigateToTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dashboard" && !selectedOrderId
                ? "bg-amber-500 text-stone-950 font-extrabold shadow"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard Panel</span>
          </button>

          <button
            onClick={() => executeNavigateToTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              (activeTab === "orders" || selectedOrderId)
                ? "bg-amber-500 text-stone-950 font-extrabold shadow"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Pesanan Pelanggan</span>
          </button>

          <button
            onClick={() => executeNavigateToTab("add_order")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "add_order" && !selectedOrderId
                ? "bg-amber-500 text-stone-950 font-extrabold shadow"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Catat Jahitan Baru</span>
          </button>

          <button
            onClick={() => executeNavigateToTab("finance")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "finance" && !selectedOrderId
                ? "bg-amber-500 text-stone-950 font-extrabold shadow"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Rekap Keuangan</span>
          </button>

          <button
            onClick={() => executeNavigateToTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "settings" && !selectedOrderId
                ? "bg-amber-500 text-stone-950 font-extrabold shadow"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>Pengaturan</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-red-400 hover:bg-stone-850 hover:text-red-350 mt-4 border border-stone-800/60"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            <span>Keluar Admin</span>
          </button>
        </nav>

        {/* Sidebar Footer credit */}
        <div className="p-4 border-t border-stone-800 text-3xs text-stone-500">
          <p className="font-semibold text-center select-all">Griya Selaras v1.0.0</p>
          <p className="text-center mt-1">Randegan, Banyumas</p>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR - Hidden on desktop */}
      <header className="md:hidden sticky top-0 z-40 bg-stone-900 border-b border-stone-850 px-4 py-3 flex items-center justify-between text-stone-100 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1 px-1.5 bg-copper rounded-lg shadow-inner">
            <Scissors className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-amber-500 leading-tight">Griya Selaras</h1>
            <span className="text-[9px] font-bold text-stone-400 block tracking-wide leading-none uppercase">Aplikasi Jahit</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.owner && (
            <span className="text-[10px] bg-stone-800 px-2 py-0.5 text-stone-300 rounded-full font-bold border border-stone-700/65 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pak Syuhada</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-rose-450 hover:bg-rose-950/20 hover:text-rose-400 transition"
            title="Keluar Admin"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 3. MAIN PORT CONTAINER WITH ANIMATION TRANSITION FRAMEWORK */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedOrderId || "") + (editingOrderId || "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. MOBILE BOTTOM NAV - Sticky target row, hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900 border-t border-stone-850 py-1.5 px-4 flex items-center justify-around text-stone-400 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => executeNavigateToTab("dashboard")}
          className={`flex flex-col items-center justify-center p-1.5 gap-1 transition w-12 ${
            activeTab === "dashboard" && !selectedOrderId ? "text-amber-500 font-bold scale-105" : "text-stone-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Home</span>
        </button>

        {/* Tab 2: Pesanan */}
        <button
          onClick={() => executeNavigateToTab("orders")}
          className={`flex flex-col items-center justify-center p-1.5 gap-1 transition w-12 ${
            (activeTab === "orders" || selectedOrderId) ? "text-amber-500 font-bold scale-105" : "text-stone-400"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Pesanan</span>
        </button>

        {/* Tab 3: Tambah Cepat - Floating center clicker style */}
        <button
          onClick={() => executeNavigateToTab("add_order")}
          className={`relative shrink-0 flex flex-col items-center justify-center -mt-6 bg-amber-500 text-stone-950 p-3.5 rounded-full hover:bg-amber-400 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.35)] stroke-[2.5px] outline-none ring-4 ring-stone-900 ${
            activeTab === "add_order" ? "scale-110 rotate-90" : ""
          }`}
          title="Tambah Pesanan Baru"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Tab 4: Keuangan */}
        <button
          onClick={() => executeNavigateToTab("finance")}
          className={`flex flex-col items-center justify-center p-1.5 gap-1 transition w-12 ${
            activeTab === "finance" && !selectedOrderId ? "text-amber-500 font-bold scale-105" : "text-stone-400"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Keuangan</span>
        </button>

        {/* Tab 5: Pengaturan */}
        <button
          onClick={() => executeNavigateToTab("settings")}
          className={`flex flex-col items-center justify-center p-1.5 gap-1 transition-all w-12 ${
            activeTab === "settings" && !selectedOrderId ? "text-amber-500 font-bold scale-105" : "text-stone-400"
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Menej</span>
        </button>
      </nav>

      {/* Beautiful Floating dark PWA Install banner with instructions */}
      <PWABanner isInstallable={isInstallable} onInstallApp={handleInstallApp} />
    </div>
  );
}
