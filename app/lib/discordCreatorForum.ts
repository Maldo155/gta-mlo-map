/**
 * Discord forum sync for creator tiles.
 * Creates/updates forum posts in #your-creators when creator tiles are saved.
 * Uses DISCORD_BOT_TOKEN and DISCORD_CREATORS_FORUM_CHANNEL_ID.
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

function formatDisplayName(creatorKey: string): string {
  return String(creatorKey || "")
    .trim()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type CreatorForumData = {
  creator_key: string;
  creator_discord_invite?: string | null;
  creator_description?: string | null;
  creator_website_url?: string | null;
  creator_discord_thread_id?: string | null;
  creator_discord_message_id?: string | null;
  button_url?: string | null;
  logo_url?: string | null;
  mlo_count: number;
};

function buildCreatorPostContent(data: CreatorForumData): { content: string; embed?: { image?: { url: string } } } {
  const mapUrl = `${getMapBaseUrl()}/map?creator=${encodeURIComponent(data.creator_key)}`;
  const lines: string[] = [];

  if (data.creator_description?.trim()) {
    lines.push(`"${data.creator_description.trim()}" -`);
    lines.push("");
  }

  lines.push("✨ Creator on MLOMesh");
  lines.push(`📍 View on map: ${mapUrl}`);
  if (data.creator_discord_invite?.trim()) {
    lines.push(`🔗 Discord: ${data.creator_discord_invite.trim()}`);
  }
  const websiteUrl = data.creator_website_url?.trim() || data.button_url?.trim();
  if (websiteUrl) {
    lines.push(`🌐 Website: ${websiteUrl}`);
  }
  lines.push(`• ${data.mlo_count} Premium MLOs`);

  const content = lines.join("\n");
  const result: { content: string; embed?: { image?: { url: string } } } = { content };

  if (data.logo_url?.trim()) {
    result.embed = { image: { url: data.logo_url.trim() } };
  }

  return result;
}

/**
 * Create or update a creator forum post in Discord.
 * Returns { threadId, messageId } on success, null on failure.
 */
export async function syncCreatorToDiscord(data: CreatorForumData): Promise<{
  threadId: string;
  messageId: string;
} | null> {
  const headers = getBotHeaders();
  const channelId = process.env.DISCORD_CREATORS_FORUM_CHANNEL_ID;
  if (!headers || !channelId) {
    console.warn("[Discord Creator] Missing DISCORD_BOT_TOKEN or DISCORD_CREATORS_FORUM_CHANNEL_ID");
    return null;
  }

  const displayName = formatDisplayName(data.creator_key);
  const { content, embed } = buildCreatorPostContent(data);

  const messagePayload: { content: string; embeds?: unknown[] } = { content };
  if (embed?.image) {
    messagePayload.embeds = [{ image: embed.image }];
  }

  if (data.creator_discord_thread_id && data.creator_discord_message_id) {
    const editRes = await fetch(
      `${DISCORD_API}/channels/${data.creator_discord_thread_id}/messages/${data.creator_discord_message_id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(messagePayload),
      }
    ).catch(() => null);

    if (editRes?.ok) {
      return { threadId: data.creator_discord_thread_id, messageId: data.creator_discord_message_id };
    }
  }

  const threadName = displayName.slice(0, 100);
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
    console.error("[Discord Creator] Forum post failed:", createRes?.status, errText);
    return null;
  }

  const thread = (await createRes.json().catch(() => null)) as {
    id?: string;
    last_message_id?: string;
    message?: { id?: string };
  };
  const threadId = thread?.id ? String(thread.id) : null;
  let messageId = thread?.message?.id ?? thread?.last_message_id
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
