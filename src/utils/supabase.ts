// Supabase client for Realtime subscriptions (Character table updates)
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getSupabaseClient() {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
