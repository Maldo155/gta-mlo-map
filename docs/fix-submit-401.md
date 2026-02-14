# Fix submit 401

1. **Supabase** → your project → **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Copy the connection string (use the **Transaction** pooler, port 6543)
4. **Vercel** → your project → **Settings** → **Environment Variables**
5. Add `SUPABASE_DB_URL` with the connection string (Production)
6. Redeploy

This bypasses API keys and connects directly to Postgres.
