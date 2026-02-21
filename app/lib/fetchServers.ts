import { getSupabaseAdmin } from "./supabaseAdmin";
import type { Server } from "./serverTags";

export async function fetchServerById(id: string): Promise<Server | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("servers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Server;
}
