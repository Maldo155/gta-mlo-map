import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient | null = null;
let cachedAnon: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars are missing.");
  }

  cachedAdmin = createClient(url, key);
  return cachedAdmin;
}

/** Server-side anon client. Used for submit form (avoids 401 when service role key missing on Vercel). */
export function getSupabaseAnon(): SupabaseClient {
  if (cachedAnon) return cachedAnon;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase anon env vars are missing.");
  }

  cachedAnon = createClient(url, key);
  return cachedAnon;
}
