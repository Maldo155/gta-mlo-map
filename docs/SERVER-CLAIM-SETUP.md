# Server Claim Setup

The claim flow lets server owners verify ownership via Discord and unlock full listing benefits.

## 1. Database Migration

Run in Supabase SQL editor:

```sql
-- From supabase/servers-claim-migration.sql
alter table public.servers add column if not exists claimable boolean default false;
alter table public.servers add column if not exists claimed_by_user_id uuid;
alter table public.servers add column if not exists authorized_editors text[] default '{}';
alter table public.servers add column if not exists grandfathered boolean default false;
update public.servers set grandfathered = true where grandfathered is null or grandfathered = false;
```

## 2. Discord Bot Setup

1. Create a bot in [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable **Server Members Intent** (Privileged Gateway Intent) in Bot settings
3. Create an invite URL with minimal permissions:
   - Use `permissions=1024` (View Server) or the minimum needed to join
   - Scope: `bot`
4. Set `NEXT_PUBLIC_CLAIM_BOT_INVITE` in your env to this invite URL (e.g. `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1024&scope=bot`)
5. Set `DISCORD_BOT_TOKEN` (same token as your live chat bot, or a dedicated one)

## 3. How It Works

- **Claimable**: Admin toggles this per server in the admin panel. Only claimable servers appear in the "Unclaimed" section and can be claimed.
- **Grandfathered**: Existing servers get `grandfathered = true` and keep full benefits without claiming.
- **Claim flow**: User signs in → enters CFX code → adds bot to their Discord → clicks Verify → backend checks they're owner/admin.

## 4. Testing

1. Create a test Discord server where you're owner/admin
2. Add your server's Discord to FiveM `vars.discord` (or use a server already in your DB)
3. In admin, enable "Claim" for that server
4. Go to /servers/claim, enter CFX code, add bot, verify
