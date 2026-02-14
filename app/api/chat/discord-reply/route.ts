export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const MAX_MESSAGE = 2000;

/**
 * Discord bot uses this endpoint to post replies when staff reply in Discord.
 * Authenticated via X-Discord-Reply-Secret header (set CHAT_DISCORD_REPLY_SECRET in env).
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-discord-reply-secret") || "";
  const expected = process.env["CHAT_DISCORD_REPLY_SECRET"];
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { threadId?: string; message?: string };
  const threadId = body.threadId?.trim();
  const message = String(body.message || "").trim().slice(0, MAX_MESSAGE);

  if (!threadId || !message) {
    return NextResponse.json({ error: "threadId and message required" }, { status: 400 });
  }

  const { data, error: insertErr } = await getSupabaseAdmin()
    .from("chat_messages")
    .insert({ thread_id: threadId, from_visitor: false, content: message })
    .select("id, content, from_visitor, created_at")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: data });
}
