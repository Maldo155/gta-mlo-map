export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const TABLE = "creator_tiles";

const TILE_COLUMNS_FULL =
  "creator_key, banner_url, fit_mode, zoom, position, button_label, button_url, tile_border_glow, tile_border_glow_color, tile_text, tile_text_font, tile_text_size, tile_text_color, tile_text_position, logo_url, spotlight_logo_size, updated_at";
const TILE_COLUMNS_MIN =
  "creator_key, banner_url, fit_mode, zoom, position, button_label, button_url, tile_border_glow, tile_border_glow_color, updated_at";

export async function GET() {
  const supabase = getSupabaseAdmin();
  let result = await supabase
    .from(TABLE)
    .select(TILE_COLUMNS_FULL)
    .order("creator_key", { ascending: true });

  if (result.error) {
    const msg = String(result.error.message || "");
    const missingColumn = /column.*does not exist|logo_url|spotlight_logo_size|tile_text|tile_text_position/i.test(msg);
    if (missingColumn) {
      const fallback = await supabase
        .from(TABLE)
        .select(TILE_COLUMNS_MIN)
        .order("creator_key", { ascending: true });
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      const tiles = (fallback.data || []).map((t: Record<string, unknown>) => ({
        ...t,
        logo_url: t.logo_url ?? null,
        spotlight_logo_size: t.spotlight_logo_size ?? null,
        tile_text: t.tile_text ?? null,
        tile_text_font: t.tile_text_font ?? null,
        tile_text_size: t.tile_text_size ?? null,
        tile_text_color: t.tile_text_color ?? null,
        tile_text_position: t.tile_text_position ?? "left center",
      }));
      const res = NextResponse.json({ tiles });
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return res;
    }
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const res = NextResponse.json({ tiles: result.data || [] });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const creatorKey = String(body.creator_key || "")
    .trim()
    .toLowerCase();

  if (!creatorKey) {
    return NextResponse.json({ error: "Missing creator_key" }, { status: 400 });
  }

  const fitMode =
    body.fit_mode === "cover" || body.fit_mode === "contain"
      ? body.fit_mode
      : null;

  const updates = {
    creator_key: creatorKey,
    banner_url: body.banner_url || null,
    fit_mode: fitMode,
    zoom: Number.isFinite(Number(body.zoom)) ? Number(body.zoom) : null,
    position: body.position || null,
    button_label: body.button_label || null,
    button_url: body.button_url || null,
    tile_border_glow: body.tile_border_glow === true,
    tile_border_glow_color:
      body.tile_border_glow === true && body.tile_border_glow_color
        ? String(body.tile_border_glow_color).trim()
        : null,
    logo_url: body.logo_url ? String(body.logo_url).trim() || null : null,
    spotlight_logo_size:
      Number.isFinite(Number(body.spotlight_logo_size)) && body.spotlight_logo_size != null
        ? Math.min(100, Math.max(15, Number(body.spotlight_logo_size)))
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await getSupabaseAdmin()
    .from(TABLE)
    .upsert(updates, { onConflict: "creator_key" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const creatorKey = String(body.creator_key || "")
    .trim()
    .toLowerCase();

  if (!creatorKey) {
    return NextResponse.json({ error: "Missing creator_key" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.logo_url !== undefined) {
    updates.logo_url = body.logo_url ? String(body.logo_url).trim() || null : null;
  }
  if (body.spotlight_logo_size !== undefined && Number.isFinite(Number(body.spotlight_logo_size))) {
    updates.spotlight_logo_size = Math.min(100, Math.max(15, Number(body.spotlight_logo_size)));
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from(TABLE)
    .select("creator_key")
    .eq("creator_key", creatorKey)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("creator_key", creatorKey);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from(TABLE).insert({
      creator_key: creatorKey,
      logo_url: updates.logo_url ?? null,
      spotlight_logo_size: updates.spotlight_logo_size ?? 60,
      updated_at: updates.updated_at,
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const creatorKey = String(searchParams.get("creator_key") || "")
    .trim()
    .toLowerCase();

  if (!creatorKey) {
    return NextResponse.json({ error: "Missing creator_key" }, { status: 400 });
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from(TABLE)
    .delete()
    .eq("creator_key", creatorKey);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
