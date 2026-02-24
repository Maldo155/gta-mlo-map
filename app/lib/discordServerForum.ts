/**
 * Discord forum sync for FiveM servers.
 * Creates/updates forum posts in #your-cities when servers are added or edited.
 * Uses DISCORD_BOT_TOKEN and DISCORD_SERVERS_FORUM_CHANNEL_ID.
 */

const DISCORD_API = "https://discord.com/api/v10";

function getMapBaseUrl(): string {
  const a = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const b = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const raw = a || b || "https://mlomesh.vercel.app";
  if (/localhost|127\.0\.0\.1/.test(raw)) return "https://mlomesh.vercel.app";
  return raw.replace(/\/$/, "");
}

function getBotHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

export type ServerForumData = {
  id: string;
  server_name: string;
  discord_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  connect_url?: string | null;
  region?: string | null;
  rp_type?: string | null;
  economy_type?: string | null;
  discord_thread_id?: string | null;
  discord_message_id?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  thumbnail_url?: string | null;
};

function buildServerPostContent(data: ServerForumData): {
  content: string;
  embed?: { image?: { url: string } };
} {
  const serverUrl = `${getMapBaseUrl()}/servers/${data.id}`;
  const lines: string[] = [];

  lines.push(`🏙️ **${data.server_name}**`);
  lines.push("");

  if (data.description?.trim()) {
    const desc = data.description.trim();
    const snippet = desc.length > 200 ? desc.slice(0, 197) + "…" : desc;
    lines.push(snippet);
    lines.push("");
  }

  if (data.connect_url?.trim()) {
    lines.push(`📍 Connect: ${data.connect_url.trim()}`);
  }
  if (data.discord_url?.trim()) {
    lines.push(`🔗 Discord: ${data.discord_url.trim()}`);
  }
  if (data.website_url?.trim()) {
    lines.push(`🌐 Website: ${data.website_url.trim()}`);
  }
  if (data.region || data.rp_type) {
    const tags: string[] = [];
    if (data.region) tags.push(data.region);
    if (data.rp_type) tags.push(data.rp_type);
    if (tags.length > 0) lines.push(`• ${tags.join(" • ")}`);
  }

  lines.push("");
  lines.push(`📍 View on MLOMesh: ${serverUrl}`);

  const content = lines.join("\n");
  const result: { content: string; embed?: { image?: { url: string } } } = { content };

  const imageUrl = data.banner_url?.trim() || data.thumbnail_url?.trim() || data.logo_url?.trim();
  if (imageUrl) {
    result.embed = { image: { url: imageUrl } };
  }

  return result;
}

/**
 * Create or update a server forum post in Discord.
 * Returns { threadId, messageId } on success, null on failure.
 */
export async function syncServerToDiscord(data: ServerForumData): Promise<{
  threadId: string;
  messageId: string;
} | null> {
  const headers = getBotHeaders();
  const channelId = process.env.DISCORD_SERVERS_FORUM_CHANNEL_ID;
  if (!headers || !channelId) {
    console.warn("[Discord Server] Missing DISCORD_BOT_TOKEN or DISCORD_SERVERS_FORUM_CHANNEL_ID");
    return null;
  }

  const threadName = data.server_name.slice(0, 100);
  const { content, embed } = buildServerPostContent(data);

  const messagePayload: { content: string; embeds?: unknown[] } = { content };
  if (embed?.image) {
    messagePayload.embeds = [{ image: embed.image }];
  }

  if (data.discord_thread_id && data.discord_message_id) {
    const editRes = await fetch(
      `${DISCORD_API}/channels/${data.discord_thread_id}/messages/${data.discord_message_id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(messagePayload),
      }
    ).catch(() => null);

    if (editRes?.ok) {
      return { threadId: data.discord_thread_id, messageId: data.discord_message_id };
    }
  }

  const createRes = await fetch(`${DISCORD_API}/channels/${channelId}/threads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: threadName,
      auto_archive_duration: 10080,
      message: messagePayload,
    }),
  }).catch(() => null);

  if (!createRes?.ok) {
    const errText = await createRes?.text().catch(() => "");
    console.error("[Discord Server] Forum post failed:", createRes?.status, errText);
    return null;
  }

  const thread = (await createRes.json().catch(() => null)) as {
    id?: string;
    last_message_id?: string;
    message?: { id?: string };
  };
  const threadId = thread?.id ? String(thread.id) : null;
  let messageId =
    thread?.message?.id ?? thread?.last_message_id
      ? String(thread?.message?.id ?? thread?.last_message_id ?? "")
      : null;

  if (!threadId) return null;

  if (!messageId) {
    const msgsRes = await fetch(`${DISCORD_API}/channels/${threadId}/messages?limit=1`, {
      headers,
    }).catch(() => null);
    if (msgsRes?.ok) {
      const msgs = (await msgsRes.json().catch(() => [])) as { id?: string }[];
      const first = msgs?.[0];
      if (first?.id) {
        return { threadId, messageId: first.id };
      }
    }
  }

  return { threadId, messageId: messageId || threadId };
}

/**
 * Fetches server from DB and syncs to Discord. Call after insert/update.
 * Only syncs claimed or grandfathered servers—unclaimed servers are not posted to #your-cities.
 */
export async function syncServerToDiscordInBackground(serverId: string): Promise<void> {
  const { getSupabaseAdmin } = await import("@/app/lib/supabaseAdmin");
  const supabase = getSupabaseAdmin();
  const { data: server, error } = await supabase
    .from("servers")
    .select("id, server_name, discord_url, website_url, description, connect_url, region, rp_type, economy_type, discord_thread_id, discord_message_id, banner_url, logo_url, thumbnail_url, claimed_by_user_id, grandfathered")
    .eq("id", serverId)
    .single();

  if (error || !server) return;

  const row = server as { claimed_by_user_id?: string | null; grandfathered?: boolean | null };
  const isClaimed = !!row.claimed_by_user_id;
  const isGrandfathered = !!row.grandfathered;
  if (!isClaimed && !isGrandfathered) return;

  const result = await syncServerToDiscord({
    id: server.id,
    server_name: server.server_name || "",
    discord_url: server.discord_url,
    website_url: server.website_url,
    description: server.description,
    connect_url: server.connect_url,
    region: server.region,
    rp_type: server.rp_type,
    economy_type: server.economy_type,
    discord_thread_id: (server as { discord_thread_id?: string }).discord_thread_id,
    discord_message_id: (server as { discord_message_id?: string }).discord_message_id,
    banner_url: server.banner_url,
    logo_url: (server as { logo_url?: string }).logo_url,
    thumbnail_url: server.thumbnail_url,
  });

  if (result && !(server as { discord_thread_id?: string }).discord_thread_id) {
    await supabase
      .from("servers")
      .update({
        discord_thread_id: result.threadId,
        discord_message_id: result.messageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serverId);
  }
}
