import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, Mail, Lock, ShieldAlert, Sparkles, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage({
            type: "success",
            text: "Registrasi berhasil! Anda langsung masuk.",
          });
          setTimeout(() => {
            onLoginSuccess(data.session);
          }, 1500);
        } else {
          setMessage({
            type: "success",
            text: "Registrasi berhasil! Silakan periksa kotak masuk email Anda untuk verifikasi atau langsung coba masuk.",
          });
          setIsSignUp(false);
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage({
            type: "success",
            text: "Masuk berhasil! Mengalihkan ke Dashboard...",
          });
          setTimeout(() => {
            onLoginSuccess(data.session);
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-stone-800/20 rounded-full filter blur-[80px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-md bg-stone-900 border border-stone-850 p-6 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-stone-100 z-10 space-y-6"
      >
        {/* Branding header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.25)] text-stone-950 scale-105">
            <Scissors className="w-7 h-7 text-stone-950 stroke-[2.25]" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-amber-500">Griya Selaras</h1>
            <span className="text-xs font-bold text-stone-400 block tracking-widest uppercase mt-0.5">Admin Order System</span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-stone-800 w-full" />

        <div className="text-center">
          <h2 className="text-base font-bold text-white">
            {isSignUp ? "Registrasi Akun Admin Baru" : "Masuk Panel Admin"}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {isSignUp 
              ? "Daftarkan email Anda sebagai pengelola pesanan" 
              : "Masukkan kredensial Anda untuk mengelola order & keuangan"}
          </p>
        </div>

        {/* Alert Notifications */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3.5 rounded-xl border text-xs font-bold flex gap-2.5 items-start ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LoginForm */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-stone-400 uppercase tracking-wider">Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                placeholder="developer@griyaselaras.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs text-white focus:outline-none transition-all placeholder-stone-605"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-stone-400 uppercase tracking-wider">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs text-white focus:outline-none transition-all placeholder-stone-605"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-300 transition-colors focus:outline-none bg-transparent border-none cursor-pointer flex items-center justify-center"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 stroke-[2]" />
                ) : (
                  <Eye className="w-4 h-4 stroke-[2]" />
                )}
              </button>
            </div>
          </div>

          {/* Auth Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black rounded-xl text-xs transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrasi Admin</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Form Toggle buttons */}
        <div className="pt-2 text-center text-xs">
          <p className="text-stone-400 text-2xs">
            {isSignUp ? "Sudah memiliki akun?" : "Belum terdaftar untuk aplikasi ini?"}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="mt-1.5 text-amber-500 hover:text-amber-400 text-xs font-bold underline transition bg-transparent border-none cursor-pointer"
          >
            {isSignUp ? "Masuk dengan Akun Saja" : "Daftar Akun Pengelola Baru"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
