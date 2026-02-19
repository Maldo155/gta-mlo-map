export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const TILES_TABLE = "creator_tiles";
const MLOS_TABLE = "mlos";

function normalizeCreatorKey(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "";
}

/**
 * GET /api/creator-tiles/partners
 * Returns partners for the homepage "Our Partners!" section.
 * Tiles with partnership=true and (logo_url or banner_url),
 * joined with MLO counts and display names.
 * Sorted by updated_at desc (most recently made partner first).
 */
export async function GET() {
  const supabase = getSupabaseAdmin();

  const [tilesRes, mlosRes] = await Promise.all([
    supabase
      .from(TILES_TABLE)
      .select("creator_key, logo_url, banner_url, spotlight_logo_size, partnership, updated_at")
      .order("updated_at", { ascending: true }),
    supabase.from(MLOS_TABLE).select("creator"),
  ]);

  if (tilesRes.error) {
    return NextResponse.json({ error: tilesRes.error.message }, { status: 500 });
  }
  if (mlosRes.error) {
    return NextResponse.json({ error: mlosRes.error.message }, { status: 500 });
  }

  const tiles = tilesRes.data || [];
  const mlos = mlosRes.data || [];

  const countByKey: Record<string, number> = {};
  const displayNameByKey: Record<string, string> = {};
  for (const mlo of mlos) {
    const raw = (mlo as { creator?: string }).creator || "";
    const key = normalizeCreatorKey(raw);
    if (!key) continue;
    countByKey[key] = (countByKey[key] || 0) + 1;
    if (!(key in displayNameByKey)) displayNameByKey[key] = raw.trim();
  }

  const partners = tiles.filter(
    (t: { creator_key?: string | null; logo_url?: string | null; banner_url?: string | null; partnership?: boolean }) =>
      t.creator_key &&
      (t as { partnership?: boolean }).partnership === true &&
      (t.logo_url || t.banner_url)
  );

  const creators = partners.map(
    (t: {
      creator_key: string;
      logo_url?: string | null;
      spotlight_logo_size?: number | null;
      updated_at?: string | null;
    }) => {
      const key = normalizeCreatorKey(t.creator_key);
      const size =
        t.spotlight_logo_size != null && Number.isFinite(Number(t.spotlight_logo_size))
          ? Math.min(100, Math.max(15, Number(t.spotlight_logo_size)))
          : 60;
      return {
        creator_key: t.creator_key,
        logo_url: t.logo_url || null,
        spotlight_logo_size: size,
        displayName: displayNameByKey[key] || t.creator_key,
        count: countByKey[key] || 0,
        updated_at: t.updated_at || null,
      };
    }
  );

  const res = NextResponse.json({ creators });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}
