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
   - Production (Vercel): `https://mlomesh.vercel.app/auth/callback` and `https://mlomesh.vercel.app/auth/callback/client`
   - **Custom domain** (required if users sign in from it): `https://www.mlomesh.com.isla.pr/**` (or `https://www.mlomesh.com.isla.pr/auth/callback` and `https://www.mlomesh.com.isla.pr/auth/callback/client` if wildcards not allowed)
   - Local dev: `http://localhost:3000/**` and `http://127.0.0.1:3000/**`. Without these, sign-in from localhost will redirect to production and fail with a PKCE error.
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

### Redirected to wrong site (e.g. custom domain → vercel.app, or localhost → production)

Supabase redirects to the Site URL when your `redirectTo` is **not in the Redirect URLs allow list**. If you sign in from `www.mlomesh.com.isla.pr` and land on `mlomesh.vercel.app/login` with "Unable to exchange external code" or "link already used or expired", the custom domain is not in the list.

**Fix for custom domain:**
1. Go to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**
2. Add `https://www.mlomesh.com.isla.pr/**` (or exact: `https://www.mlomesh.com.isla.pr/auth/callback` and `https://www.mlomesh.com.isla.pr/auth/callback/client`)
3. Save. Then sign in again from the custom domain (use a **fresh** sign-in—the old code is already consumed).

### Callback on correct domain but "Unable to exchange" / "already used or expired"

If the callback origin is correct (e.g. `www.mlomesh.com.isla.pr`) but you still get this error:

1. **Use a completely fresh flow** – OAuth codes are single-use and expire quickly. Close all tabs, open an incognito/private window, go to your site, and start sign-in from the page (e.g. `/cities` → Add city → Sign in). Do not retry from the error page.
2. **Use exact Redirect URLs** – If wildcards fail, add:
   - `https://www.mlomesh.com.isla.pr/auth/callback`
   - `https://www.mlomesh.com.isla.pr/auth/callback/client`
3. **Set Site URL** – In Supabase **URL Configuration**, set **Site URL** to your primary domain (e.g. `https://www.mlomesh.com.isla.pr` if that’s what users use). A mismatch can cause Supabase to redirect or validate incorrectly.

**Fix for localhost:**

1. Go to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**
2. Add these URLs for local dev (adjust port if needed):
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
3. Save. Wildcards match all paths and query params, so auth will redirect back to localhost once these are allowed.

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
