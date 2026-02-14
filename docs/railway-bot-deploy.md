# Host the Discord Bot 24/7 on Railway

This lets the bot run even when your PC is off. You can reply from Discord on your phone anytime.

---

## Step 1: Create a Railway account

1. Go to **https://railway.app**
2. Click **Login** → sign in with **GitHub** (easiest)

---

## Step 2: Create a new project

1. Click **New Project**
2. Choose **Deploy from GitHub repo**
3. Connect GitHub if asked, then select your **gta-mlo-map** repo
4. If the repo isn’t on GitHub yet, choose **Empty Project** and we’ll deploy another way

---

## Step 3: Configure the service

1. After the project is created, click the service (or **Add Service** → **GitHub Repo**).
2. In the service settings, find **Settings** → **Build & Deploy**.
3. Set:
   - **Root Directory:** leave blank (uses repo root)
   - **Build Command:** `npm install`
   - **Start Command:** `npm run bot`
4. Click **Deploy** (or Railway deploys automatically).

---

## Step 4: Add environment variables

1. Click your service.
2. Open the **Variables** tab.
3. Click **Add Variable** and add these (use the same values as `.env.local`):

| Variable | Value |
|----------|-------|
| `DISCORD_BOT_TOKEN` | Your bot token |
| `DISCORD_CHAT_CHANNEL_ID` | Your channel ID (e.g. 1472008469916680304) |
| `CHAT_DISCORD_REPLY_SECRET` | Same secret as in Vercel |
| `CHAT_API_URL` | `https://mlomesh.vercel.app` |

4. Save. Railway will redeploy with the new variables.

---

## Step 5: Check that it’s running

1. Open the **Deployments** tab.
2. Click the latest deployment.
3. Open **View Logs**.
4. You should see: `Discord chat bot ready. Bot: YourBot#1234` and `Channel OK: #mlomesh-live-chat`.

---

## If your code isn’t on GitHub

Use **Deploy from local** instead:

1. Install Railway CLI: `npm install -g @railway/cli`
2. Run `railway login` and sign in.
3. In your project folder: `railway init` → create/link a project.
4. Run `railway up` to deploy (or `railway link` then push to deploy from a connected repo).

---

## Cost

Railway has a **free trial** with credits. A small bot usually stays within free usage. After the trial, you may need to add a payment method; usage is typically low.

---

When the bot is deployed, you can close your Command Prompt. It will run on Railway and replies in Discord will work from your phone or anywhere.
