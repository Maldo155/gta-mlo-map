export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const BUCKET = "creator-tiles";

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const form = await req.formData();
  const file = form.get("file");
  const creatorKey = String(form.get("creator_key") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  if (!creatorKey) {
    return NextResponse.json({ error: "Missing creator_key" }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const ext = "png";
  const filePath = `logos/${creatorKey}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type && file.type.startsWith("image/") ? file.type : "image/png";

  const { error: uploadError } = await getSupabaseAdmin()
    .storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = getSupabaseAdmin()
    .storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return NextResponse.json({
    success: true,
    publicUrl: publicUrlData.publicUrl,
  });
}
