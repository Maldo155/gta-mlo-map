# Live Chat + Discord Setup – Simple Guide

This lets you **reply to live chat visitors from Discord** instead of going to the Admin page on your site. If that sounds good, follow these steps.

---

# Part 1: The Secret (Password for the Bot)

## What is this?
The bot needs a secret password to talk to your website. You create it once, then add it in two places.

---

### Step 1: Make a random password

**Easiest way (use a website):**

1. Open your web browser.
2. Go to: **https://www.random.org/strings**
3. Set:
   - "Length" = **32**
   - "Quantity" = **1**
4. Click **Get Strings**.
5. Copy the string you get (e.g. `aB3xK9mP2...`).
6. Paste it into Notepad and save. You’ll use it in the next steps.

---

### Step 2: Add it to Vercel

1. Open **vercel.com** in your browser and log in.
2. On the Dashboard, click your **MLOMesh** project.
3. Click **Settings** at the top.
4. In the left menu, click **Environment Variables**.
5. You’ll see a form:
   - **Key:** type exactly: `CHAT_DISCORD_REPLY_SECRET`
   - **Value:** paste the password you copied from Step 1
6. Choose **Production** (and Preview if you want).
7. Click **Save**.

Done for Part 1.

---

# Part 2: The Discord Bot

## What is this?
A bot that sits in your Discord channel. When you reply to a live chat message there, it sends your reply to the website so the visitor sees it.

---

### Step 3: Create the bot on Discord

1. Go to **https://discord.com/developers/applications** and log in.
2. Click **New Application** (top right).
3. Type a name (e.g. `MLOMesh Chat Bot`) and click **Create**.
4. In the left sidebar, click **Bot**.
5. Click **Add Bot** → **Yes, do it!**.
6. Scroll down to **Privileged Gateway Intents**.
7. Turn **MESSAGE CONTENT INTENT** **ON** (it’s a switch).
8. Click **Reset Token**.
9. Click **Copy** to copy the token. Paste it into Notepad. **Do not share this token with anyone.**

---

### Step 4: Invite the bot to your server

1. Still on discord.com/developers, click **OAuth2** in the left sidebar.
2. Click **URL Generator**.
3. Under **SCOPES**, check the box for **bot**.
4. Under **BOT PERMISSIONS**, check:
   - **View Channel**
   - **Read Message History**
   - **Send Messages in Threads**
   - **Create Public Threads** (so the site can create threads for each chat)
   - **Manage Threads** (archive threads when chats end)
5. At the bottom, you’ll see a long URL. Copy it.
6. Open a new browser tab, paste the URL, and press Enter.
7. Choose your Discord server from the dropdown.
8. Click **Authorize**.
9. Complete the captcha if asked.

The bot should now appear in your server.

---

### Step 5: Get your channel ID

Your bot needs to know which Discord channel has the live chat messages.

**Turn on Developer Mode first:**

1. Open Discord (app or website).
2. Click the **gear** (User Settings).
3. Go to **App Settings** → **Advanced**.
4. Turn **Developer Mode** ON.

**Then get the channel ID:**

1. In your server, find the channel where live chat messages appear.
2. **Right‑click** the channel name.
3. Click **Copy Channel ID**.
4. Paste that number into Notepad (e.g. `1234567890123456789`).

---

### Step 6: Put everything in .env.local

1. Open your project folder: `gta-mlo-map` (on your Desktop).
2. Open the file named **`.env.local`** in Notepad or VS Code.  
   - If it doesn’t exist, create a new file and name it exactly `.env.local`.
3. Add these lines (replace the placeholders with your real values):

```
DISCORD_BOT_TOKEN=paste_the_bot_token_from_step_3
DISCORD_CHAT_CHANNEL_ID=paste_the_channel_id_from_step_5
CHAT_DISCORD_REPLY_SECRET=paste_the_secret_from_step_1
CHAT_API_URL=https://mlomesh.vercel.app
```

**Example** (don’t use these values, use yours):

```
DISCORD_BOT_TOKEN=MTQ2ODY0MzkzOTE1MzA4NDUwNA.GYziRy.xxxx
DISCORD_CHAT_CHANNEL_ID=1468638823633260650
CHAT_DISCORD_REPLY_SECRET=aB3xK9mP2...
CHAT_API_URL=https://mlomesh.vercel.app
```

4. Save the file.

---

### Step 7: Run the bot

1. Open **Command Prompt** or **PowerShell** (search for it in the Windows start menu).
2. Type:
   ```
   cd C:\Users\eddy_\Desktop\gta-mlo-map
   ```
   (Or your actual path if different.)
3. Press Enter.
4. Type:
   ```
   node scripts/discord-chat-bot/index.js
   ```
5. Press Enter.

If it works, you’ll see: `Discord chat bot ready. Watching channel...`

**Important:** The bot only works while this window stays open. Don’t close it if you want to reply from Discord.

---

### Step 8: How it works

**Each live chat gets its own thread** under #mlomesh-live-chat, named after the visitor (e.g. `john-doe`). So if five people chat at once, each has a separate thread—no mixing.

1. When someone sends a live chat message, a **new thread** opens in your Discord channel (or their message appears in their existing thread).
2. **Click into that thread** and type your reply. Send it.
3. The visitor sees your reply in the chat widget. If it worked, the bot adds ✅ on your message.

When the visitor (or you) ends the chat, that thread is archived automatically.

---

## If something doesn’t work

- **Bot not starting?** Check that `.env.local` has no typos and all values are correct.
- **Replies not showing on site?** Make sure `CHAT_DISCORD_REPLY_SECRET` in Vercel matches the one in `.env.local`, then redeploy.
- **"Missing env" error?** Double‑check that every line in Step 6 is in `.env.local` and has a value.
