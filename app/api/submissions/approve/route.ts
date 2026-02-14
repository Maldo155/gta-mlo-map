import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const adminToken = process.env.ADMIN_API_TOKEN;
  const providedToken =
    searchParams.get("admin_token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (adminToken && providedToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mlo_submissions")
    .select("*")
    .eq("approve_token", token)
    .eq("status", "pending")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { error: insertError } = await getSupabaseAdmin().from("mlos").insert({
    name: data.name,
    creator: data.creator,
    website_url: data.website_url,
    category: data.category,
    tag: data.tag || null,
    x: data.x,
    y: data.y,
    image_url: data.image_url,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await getSupabaseAdmin()
    .from("mlo_submissions")
    .update({ status: "approved" })
    .eq("id", data.id);

  return NextResponse.json({ success: true });
}
