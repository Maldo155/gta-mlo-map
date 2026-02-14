export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const BUCKET = "mlo-images";

/* =========================
   GET — fetch all MLOs
========================= */
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("mlos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mlos: data });
}

/* =========================
   POST — add new MLO
========================= */
export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const form = await req.formData();

  const name = String(form.get("name"));
  const creator = String(form.get("creator"));
  const website_url = String(form.get("website_url"));
  const category = String(form.get("category"));
  const tag = String(form.get("tag") || "");
  const x = Number(form.get("x"));
  const y = Number(form.get("y"));
  const imageBlob = form.get("image");

  if (!(imageBlob instanceof Blob)) {
    return NextResponse.json({ error: "Image missing" }, { status: 400 });
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 }
    );
  }

  const filePath = `${crypto.randomUUID()}.png`;

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .upload(filePath, imageBlob, {
      contentType: imageBlob.type || "image/png",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = getSupabaseAdmin().storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const image_url = publicUrlData.publicUrl;

  const { error: insertError } = await getSupabaseAdmin().from("mlos").insert({
    name,
    creator,
    website_url,
    category,
    tag: tag || null,
    x,
    y,
    image_url,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* =========================
   DELETE — delete MLO
========================= */
export async function DELETE(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const deleteAll = searchParams.get("all") === "true";
  const idsParam = searchParams.get("ids");
  const id = searchParams.get("id");

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }
    const { data, error } = await getSupabaseAdmin()
      .from("mlos")
      .delete()
      .in("id", ids)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: data?.length ?? ids.length });
  }

  if (deleteAll) {
    const { data, error } = await getSupabaseAdmin()
      .from("mlos")
      .delete()
      .not("id", "is", null)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: "all",
      count: data?.length ?? 0,
    });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from("mlos")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (
    ("x" in updates && !Number.isFinite(Number(updates.x))) ||
    ("y" in updates && !Number.isFinite(Number(updates.y)))
  ) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 }
    );
  }

  const { error: updateError } = await getSupabaseAdmin()
    .from("mlos")
    .update({
      ...updates,
      x: "x" in updates ? Number(updates.x) : updates.x,
      y: "y" in updates ? Number(updates.y) : updates.y,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
