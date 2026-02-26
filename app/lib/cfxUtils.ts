/** Extract Cfx.re server code from connect URL (e.g. cfx.re/join/abc123 → abc123) */
export function extractCfxId(url: string): string | null {
  const trimmed = String(url || "").trim();
  if (!trimmed) return null;

  // Standard: cfx.re/join/CODE or fivem.net/join/CODE or connect.fivem.net/join/CODE
  let match = trimmed.match(/(?:cfx\.re|connect\.fivem\.net|fivem\.net)\/join\/([a-z0-9]+)/i);
  if (match) return match[1].toLowerCase();

  // fivem://connect/CODE
  match = trimmed.match(/fivem:\/\/connect\/([a-z0-9]+)/i);
  if (match) return match[1].toLowerCase();

  // Bare code: https://byejz8 or just byejz8 (alphanumeric 4-12 chars, no path)
  const bare = trimmed.replace(/^https?:\/\//i, "").split("/")[0] || trimmed;
  if (/^[a-z0-9]{4,12}$/i.test(bare)) return bare.toLowerCase();

  return null;
}
