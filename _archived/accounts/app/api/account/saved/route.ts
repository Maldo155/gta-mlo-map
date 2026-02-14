import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireUser } from "@/app/lib/userAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const { data: saved, error: savedError } = await getSupabaseAdmin()
    .from("saved_mlos")
    .select("mlo_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 500 });
  }

  const ids = (saved || []).map((row) => row.mlo_id).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ saved: [], mlos: [] });
  }

  const { data: mlos, error: mloError } = await getSupabaseAdmin()
    .from("mlos")
    .select("*")
    .in("id", ids);

  if (mloError) {
    return NextResponse.json({ error: mloError.message }, { status: 500 });
  }

  return NextResponse.json({ saved: saved || [], mlos: mlos || [] });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const mlo_id = String(body.mlo_id || "").trim();
  if (!mlo_id) {
    return NextResponse.json({ error: "Missing mlo_id" }, { status: 400 });
  }

  const { error: insertError } = await getSupabaseAdmin()
    .from("saved_mlos")
    .insert({ user_id: user.id, mlo_id });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mlo_id = searchParams.get("mlo_id");
  if (!mlo_id) {
    return NextResponse.json({ error: "Missing mlo_id" }, { status: 400 });
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from("saved_mlos")
    .delete()
    .eq("user_id", user.id)
    .eq("mlo_id", mlo_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
