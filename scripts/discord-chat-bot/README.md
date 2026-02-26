# Discord Live Chat Bot

This bot forwards staff replies from Discord to the live chat so visitors see them on the site.

## How it works

1. Visitor messages are posted to Discord via webhook (each message includes the Thread ID in the embed).
2. When staff **reply** to one of those messages in Discord, this bot:
   - Parses the Thread ID from the message being replied to
   - POSTs the reply to `/api/chat/discord-reply`
   - The visitor sees the message in the live chat widget
3. Reacts with ✅ on success, ❌ on error.

## Setup

### 1. Create a Discord bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot → Add Bot
3. Enable **MESSAGE CONTENT INTENT** (required to read message content)
4. If using member leave announcements: enable **SERVER MEMBERS INTENT**
5. OAuth2 → URL Generator → scope `bot`, permissions `Read Message History`, `View Channel`
6. Invite the bot to your server

### 2. Environment variables

Create `.env.local` (or use your hosting env) with:

```
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHAT_CHANNEL_ID=channel_id_where_webhooks_are_posted
CHAT_DISCORD_REPLY_SECRET=your_random_secret_string
CHAT_API_URL=https://mlomesh.vercel.app

# Optional: announce when members leave
DISCORD_MEMBER_LEAVE_CHANNEL_ID=channel_id_for_leave_announcements
```

- **DISCORD_CHAT_CHANNEL_ID**: The same channel where `DISCORD_WEBHOOK_URL` posts live chat notifications. The bot must be able to read messages in this channel.
- **CHAT_DISCORD_REPLY_SECRET**: Generate a random string (e.g. `openssl rand -hex 24`). Add it to Vercel env as `CHAT_DISCORD_REPLY_SECRET` so the bot can authenticate with the API.
- **DISCORD_MEMBER_LEAVE_CHANNEL_ID** (optional): Channel ID where the bot posts when members leave. Requires **Server Members Intent** in Developer Portal.

### 3. Add secret to Vercel

In your Vercel project → Settings → Environment Variables:

- `CHAT_DISCORD_REPLY_SECRET` = same value as in the bot env

### 4. Run the bot

```bash
node scripts/discord-chat-bot/index.js
```

For 24/7, use PM2 or similar:

```bash
pm2 start scripts/discord-chat-bot/index.js --name discord-chat
```

Or deploy to Railway, Render, etc. and set the env vars there.

### Member leave announcements (optional)

If you set `DISCORD_MEMBER_LEAVE_CHANNEL_ID`, the bot will post a message when someone leaves your server. Enable **Server Members Intent** in the Discord Developer Portal (Bot → Privileged Gateway Intents) for this to work.

## Replying from Discord

1. A new live chat or message appears in the channel (from the webhook).
2. Use Discord’s **Reply** on that message.
3. Type your reply and send.
4. The bot forwards it to the site; the visitor sees it in the live chat widget.
