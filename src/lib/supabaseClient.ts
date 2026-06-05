import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://rxeknvkoounhrnchrcwh.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_2069OCUMocZPV-fsoBF45A_Me8sQa5a";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not fully configured. Falling back to defaults.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
