# Discord FiveM Servers Forum Setup

When a FiveM server is added or edited, the site automatically creates or updates a forum post in your Discord `#your-cities` channel.

## What the bot does

1. **New server** → Creates a new forum post (thread) in `#your-cities` with:
   - Server name
   - Description, connect link, Discord, website
   - Region and RP type
   - Link to server page on MLOMesh
   - Banner/thumbnail (if set)

2. **Updated server** → Edits the existing forum post with the new info

## Setup steps

### 1. Run the database migration

In Supabase SQL Editor, run:

```sql
-- From supabase/servers-discord-forum-fields.sql
ALTER TABLE public.servers
  ADD COLUMN IF NOT EXISTS discord_thread_id text,
  ADD COLUMN IF NOT EXISTS discord_message_id text;
```

### 2. Create a Forum channel

Your `#your-cities` channel must be a **Forum channel** (same type as `#your-creators`).  
If it's a regular text channel, create a new Forum channel in your "Your FiveM Cities" category.

### 3. Add env vars

Add to `.env.local` and Vercel:

```
DISCORD_SERVERS_FORUM_CHANNEL_ID=your_channel_id
```

**Get the channel ID:**
1. Enable Developer Mode: User Settings → App Settings → Advanced → Developer Mode → On
2. Right-click `#your-cities` → Copy Channel ID
3. Paste into `DISCORD_SERVERS_FORUM_CHANNEL_ID`

Uses the same `DISCORD_BOT_TOKEN` as creators/live chat.

### 4. Sync to Vercel and deploy

```bash
node scripts/sync-env-to-vercel.js
npx vercel --prod
```

### 5. Backfill existing servers

To sync your 5 existing servers to Discord, call the admin sync endpoint:

```bash
# With your admin auth (Bearer token or X-Admin-Dev-Secret on localhost)
curl -X POST https://mlomesh.com/api/servers/sync-discord \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Or from the admin page in browser dev tools, or use the admin dev secret on localhost:

```bash
curl -X POST http://localhost:3000/api/servers/sync-discord \
  -H "X-Admin-Dev-Secret: YOUR_DEV_SECRET"
```

Response: `{ "synced": 5, "total": 5, "message": "..." }`
