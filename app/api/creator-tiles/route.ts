export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";
import { syncCreatorToDiscord } from "@/app/lib/discordCreatorForum";

const TABLE = "creator_tiles";

const TILE_COLUMNS_FULL =
  "creator_key, banner_url, fit_mode, zoom, position, button_label, button_url, tile_border_glow, tile_border_glow_color, tile_text, tile_text_font, tile_text_size, tile_text_color, tile_text_position, logo_url, spotlight_logo_size, verified_creator, partnership, sort_order, creator_discord_invite, creator_description, creator_website_url, creator_discord_thread_id, creator_discord_message_id, updated_at";
const TILE_COLUMNS_MIN =
  "creator_key, banner_url, fit_mode, zoom, position, button_label, button_url, tile_border_glow, tile_border_glow_color, updated_at";

export async function GET() {
  const supabase = getSupabaseAdmin();
  let result = await supabase
    .from(TABLE)
    .select(TILE_COLUMNS_FULL)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("creator_key", { ascending: true });

  if (result.error) {
    const msg = String(result.error.message || "");
    const missingColumn = /column.*does not exist|logo_url|spotlight_logo_size|tile_text|tile_text_position|sort_order/i.test(msg);
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
        verified_creator: t.verified_creator ?? false,
        partnership: t.partnership ?? false,
        sort_order: t.sort_order ?? null,
        tile_text: t.tile_text ?? null,
        tile_text_font: t.tile_text_font ?? null,
        tile_text_size: t.tile_text_size ?? null,
        tile_text_color: t.tile_text_color ?? null,
        tile_text_position: t.tile_text_position ?? "left center",
        creator_discord_invite: t.creator_discord_invite ?? null,
        creator_description: t.creator_description ?? null,
        creator_website_url: t.creator_website_url ?? null,
        creator_discord_thread_id: t.creator_discord_thread_id ?? null,
        creator_discord_message_id: t.creator_discord_message_id ?? null,
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
    verified_creator: body.verified_creator === true,
    partnership: body.partnership === true,
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : null,
    creator_discord_invite: body.creator_discord_invite ? String(body.creator_discord_invite).trim() || null : null,
    creator_description: body.creator_description ? String(body.creator_description).trim() || null : null,
    creator_website_url: body.creator_website_url ? String(body.creator_website_url).trim() || null : null,
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
  if (body.verified_creator !== undefined) {
    updates.verified_creator = body.verified_creator === true;
  }
  if (body.partnership !== undefined) {
    updates.partnership = body.partnership === true;
  }
  if (body.sort_order !== undefined) {
    updates.sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : null;
  }
  if (body.creator_discord_invite !== undefined) {
    updates.creator_discord_invite = body.creator_discord_invite ? String(body.creator_discord_invite).trim() || null : null;
  }
  if (body.creator_description !== undefined) {
    updates.creator_description = body.creator_description ? String(body.creator_description).trim() || null : null;
  }
  if (body.creator_website_url !== undefined) {
    updates.creator_website_url = body.creator_website_url ? String(body.creator_website_url).trim() || null : null;
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
    // Sync to Discord when saving Discord post info (invite, description, website, logo)—not on creator spotlight changes (logo size, banner, tile design)
    const isDiscordPostSave =
      body.creator_discord_invite !== undefined ||
      body.creator_description !== undefined ||
      body.creator_website_url !== undefined ||
      body.logo_url !== undefined;
    if (isDiscordPostSave) {
      await syncCreatorToDiscordInBackground(creatorKey);
    }
  } else {
    const { error: insertError } = await supabase.from(TABLE).insert({
      creator_key: creatorKey,
      logo_url: updates.logo_url ?? null,
      spotlight_logo_size: updates.spotlight_logo_size ?? 60,
      verified_creator: updates.verified_creator ?? false,
      partnership: updates.partnership ?? false,
      updated_at: updates.updated_at,
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    const isDiscordPostSave =
      body.creator_discord_invite !== undefined ||
      body.creator_description !== undefined ||
      body.creator_website_url !== undefined ||
      body.logo_url !== undefined;
    if (isDiscordPostSave) {
      await syncCreatorToDiscordInBackground(creatorKey);
    }
  }

  return NextResponse.json({ success: true });
}

function normalizeCreatorKey(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "";
}

async function syncCreatorToDiscordInBackground(creatorKey: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const storedKey = creatorKey.trim().toLowerCase();
    const [tileRes, mlosRes] = await Promise.all([
      supabase
        .from(TABLE)
        .select("creator_key, creator_discord_invite, creator_description, creator_website_url, creator_discord_thread_id, creator_discord_message_id, button_url, logo_url")
        .eq("creator_key", storedKey)
        .maybeSingle(),
      supabase.from("mlos").select("creator"),
    ]);
    const tile = tileRes.data;
    if (!tile) return;
    const normalizedKey = normalizeCreatorKey(tile.creator_key || storedKey);
    const mlos = (mlosRes.data || []) as { creator?: string }[];
    const mloCount = mlos.filter((m) => normalizeCreatorKey(m.creator || "") === normalizedKey).length;
    const websiteUrl = (tile as { creator_website_url?: string }).creator_website_url || tile.button_url;
    const result = await syncCreatorToDiscord({
      creator_key: tile.creator_key || storedKey,
      creator_discord_invite: tile.creator_discord_invite,
      creator_description: tile.creator_description,
      creator_website_url: websiteUrl,
      creator_discord_thread_id: tile.creator_discord_thread_id,
      creator_discord_message_id: tile.creator_discord_message_id,
      button_url: tile.button_url,
      logo_url: tile.logo_url,
      mlo_count: mloCount,
    });
    if (result && (!tile.creator_discord_thread_id || !tile.creator_discord_message_id)) {
      await supabase
        .from(TABLE)
        .update({
          creator_discord_thread_id: result.threadId,
          creator_discord_message_id: result.messageId,
          updated_at: new Date().toISOString(),
        })
        .eq("creator_key", storedKey);
    }
  } catch (err) {
    console.error("[Creator Discord Sync]", err);
  }
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

  const supabase = getSupabaseAdmin();
  const normalizedKey = normalizeCreatorKey(creatorKey);

  const { data: mlos } = await supabase.from("mlos").select("id, creator");
  const toDelete = (mlos || []).filter(
    (m: { id?: string; creator?: string }) =>
      normalizeCreatorKey(String(m.creator || "")) === normalizedKey
  );
  const ids = toDelete.map((m: { id?: string }) => m.id).filter(Boolean);
  if (ids.length > 0) {
    const { error: mlosError } = await supabase.from("mlos").delete().in("id", ids);
    if (mlosError) {
      return NextResponse.json({ error: mlosError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase
    .from(TABLE)
    .delete()
    .eq("creator_key", creatorKey);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedMlos: ids.length });
}
