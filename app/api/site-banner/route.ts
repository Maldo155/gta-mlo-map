export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const TABLE = "site_banner";

const STYLE_KEYS = [
  "font_family",
  "title_font_size",
  "subtitle_font_size",
  "title_font_weight",
  "letter_spacing",
  "subtitle_color",
  "title_font_color",
  "background_color",
  "border_color",
  "animation",
] as const;

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select(
      "title, subtitle, font_family, title_font_size, subtitle_font_size, title_font_weight, letter_spacing, subtitle_color, title_font_color, background_color, border_color, animation"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ title: null, subtitle: null });
  }

  const out: Record<string, unknown> = {
    title: data.title || null,
    subtitle: data.subtitle || null,
  };
  for (const k of STYLE_KEYS) {
    const v = (data as Record<string, unknown>)[k];
    if (v != null && v !== "") out[k] = v;
  }
  return NextResponse.json(out);
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : null;
  const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (title !== null) updates.title = title;
  if (subtitle !== null) updates.subtitle = subtitle;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  if (body.font_family !== undefined) updates.font_family = str(body.font_family) || null;
  if (body.title_font_size !== undefined) updates.title_font_size = num(body.title_font_size) ?? 32;
  if (body.subtitle_font_size !== undefined) updates.subtitle_font_size = num(body.subtitle_font_size) ?? 20;
  if (body.title_font_weight !== undefined) updates.title_font_weight = str(body.title_font_weight) || "900";
  if (body.letter_spacing !== undefined) updates.letter_spacing = str(body.letter_spacing) || null;
  if (body.subtitle_color !== undefined) updates.subtitle_color = str(body.subtitle_color) || null;
  if (body.title_font_color !== undefined) updates.title_font_color = str(body.title_font_color) || null;
  if (body.background_color !== undefined) updates.background_color = str(body.background_color) || null;
  if (body.border_color !== undefined) updates.border_color = str(body.border_color) || null;
  if (body.animation !== undefined) updates.animation = str(body.animation) || "flash";

  const { data: existing } = await getSupabaseAdmin()
    .from(TABLE)
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await getSupabaseAdmin()
      .from(TABLE)
      .update(updates)
      .eq("id", 1);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const row: Record<string, unknown> = {
      id: 1,
      title: title || "Site Status: Early Access",
      subtitle: subtitle || "The site is live, but we're still refining the design.",
      font_family: updates.font_family ?? null,
      title_font_size: updates.title_font_size ?? 32,
      subtitle_font_size: updates.subtitle_font_size ?? 20,
      title_font_weight: updates.title_font_weight ?? "900",
      letter_spacing: updates.letter_spacing ?? "0.8px",
      subtitle_color: updates.subtitle_color ?? "#fde68a",
      title_font_color: updates.title_font_color ?? null,
      background_color: updates.background_color ?? null,
      border_color: updates.border_color ?? null,
      animation: updates.animation ?? "flash",
      updated_at: new Date().toISOString(),
    };
    const { error: insertError } = await getSupabaseAdmin().from(TABLE).insert(row);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
