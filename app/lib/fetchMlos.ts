import { getSupabaseAdmin } from "./supabaseAdmin";

export type MloRow = {
  id: string;
  name?: string | null;
  creator?: string | null;
  website_url?: string | null;
  image_url?: string | null;
  category?: string | null;
  tag?: string | null;
  x?: number | null;
  y?: number | null;
  created_at?: string | null;
};

export async function fetchAllMlos(): Promise<MloRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("mlos")
    .select("id, name, creator, website_url, image_url, category, tag, x, y, created_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as MloRow[];
}

export async function fetchMloById(id: string): Promise<MloRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("mlos")
    .select("id, name, creator, website_url, image_url, category, tag, x, y, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as MloRow;
}
