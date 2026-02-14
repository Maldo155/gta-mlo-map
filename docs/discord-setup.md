# Discord Server Setup Script

Creates a structured Discord server for MLOMesh: categories, channels, and roles. **Add-only** — never deletes or modifies existing channels. Your website's Submit MLO and Contact integrations keep working.

## What It Creates

**Categories:**
- 📢 Announcements
- 💬 General
- 📥 Submissions & MLO
- 🆘 Support
- 🔧 Admin

**Channels:**
- #announcements, #rules
- #general
- #mlo-submissions, #contact-messages
- #support
- #admin-log, #moderation

**Roles:**
- Admin, Moderator, Creator, Member

## Prerequisites

1. **DISCORD_BOT_TOKEN** — From [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Reset Token / Copy
2. **DISCORD_GUILD_ID** — Right-click your server icon → Copy Server ID (enable Developer Mode in User Settings first)
3. **Bot permissions** — The bot must have "Manage Channels" and "Manage Roles". Re-invite with: `applications.commands bot manage_channels manage_roles`

## How to Run

```bash
# From project root
DISCORD_BOT_TOKEN=your_token DISCORD_GUILD_ID=your_server_id node scripts/discord-setup.js
```

Or add to `.env.local`:
```
DISCORD_BOT_TOKEN=your_token
DISCORD_GUILD_ID=your_server_id
```

Then run (Node will read from env if you use dotenv, or export manually):
```bash
node scripts/discord-setup.js
```

## Website Integration (Unchanged)

Your site uses:
- **DISCORD_CHANNEL_ID** — Where MLO submissions are posted (bot or webhook)
- **DISCORD_WEBHOOK_URL** — Used by Contact form (and Submit as fallback)

The script **does not change** these. It only adds new channels. Your existing setup continues to work.

If you want to use the new #mlo-submissions and #contact-messages channels:
1. Create webhooks in those channels (Server Settings → Integrations → Webhooks)
2. Update Vercel env vars with the new channel ID and webhook URL(s)
