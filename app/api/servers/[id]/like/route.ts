export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const VISITOR_ID_REGEX = /^[a-f0-9-]{36}$/i;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const visitorId = req.headers.get("x-visitor-id")?.trim() || "";

  const { id: serverId } = await params;
  if (!serverId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let userId: string | null = null;
  let anonymousId: string | null = null;

  if (token) {
    const { data: userData, error: authError } =
      await getSupabaseAdmin().auth.getUser(token);
    if (!authError && userData?.user) {
      userId = userData.user.id;
    }
  }

  if (!userId) {
    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return NextResponse.json(
        { error: "Sign in or provide a valid X-Visitor-ID header to like." },
        { status: 400 }
      );
    }
    anonymousId = visitorId;
  }

  const existingQuery = supabase
    .from("server_likes")
    .select("id")
    .eq("server_id", serverId);
  if (userId) {
    existingQuery.eq("user_id", userId);
  } else {
    existingQuery.eq("anonymous_id", anonymousId);
  }
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const deleteQuery = supabase
      .from("server_likes")
      .delete()
      .eq("server_id", serverId);
    if (userId) {
      deleteQuery.eq("user_id", userId);
    } else {
      deleteQuery.eq("anonymous_id", anonymousId);
    }
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { count } = await supabase
      .from("server_likes")
      .select("*", { count: "exact", head: true })
      .eq("server_id", serverId);

    return NextResponse.json({ liked: false, like_count: count ?? 0 });
  }

  const insertPayload = userId
    ? { server_id: serverId, user_id: userId }
    : { server_id: serverId, user_id: null, anonymous_id: anonymousId };
  const { error: insertError } = await supabase
    .from("server_likes")
    .insert(insertPayload);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("server_likes")
    .select("*", { count: "exact", head: true })
    .eq("server_id", serverId);

  return NextResponse.json({ liked: true, like_count: count ?? 0 });
}
