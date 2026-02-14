export const runtime = "nodejs";

import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const BUCKET = "creator-tiles";
const TILE_WIDTH = 1000;
const TILE_HEIGHT = 52;

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const form = await req.formData();
  const file = form.get("file");
  const fitMode = String(form.get("fit_mode") || "cover");
  const creatorKey = String(form.get("creator_key") || "creator")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  const fit = "cover";

  const processed = await sharp(input)
    .resize(TILE_WIDTH, TILE_HEIGHT, {
      fit,
      position: "center",
      background: { r: 15, g: 17, b: 20, alpha: 1 },
    })
    .png()
    .toBuffer();

  const filePath = `${creatorKey}-${Date.now()}.png`;

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .upload(filePath, processed, {
      contentType: "image/png",
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
    fitMode: "cover",
  });
}
