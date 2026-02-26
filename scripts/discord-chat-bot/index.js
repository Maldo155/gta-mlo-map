/**
 * Discord Live Chat Bot – forwards staff replies from Discord to the live chat.
 *
 * When staff reply to a live chat notification message in Discord, this bot
 * parses the Thread ID from the embed and POSTs the reply to the site API.
 *
 * Required env:
 *   DISCORD_BOT_TOKEN          - Bot token from Discord Developer Portal
 *   DISCORD_CHAT_CHANNEL_ID    - Channel ID where live chat webhooks are posted
 *   CHAT_DISCORD_REPLY_SECRET  - Secret for /api/chat/discord-reply (must match Vercel env)
 *   CHAT_API_URL               - Site base URL (e.g. https://mlomesh.vercel.app)
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env.local") });

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const PARENT_CHANNEL_ID = process.env.DISCORD_CHAT_CHANNEL_ID;
const MEMBER_LEAVE_CHANNEL_ID = process.env.DISCORD_MEMBER_LEAVE_CHANNEL_ID;
const SECRET = process.env["CHAT_DISCORD_REPLY_SECRET"];
const API_BASE = (process.env["CHAT_API_URL"] || process.env.NEXT_PUBLIC_SITE_URL || "https://mlomesh.vercel.app").replace(/\/$/, "");

if (!process.env.DISCORD_BOT_TOKEN || !PARENT_CHANNEL_ID || !SECRET) {
  console.error("Missing env: DISCORD_BOT_TOKEN, DISCORD_CHAT_CHANNEL_ID, CHAT_DISCORD_REPLY_SECRET");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    ...(MEMBER_LEAVE_CHANNEL_ID ? [GatewayIntentBits.GuildMembers] : []),
  ],
  partials: [Partials.Channel, Partials.Message],
});

async function getThreadIdFromChannelId(discordChannelId) {
  const res = await fetch(
    `${API_BASE}/api/chat/thread-by-channel?channelId=${encodeURIComponent(discordChannelId)}`,
    { headers: { "X-Discord-Reply-Secret": SECRET } }
  ).catch(() => null);
  if (!res?.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.threadId || null;
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const content = msg.content?.trim();
  if (!content) return;

  const chId = msg.channelId;
  const parentId = msg.channel?.parentId ?? msg.channel?.parent?.id;
  const isInThread = parentId === PARENT_CHANNEL_ID;
  const isMainChannel = chId === PARENT_CHANNEL_ID;

  if (!isInThread && !isMainChannel) return;

  const threadId = await getThreadIdFromChannelId(chId);
  if (!threadId) return;

  console.log(`[Reply] @${msg.author.username} -> thread ${threadId}`);

  try {
    const res = await fetch(`${API_BASE}/api/chat/discord-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Discord-Reply-Secret": SECRET,
      },
      body: JSON.stringify({ threadId, message: content }),
    });

    if (res.ok) {
      await msg.react("✅").catch(() => {});
    } else {
      const err = await res.text();
      console.error("Reply API error:", res.status, err);
      await msg.react("❌").catch(() => {});
    }
  } catch (e) {
    console.error("Error processing reply:", e);
    await msg.react("❌").catch(() => {});
  }
});

client.on("guildMemberRemove", async (member) => {
  if (!MEMBER_LEAVE_CHANNEL_ID) return;
  try {
    const ch = await client.channels.fetch(MEMBER_LEAVE_CHANNEL_ID);
    if (!ch || typeof ch.send !== "function") return;
    const name = member.user?.tag || member.displayName || "Unknown";
    const count = member.guild?.memberCount ?? "?";
    await ch.send({
      content: `👋 **${name}** left the server. (Members: ${count})`,
    });
  } catch (e) {
    console.error("Member leave announce error:", e.message);
  }
});

client.once("ready", async () => {
  console.log(`Discord chat bot ready. Bot: ${client.user?.tag}`);
  console.log(`Watching threads under channel: ${PARENT_CHANNEL_ID}`);
  if (MEMBER_LEAVE_CHANNEL_ID) console.log(`Member leave announcements: #${(await client.channels.fetch(MEMBER_LEAVE_CHANNEL_ID).catch(() => null))?.name ?? MEMBER_LEAVE_CHANNEL_ID}`);
  const ch = await client.channels.fetch(PARENT_CHANNEL_ID).catch((e) => {
    console.error(`Cannot access channel:`, e.message);
    return null;
  });
  if (ch) console.log(`Channel OK: #${ch.name}`);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((e) => {
  console.error("Login failed:", e);
  process.exit(1);
});
