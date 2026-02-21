import { createClient } from "@/app/lib/supabase/client";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (cachedClient) return cachedClient;
  cachedClient = createClient();
  return cachedClient;
}
