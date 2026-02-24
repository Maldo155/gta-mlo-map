export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const { id: serverId } = await params;
  if (!serverId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: userData, error: authError } =
    await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: "Sign in to like servers." },
      { status: 401 }
    );
  }

  const userId = userData.user.id;
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("server_likes")
    .select("id")
    .eq("server_id", serverId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await supabase
      .from("server_likes")
      .delete()
      .eq("server_id", serverId)
      .eq("user_id", userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { count } = await supabase
      .from("server_likes")
      .select("*", { count: "exact", head: true })
      .eq("server_id", serverId);

    return NextResponse.json({ liked: false, like_count: count ?? 0 });
  }

  const { error: insertError } = await supabase
    .from("server_likes")
    .insert({ server_id: serverId, user_id: userId });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("server_likes")
    .select("*", { count: "exact", head: true })
    .eq("server_id", serverId);

  return NextResponse.json({ liked: true, like_count: count ?? 0 });
}
