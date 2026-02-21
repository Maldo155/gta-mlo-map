# Discord Sign-In Setup

To require Discord login before adding a FiveM server, complete these steps.

## 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, name it (e.g. "MLOMesh")
3. Go to **OAuth2** → **General**
4. Copy your **Client ID** and **Client Secret**
5. Under **Redirects**, add exactly:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Get this from: Supabase Dashboard → Authentication → Providers → Discord → copy the **Callback URL** shown there
6. Save changes

## 2. Enable Discord in Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Discord**
3. Turn **Discord** ON
4. Paste **Client ID** and **Client Secret** from Discord
5. Save

## 3. Add Redirect URLs in Supabase (Critical)

1. **Authentication** → **URL Configuration** → **Redirect URLs**
2. Add **every** URL where users can sign in (must match exactly, including port):
   - Production: `https://mlomesh.vercel.app/auth/callback/client`
   - (Also add `https://mlomesh.vercel.app/auth/callback` if you use the server callback)
   - Custom domain: `https://www.mlomesh.com.isla.pr/auth/callback` (if used)
   - Local dev: `http://127.0.0.1:3000/auth/callback/client` — use 127.0.0.1 only. **Remove** `http://localhost:3000/auth/callback` if present; Supabase may redirect to localhost instead of 127.0.0.1, and cookies won’t transfer (different origin).
3. **Site URL** must match where users actually sign in. If you use `https://mlomesh.vercel.app`, set Site URL to that—not a different domain. A mismatch can cause Supabase to redirect incorrectly and drop the auth code.
4. Save changes

## 4. Run the user_id migration

Run this SQL in Supabase SQL Editor:

```sql
alter table public.servers add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists servers_user_id_idx on servers(user_id);
```

Or run the file: `supabase/servers-add-user-id.sql`

---

## Troubleshooting

### "Sign-in failed" after authorizing on Discord

**Common causes:**

1. **Redirect URL mismatch**  
   The exact URL you use (including port) must be in Supabase’s Redirect URLs.

   - On localhost? Use `http://localhost:3000/auth/callback` (or your actual port)
   - On live site? Use `https://yourdomain.com/auth/callback`
   - When running locally, the login page shows the redirect URL to add

2. **Cross-origin flow**  
   Do not start sign-in on one origin and finish on another (e.g. localhost vs. live site).  
   Complete the whole flow on the same site.

3. **Code already used**  
   Each auth code is single-use. If you retry, start a new sign-in from the login page.

### Redirected to wrong site (e.g. live site when on localhost)

Supabase redirects to the Site URL when your `redirectTo` is not in the allow list.

- Add `http://localhost:XXXX/auth/callback` (with your actual port) to Supabase Redirect URLs
- When running locally, the login page shows the exact URL to add

### Discord "Sign in" button disappears

This can mean a partial or stale session. Use "Try again" from the error page or open `/login` directly and sign in again.

---

After setup:

- Users must sign in with Discord to add a server
- `/login` shows "Sign in with Discord"
- `/servers/submit` prompts for sign-in if not authenticated
- Server submissions are linked to the authenticated user

---

## Admin panel sign-in

If email logins are disabled in Supabase, use **Sign in with Discord** on the admin page (`/admin`).

1. **Use 127.0.0.1 for local dev** – Open `http://127.0.0.1:3000/admin` (not localhost). Supabase’s auth server fails to parse `localhost` URLs.
2. Add `http://127.0.0.1:3000/auth/callback` to Supabase Redirect URLs (not localhost).
3. Add your Discord account’s **email** to `ADMIN_EMAILS` in `.env.local`.
4. Sign in with Discord from the admin login.
