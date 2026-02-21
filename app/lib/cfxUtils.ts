/** Extract Cfx.re server code from connect URL (e.g. cfx.re/join/abc123 → abc123) */
export function extractCfxId(url: string): string | null {
  const trimmed = String(url || "").trim();
  const match = trimmed.match(/(?:cfx\.re|fivem\.net)\/join\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}
