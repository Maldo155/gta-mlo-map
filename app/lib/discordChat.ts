/**
 * Discord API helpers for live chat: create threads, post messages.
 * Uses DISCORD_BOT_TOKEN and DISCORD_CHAT_CHANNEL_ID.
 */

const DISCORD_API = "https://discord.com/api/v10";

// Channel types: 0=text, 5=announcement, 15=forum, 16=media
const FORUM_TYPES = [15, 16];

function getBotHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

/** Create a thread in the live chat channel. Returns thread ID (channel ID) or null. */
export async function createLiveChatThread(
  name: string,
  embed: { title: string; fields: { name: string; value: string; inline?: boolean }[] }
): Promise<string | null> {
  const headers = getBotHeaders();
  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
  if (!headers || !channelId) return null;

  const threadName = name
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 95);
  const safeName = threadName || "live-chat";

  // Fetch channel type to support both text and forum channels
  const chanRes = await fetch(`${DISCORD_API}/channels/${channelId}`, { headers }).catch(() => null);
  const channelType = chanRes?.ok ? ((await chanRes.json().catch(() => ({}))) as { type?: number }).type ?? 0 : 0;
  const isForum = FORUM_TYPES.includes(channelType);

  let threadId: string | null = null;

  if (isForum) {
    // Forum/Media: message with embed is required in thread creation
    const threadRes = await fetch(`${DISCORD_API}/channels/${channelId}/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: safeName,
        auto_archive_duration: 10080,
        message: { embeds: [embed] },
      }),
    }).catch(() => null);
    if (!threadRes?.ok) {
      const errBody = await threadRes?.text().catch(() => "");
      console.error("[Discord] Forum thread create failed:", threadRes?.status, errBody);
      return null;
    }
    const thread = (await threadRes!.json().catch(() => null)) as { id?: string };
    threadId = thread?.id ? String(thread.id) : null;
  } else {
    // Text/Announcement: create thread without message, then post embed
    const threadRes = await fetch(`${DISCORD_API}/channels/${channelId}/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: safeName,
        type: 11,
        auto_archive_duration: 10080,
      }),
    }).catch(() => null);
    if (!threadRes?.ok) {
      const errBody = await threadRes?.text().catch(() => "");
      console.error("[Discord] Text thread create failed:", threadRes?.status, errBody);
      return null;
    }
    const thread = (await threadRes!.json().catch(() => null)) as { id?: string };
    threadId = thread?.id ? String(thread.id) : null;
    if (!threadId) return null;

    const msgRes = await fetch(`${DISCORD_API}/channels/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ embeds: [embed] }),
    }).catch(() => null);
    if (!msgRes?.ok) {
      console.error("[Discord] Post to thread failed:", msgRes?.status);
    }
  }

  return threadId;
}

/** Post a message (embed) to a thread. */
export async function postToThread(
  threadId: string,
  embed: { title: string; fields: { name: string; value: string; inline?: boolean }[] }
): Promise<boolean> {
  const headers = getBotHeaders();
  if (!headers) return false;

  const res = await fetch(`${DISCORD_API}/channels/${threadId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ embeds: [embed] }),
  }).catch(() => null);

  return res?.ok ?? false;
}

/** Archive a thread (soft close). */
export async function archiveThread(threadId: string): Promise<boolean> {
  const headers = getBotHeaders();
  if (!headers) return false;

  const res = await fetch(`${DISCORD_API}/channels/${threadId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ archived: true }),
  }).catch(() => null);

  return res?.ok ?? false;
}
