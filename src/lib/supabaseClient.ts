import { createClient } from "@supabase/supabase-js";

// Helper function to safely get and sanitize environment variables
const getEnvVar = (name: string): string => {
  const env = (import.meta as any).env;
  if (!env) return "";
  let val = env[name];
  if (typeof val !== "string") return "";
  
  // Trim whitespace and remove outer double or single quotes if they exist
  val = val.trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1).trim();
  }
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1).trim();
  }
  return val;
};

// Check if a URL is structurally valid
const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const rawUrl = getEnvVar("VITE_SUPABASE_URL");
const rawKey = getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY");

// Determine the active Supabase URL
let supabaseUrl = "https://rxeknvkoounhrnchrcwh.supabase.co";
if (rawUrl && isValidHttpUrl(rawUrl) && !rawUrl.includes("YOUR_SUPABASE_PROJECT_URL") && !rawUrl.includes("sb_publishable_")) {
  supabaseUrl = rawUrl;
}

// Determine the active Supabase Publishable Key
let supabaseAnonKey = "sb_publishable_2069OCUMocZPV-fsoBF45A_Me8sQa5a";
if (rawKey && rawKey.length > 5 && !rawKey.includes("YOUR_SUPABASE_PUBLISHABLE_KEY") && !rawKey.includes("rxeknvkoounhrnchrcwh")) {
  supabaseAnonKey = rawKey;
}

console.log("Initializing Supabase with URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

