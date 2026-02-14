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

  const { error } = await getSupabaseAdmin()
    .from("mlo_submissions")
    .update({ status: "rejected" })
    .eq("approve_token", token)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
