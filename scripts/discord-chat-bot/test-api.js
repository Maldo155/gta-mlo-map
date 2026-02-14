/**
 * Test if the discord-reply API works.
 * Run: node scripts/discord-chat-bot/test-api.js
 * Uses .env.local for CHAT_DISCORD_REPLY_SECRET and CHAT_API_URL.
 * Pass a thread ID as argument, or it will prompt you to get one from a live chat.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env.local") });

const SECRET = process.env.CHAT_DISCORD_REPLY_SECRET;
const API_BASE = (process.env.CHAT_API_URL || "https://mlomesh.vercel.app").replace(/\/$/, "");
const threadId = process.argv[2]?.trim();

if (!SECRET) {
  console.error("Missing CHAT_DISCORD_REPLY_SECRET in .env.local");
  process.exit(1);
}

if (!threadId) {
  console.log("Usage: node scripts/discord-chat-bot/test-api.js <threadId>");
  console.log("Get threadId from a Discord live chat embed (Thread ID field).");
  process.exit(1);
}

async function test() {
  console.log(`POST ${API_BASE}/api/chat/discord-reply`);
  console.log(`Thread: ${threadId}`);
  const res = await fetch(`${API_BASE}/api/chat/discord-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Discord-Reply-Secret": SECRET,
    },
    body: JSON.stringify({ threadId, message: "Test reply from API script" }),
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
  if (res.ok) {
    console.log("\n✅ API works! Check the live chat widget - you should see 'Test reply from API script'.");
  } else {
    console.log("\n❌ API failed. Check CHAT_DISCORD_REPLY_SECRET in Vercel matches .env.local");
  }
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
