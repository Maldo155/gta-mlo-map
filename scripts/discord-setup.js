/**
 * MLOMesh Discord Server Setup Script
 *
 * Creates categories, channels, and roles. ADD-ONLY - never deletes or modifies
 * existing channels. Your website's submit/contact will keep working.
 *
 * Env vars needed: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID (your server ID)
 * Run: node scripts/discord-setup.js
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

async function createCategory(guildId, token, name, position) {
  return discordRequest(`/guilds/${guildId}/channels`, token, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: 4, // GUILD_CATEGORY
      position,
    }),
  });
}

async function createChannel(guildId, token, name, parentId, type = 0) {
  return discordRequest(`/guilds/${guildId}/channels`, token, {
    method: "POST",
    body: JSON.stringify({
      name,
      type, // 0 = text, 2 = voice
      parent_id: parentId,
    }),
  });
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
    console.error(`
Missing env vars. Set:
  DISCORD_BOT_TOKEN  - Your bot token from Discord Developer Portal
  DISCORD_GUILD_ID   - Your server ID (right-click server icon → Copy Server ID)

Example:
  DISCORD_BOT_TOKEN=your_token DISCORD_GUILD_ID=your_server_id node scripts/discord-setup.js

Or add to .env.local and run: node scripts/discord-setup.js
`);
    process.exit(1);
  }

  console.log("MLOMesh Discord Setup - ADD ONLY (never removes existing channels)\n");
  console.log("Creating categories, channels, and roles...\n");

  const created = { categories: [], channels: [], roles: [] };
  let position = 0;

  try {
    // 1. Categories
    const catAnnouncements = await createCategory(guildId, token, "📢 Announcements", position++);
    created.categories.push(catAnnouncements);
    console.log("  ✓ Category: Announcements");

    const catGeneral = await createCategory(guildId, token, "💬 General", position++);
    created.categories.push(catGeneral);
    console.log("  ✓ Category: General");

    const catSubmissions = await createCategory(guildId, token, "📥 Submissions & MLO", position++);
    created.categories.push(catSubmissions);
    console.log("  ✓ Category: Submissions & MLO");

    const catSupport = await createCategory(guildId, token, "🆘 Support", position++);
    created.categories.push(catSupport);
    console.log("  ✓ Category: Support");

    const catAdmin = await createCategory(guildId, token, "🔧 Admin", position++);
    created.categories.push(catAdmin);
    console.log("  ✓ Category: Admin");

    // 2. Channels
    const chAnnouncements = await createChannel(guildId, token, "announcements", catAnnouncements.id);
    created.channels.push(chAnnouncements);
    console.log("  ✓ #announcements");

    const chRules = await createChannel(guildId, token, "rules", catAnnouncements.id);
    created.channels.push(chRules);
    console.log("  ✓ #rules");

    const chGeneral = await createChannel(guildId, token, "general", catGeneral.id);
    created.channels.push(chGeneral);
    console.log("  ✓ #general");

    const chMloSubmissions = await createChannel(guildId, token, "mlo-submissions", catSubmissions.id);
    created.channels.push(chMloSubmissions);
    console.log("  ✓ #mlo-submissions");

    const chSupport = await createChannel(guildId, token, "support", catSupport.id);
    created.channels.push(chSupport);
    console.log("  ✓ #support");

    const chContact = await createChannel(guildId, token, "contact-messages", catSupport.id);
    created.channels.push(chContact);
    console.log("  ✓ #contact-messages");

    const chAdminLog = await createChannel(guildId, token, "admin-log", catAdmin.id);
    created.channels.push(chAdminLog);
    console.log("  ✓ #admin-log");

    const chModeration = await createChannel(guildId, token, "moderation", catAdmin.id);
    created.channels.push(chModeration);
    console.log("  ✓ #moderation");

    // 3. Roles
    const roleAdmin = await createRole(guildId, token, "Admin", {
      color: 0xe74c3c,
      permissions: "8", // ADMINISTRATOR
      hoist: true,
    });
    created.roles.push(roleAdmin);
    console.log("  ✓ Role: Admin");

    const roleModerator = await createRole(guildId, token, "Moderator", {
      color: 0x3498db,
      permissions: "268435456", // MANAGE_MESSAGES, KICK_MEMBERS, etc.
      hoist: true,
    });
    created.roles.push(roleModerator);
    console.log("  ✓ Role: Moderator");

    const roleCreator = await createRole(guildId, token, "Creator", {
      color: 0x2ecc71,
      hoist: false,
    });
    created.roles.push(roleCreator);
    console.log("  ✓ Role: Creator");

    const roleMember = await createRole(guildId, token, "Member", {
      color: 0x95a5a6,
      hoist: false,
    });
    created.roles.push(roleMember);
    console.log("  ✓ Role: Member");

    console.log("\n✅ Setup complete!\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("IMPORTANT: Your website was NOT changed.");
    console.log("Submit MLO and Contact still use your existing env vars.");
    console.log("═══════════════════════════════════════════════════════════\n");
    console.log("Channel IDs (for optional migration):");
    console.log(`  MLO Submissions:  ${chMloSubmissions.id}`);
    console.log(`  Contact messages: ${chContact.id}`);
    console.log("\nTo use these new channels:");
    console.log("  1. Create a webhook in #mlo-submissions (Server Settings → Integrations)");
    console.log("  2. Create a webhook in #contact-messages");
    console.log("  3. Update Vercel env:");
    console.log("     DISCORD_CHANNEL_ID=" + chMloSubmissions.id);
    console.log("     DISCORD_WEBHOOK_URL=<webhook URL for contact OR mlo-submissions>");
    console.log("\nTo keep current setup: do nothing. New channels are just for organization.");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();
