export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

/**
 * Discord bot uses this to look up our thread ID from a Discord channel/thread ID.
 * Auth: X-Discord-Reply-Secret header.
 */
export async function GET(req: Request) {
  const secret = req.headers.get("x-discord-reply-secret") || "";
  const expected = process.env["CHAT_DISCORD_REPLY_SECRET"];
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId")?.trim();
  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("chat_threads")
    .select("id")
    .eq("discord_channel_id", channelId)
    .single();

  if (error || !data) {
    return NextResponse.json({ threadId: null });
  }

  return NextResponse.json({ threadId: data.id });
}
