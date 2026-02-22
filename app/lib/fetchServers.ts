import { getSupabaseAdmin } from "./supabaseAdmin";
import type { Server } from "./serverTags";

export async function fetchServerById(id: string): Promise<Server | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const { count } = await supabase
    .from("server_likes")
    .select("*", { count: "exact", head: true })
    .eq("server_id", id);

  return { ...data, views: data.views ?? 0, like_count: count ?? 0 } as Server;
}
