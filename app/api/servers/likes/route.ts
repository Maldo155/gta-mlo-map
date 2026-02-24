export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const supabase = getSupabaseAdmin();
  const { data: userData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !userData?.user) {
    return NextResponse.json({ likedIds: [] });
  }

  const { data, error } = await supabase
    .from("server_likes")
    .select("server_id")
    .eq("user_id", userData.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const likedIds = (data || []).map((r) => r.server_id).filter(Boolean);
  return NextResponse.json({ likedIds });
}
