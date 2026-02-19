# Discord Creator Forum Auto-Sync Setup

When you add or update a **creator tile** in the admin panel, the site automatically creates or updates a forum post in your Discord `#your-creators` channel.

## What the bot does

1. **New creator tile** → Creates a new forum post (thread) in `#your-creators` with:
   - Creator name (no stars; you add those manually for partners)
   - Map link
   - Optional: description, Discord invite, website
   - MLO count
   - Logo image (if set)

2. **Updated creator tile** → Edits the existing forum post with the new info

3. Works even when Discord invite and description are left empty

## Env vars (required)

Add to `.env.local` and Vercel production:

```
DISCORD_CREATORS_FORUM_CHANNEL_ID=your_channel_id
NEXT_PUBLIC_SITE_URL=https://www.mlomesh.com
```

`NEXT_PUBLIC_SITE_URL` must be your **live** site URL (e.g. `https://www.mlomesh.com`). It is used for the "View on map" link in Discord posts. Never use localhost here.

### How to get the channel ID

1. Enable **Developer Mode** in Discord: User Settings → App Settings → Advanced → Developer Mode → On
2. Right‑click `#your-creators` → **Copy Channel ID**
3. Paste that value into `DISCORD_CREATORS_FORUM_CHANNEL_ID`

## Bot permissions

The same bot used for live chat (`DISCORD_BOT_TOKEN`) is used. It needs:

- **Send Messages** (or equivalent)
- Access to the channel `#your-creators`

If the bot is already in your server with basic permissions, it should work.

## Syncing env to Vercel

Run:

```bash
node scripts/sync-env-to-vercel.js
```

This pushes `DISCORD_CREATORS_FORUM_CHANNEL_ID` (and other vars) to Vercel. Then redeploy:

```bash
npx vercel --prod
```

## Manual partner stars

Stars (⭐) next to creator names are **not** added by the bot. Add or remove them manually in Discord as needed for partners.
