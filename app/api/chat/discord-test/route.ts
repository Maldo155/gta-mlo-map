export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * Quick debug endpoint: verify Discord env vars and channel access.
 * GET /api/chat/discord-test - no auth, use only for debugging.
 */
export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;

  const checks: Record<string, string> = {
    "DISCORD_BOT_TOKEN set": token ? "yes" : "no",
    "DISCORD_CHAT_CHANNEL_ID set": channelId ? "yes" : "no",
    "Token length": token ? String(token.length) : "0",
    "Channel ID": channelId || "—",
  };

  if (!token || !channelId) {
    return NextResponse.json({ ok: false, checks });
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; name?: string; type?: number; message?: string };
    if (!res.ok) {
      checks["Discord API"] = `error ${res.status}: ${data.message || JSON.stringify(data)}`;
      return NextResponse.json({ ok: false, checks });
    }
    checks["Channel name"] = data.name || "—";
    checks["Channel type"] = String(data.type ?? "?");
    checks["Discord API"] = "ok";
    return NextResponse.json({ ok: true, checks });
  } catch (e) {
    checks["Discord API"] = (e as Error).message;
    return NextResponse.json({ ok: false, checks });
  }
}
