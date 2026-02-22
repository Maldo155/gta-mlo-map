export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const VISITOR_ID_REGEX = /^[a-f0-9-]{36}$/i;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const visitorId = req.headers.get("x-visitor-id")?.trim() || "";

  const supabase = getSupabaseAdmin();

  if (token) {
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    if (!authError && userData?.user) {
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
  }

  if (visitorId && VISITOR_ID_REGEX.test(visitorId)) {
    const { data, error } = await supabase
      .from("server_likes")
      .select("server_id")
      .eq("anonymous_id", visitorId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const likedIds = (data || []).map((r) => r.server_id).filter(Boolean);
    return NextResponse.json({ likedIds });
  }

  return NextResponse.json({ likedIds: [] });
}
