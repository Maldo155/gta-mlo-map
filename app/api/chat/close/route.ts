export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { archiveThread } from "@/app/lib/discordChat";

/**
 * Close a chat thread. Archives the Discord thread if one exists.
 * Called when a visitor clicks "End Chat" or when admin closes the chat.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { threadId?: string };
  const threadId = body.threadId?.trim();
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  const { data: thread, error: fetchErr } = await getSupabaseAdmin()
    .from("chat_threads")
    .select("discord_channel_id")
    .eq("id", threadId)
    .single();

  if (fetchErr || !thread) {
    return NextResponse.json({ ok: true }); // Thread may already be gone; treat as success
  }

  const discordChannelId = thread.discord_channel_id;
  if (discordChannelId) {
    await archiveThread(discordChannelId);
  }

  return NextResponse.json({ ok: true });
}
