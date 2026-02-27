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
 * GET /api/creator-tiles/spotlight
 * Returns the list of creators to show in the homepage Creator Spotlight.
 * Same logic as admin: tiles with creator_key and (logo_url or banner_url),
 * joined with MLO counts and display names, sorted by count desc.
 */
export async function GET() {
  const supabase = getSupabaseAdmin();

  const [tilesRes, mlosRes] = await Promise.all([
    supabase.from(TILES_TABLE).select("creator_key, logo_url, banner_url, spotlight_logo_size, verified_creator, partnership").order("creator_key", { ascending: true }),
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

  const inSpotlight = tiles.filter(
    (t: { creator_key?: string | null; logo_url?: string | null; banner_url?: string | null }) =>
      t.creator_key && (t.logo_url || t.banner_url)
  );

  const creators = inSpotlight.map(
    (t: { creator_key: string; logo_url?: string | null; spotlight_logo_size?: number | null; verified_creator?: boolean; partnership?: boolean }) => {
      const key = normalizeCreatorKey(t.creator_key);
      const size =
        t.spotlight_logo_size != null && Number.isFinite(Number(t.spotlight_logo_size))
          ? Math.min(100, Math.max(15, Number(t.spotlight_logo_size)))
          : 60;
      return {
        creator_key: t.creator_key,
        logo_url: t.logo_url || null,
        spotlight_logo_size: size,
        verified_creator: t.verified_creator === true,
        partnership: t.partnership === true,
        displayName: displayNameByKey[key] || t.creator_key,
        count: countByKey[key] || 0,
      };
    }
  );

  creators.sort((a, b) => b.count - a.count);

  const res = NextResponse.json({ creators });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}
