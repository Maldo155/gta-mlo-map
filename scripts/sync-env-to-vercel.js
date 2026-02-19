/**
 * Syncs .env.local to Vercel production env vars.
 * Run: node scripts/sync-env-to-vercel.js
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("No .env.local found.");
  process.exit(1);
}

const needed = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DISCORD_WEBHOOK_URL",
  "DISCORD_BOT_TOKEN",
  "DISCORD_CHANNEL_ID",
  "DISCORD_CREATORS_FORUM_CHANNEL_ID",
  "NEXT_PUBLIC_SITE_URL",
];

const content = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of content.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) {
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function addEnv(key, value) {
  return new Promise((resolve) => {
    const proc = spawn(
      "npx",
      ["vercel", "env", "add", key, "production", "--force"],
      { stdio: ["pipe", "inherit", "inherit"] }
    );
    proc.stdin.write(value + "\n");
    proc.stdin.end();
    proc.on("close", (code) => resolve(code === 0));
  });
}

(async () => {
  console.log("Syncing env vars to Vercel production...\n");
  for (const key of needed) {
    const val = env[key];
    if (!val) {
      console.log(`  Skip ${key} (not in .env.local)`);
      continue;
    }
    process.stdout.write(`  Adding ${key}... `);
    const ok = await addEnv(key, val);
    console.log(ok ? "OK" : "FAIL");
  }
  console.log("\nDone. Redeploy: npx vercel --prod\n");
})();
