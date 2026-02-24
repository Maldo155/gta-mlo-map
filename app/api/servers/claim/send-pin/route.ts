/**
 * Send a 4-digit PIN to the user's Discord webhook.
 * Verifies the webhook belongs to the same Discord server as the listing.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const DISCORD_API = "https://discord.com/api/v10";

function getBotToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN || null;
}

/** Resolve Discord invite to guild ID (requires bot token) */
async function resolveInviteToGuildId(inviteUrl: string, botToken: string): Promise<string | null> {
  const trimmed = inviteUrl.replace(/^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)/i, "").trim();
  const code = trimmed.split(/[?#/]/)[0];
  if (!code) return null;
  try {
    const res = await fetch(
      `${DISCORD_API}/invites/${encodeURIComponent(code)}?with_counts=true`,
      { headers: { Authorization: `Bot ${botToken}` }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.guild?.id || null;
  } catch {
    return null;
  }
}

/** Get webhook's guild_id from Discord API */
async function getWebhookGuildId(webhookUrl: string): Promise<string | null> {
  const match = webhookUrl.match(/discord\.com\/api\/webhooks\/(\d+)\/([^/?#]+)/i);
  if (!match) return null;
  const [, id, token] = match;
  try {
    const res = await fetch(`https://discord.com/api/v10/webhooks/${id}/${token}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.guild_id || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Sign in with Discord required" }, { status: 401 });
  }

  const { data: userData, error: authError } = await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const serverId = typeof body.server_id === "string" ? body.server_id.trim() : "";
  const webhookUrl = typeof body.webhook_url === "string" ? body.webhook_url.trim() : "";

  if (!serverId || !webhookUrl) {
    return NextResponse.json({ error: "server_id and webhook_url required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("id, discord_url, claimed_by_user_id")
    .eq("id", serverId)
    .single();

  if (fetchError || !server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }
  if (server.claimed_by_user_id) {
    return NextResponse.json({ error: "Server already claimed" }, { status: 400 });
  }
  if (!server.discord_url?.trim()) {
    return NextResponse.json({ error: "This server has no Discord linked" }, { status: 400 });
  }

  const botToken = getBotToken();
  if (!botToken) {
    return NextResponse.json({ error: "Claim verification not configured" }, { status: 503 });
  }

  const inviteGuildId = await resolveInviteToGuildId(server.discord_url, botToken);
  if (!inviteGuildId) {
    return NextResponse.json({ error: "Could not resolve this server's Discord. Check the invite link." }, { status: 400 });
  }

  const webhookGuildId = await getWebhookGuildId(webhookUrl);
  if (!webhookGuildId) {
    return NextResponse.json({ error: "Invalid webhook URL. Make sure you copied the full URL." }, { status: 400 });
  }

  if (inviteGuildId !== webhookGuildId) {
    return NextResponse.json({ error: "This webhook is not from the same Discord server as this listing." }, { status: 400 });
  }

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**MLOMesh Claim Verification**\nYour PIN: **${pin}**\nExpires in 10 minutes. Do not share.\n\nEnter this code on MLOMesh to complete your claim.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[Claim] Webhook post failed:", res.status, errText);
      return NextResponse.json({ error: "Could not send PIN to your Discord. Check the webhook URL and try again." }, { status: 400 });
    }
  } catch (err) {
    console.error("[Claim] Webhook post error:", err);
    return NextResponse.json({ error: "Could not reach your Discord webhook." }, { status: 502 });
  }

  await supabase
    .from("servers")
    .update({
      claim_pin: pin,
      claim_pin_expires: expiresAt.toISOString(),
      claim_pin_user_id: userData.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serverId);

  return NextResponse.json({ success: true });
}
