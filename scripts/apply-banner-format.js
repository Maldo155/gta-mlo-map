/**
 * Applies the Neon Cyber format to the FiveM servers banner in Supabase.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Run: node scripts/apply-banner-format.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("No .env.local found. Create it with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of content.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) {
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, key);
  const { error } = await supabase
    .from("site_banner_servers")
    .update({
      font_family: "Bebas Neue",
      title_font_size: 36,
      subtitle_font_size: 18,
      title_font_weight: "900",
      letter_spacing: "1.2px",
      title_font_color: "#ffffff",
      subtitle_color: "#67e8f9",
      background_color: "#0f172a",
      border_color: "#22d3ee",
      animation: "flash",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log("Banner format applied successfully.");
}

main();
