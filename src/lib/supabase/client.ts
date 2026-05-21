import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  url.startsWith("https://") && key.length > 0;

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add your keys to .env.local.");
  }
  return createBrowserClient(url, key);
}
