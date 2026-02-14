export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

type ViewsPayload = {
  mlo_id?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ views: {} });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mlo_views")
    .select("mlo_id,view_count")
    .in("mlo_id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const views: Record<string, number> = {};
  for (const row of data || []) {
    if (row.mlo_id) {
      views[row.mlo_id] = Number(row.view_count || 0);
    }
  }

  return NextResponse.json({ views });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ViewsPayload;
  const mloId = String(body.mlo_id || "").trim();
  if (!mloId) {
    return NextResponse.json({ error: "Missing mlo_id" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await getSupabaseAdmin()
    .from("mlo_views")
    .select("view_count")
    .eq("mlo_id", mloId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    const { error: insertError } = await getSupabaseAdmin()
      .from("mlo_views")
      .insert({ mlo_id: mloId, view_count: 1 });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ views: 1 });
  }

  const next = Number(existing.view_count || 0) + 1;
  const { error: updateError } = await getSupabaseAdmin()
    .from("mlo_views")
    .update({ view_count: next, updated_at: new Date().toISOString() })
    .eq("mlo_id", mloId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ views: next });
}
