export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const BUCKET = "server-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json(
      { error: "Sign in required to upload." },
      { status: 401 }
    );
  }

  const { data: userData, error: authError } =
    await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const type = String(form.get("type") || "logo"); // "logo" | "banner"

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const contentType = file.type && file.type.startsWith("image/") ? file.type : "image/png";
  if (!VALID_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid image type. Use PNG, JPG, GIF, or WebP." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large. Max 5MB." },
      { status: 400 }
    );
  }

  const ext = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1] || "png";
  const filePath = `${type}/${userData.user.id}-${Date.now()}.${ext}`;

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
