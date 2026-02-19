export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const TABLE = "creator_tiles";

/**
 * POST /api/creator-tiles/reorder
 * Body: { creator_keys: ["key1", "key2", "key3", ...] }
 * Sets sort_order to index for each tile. Tiles not in the list are unchanged.
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const keys = body.creator_keys;
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: "Missing or empty creator_keys array" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const updates = keys.map((k: unknown, i: number) => {
    const creatorKey = String(k || "").trim();
    return { creator_key: creatorKey, sort_order: i };
  });

  for (const u of updates) {
    if (!u.creator_key) continue;
    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ sort_order: u.sort_order, updated_at: new Date().toISOString() })
      .eq("creator_key", u.creator_key);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
