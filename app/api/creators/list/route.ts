export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

function normalizeKey(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

/** GET — public list of creators for server form (who's MLOs are you using) */
export async function GET() {
  const supabase = getSupabaseAdmin();

  const [mlosRes, tilesRes] = await Promise.all([
    supabase.from("mlos").select("creator"),
    supabase
      .from("creator_tiles")
      .select("creator_key, logo_url, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("creator_key", { ascending: true }),
  ]);

  const mlos = (mlosRes.data || []) as { creator?: string }[];
  let tiles = (tilesRes.data || []) as { creator_key: string; logo_url?: string | null; sort_order?: number | null }[];
  if (tilesRes.error) {
    const fallback = await supabase.from("creator_tiles").select("creator_key, logo_url").order("creator_key");
    tiles = (fallback.data || []) as typeof tiles;
  }

  const byKey = new Map<string, { label: string; logo_url?: string | null; sortOrder: number }>();
  const tileOrder = new Map<string, number>();

  tiles.forEach((t, i) => {
    const k = normalizeKey(t.creator_key);
    tileOrder.set(k, t.sort_order != null ? Number(t.sort_order) : i);
  });

  for (const m of mlos) {
    const name = (m.creator || "").trim();
    if (!name || name === "Unknown") continue;
    const k = normalizeKey(name);
    if (!byKey.has(k)) {
      byKey.set(k, {
        label: name,
        logo_url: null,
        sortOrder: tileOrder.get(k) ?? 9999,
      });
    }
  }

  tiles.forEach((t) => {
    const k = normalizeKey(t.creator_key);
    const cur = byKey.get(k);
    if (cur) {
      if (t.logo_url && !cur.logo_url) cur.logo_url = t.logo_url;
    } else {
      byKey.set(k, {
        label: t.creator_key,
        logo_url: t.logo_url,
        sortOrder: tileOrder.get(k) ?? 9999,
      });
    }
  });

  const creators = [...byKey.entries()]
    .filter(([key]) => key !== "unknown")
    .map(([key, { label, logo_url, sortOrder }]) => ({ key, label, logo_url: logo_url || null, sortOrder }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.label.localeCompare(b.label);
    })
    .map(({ key, label, logo_url }) => ({ key, label, logo_url }));

  const res = NextResponse.json({ creators });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}
