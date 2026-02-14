/**
 * MLOMesh Discord - Create roles only.
 * Run this after giving the bot Manage Roles permission.
 * Run: node --env-file=.env.local scripts/discord-setup-roles.js
 */

const DISCORD_API = "https://discord.com/api/v10";

async function discordRequest(path, token, options = {}) {
  const url = `${DISCORD_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }
  return res.json();
}

async function createRole(guildId, token, name, options = {}) {
  return discordRequest(`/guilds/${guildId}/roles`, token, {
    method: "POST",
    body: JSON.stringify({ name, ...options }),
  });
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Add to .env.local");
    process.exit(1);
  }

  console.log("Creating roles...\n");

  try {
    await createRole(guildId, token, "Admin", {
      color: 0xe74c3c,
      permissions: "8",
      hoist: true,
    });
    console.log("  ✓ Role: Admin");

    await createRole(guildId, token, "Moderator", {
      color: 0x3498db,
      permissions: "268435456",
      hoist: true,
    });
    console.log("  ✓ Role: Moderator");

    await createRole(guildId, token, "Creator", {
      color: 0x2ecc71,
      hoist: false,
    });
    console.log("  ✓ Role: Creator");

    await createRole(guildId, token, "Member", {
      color: 0x95a5a6,
      hoist: false,
    });
    console.log("  ✓ Role: Member");

    console.log("\n✅ Roles created!");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();
