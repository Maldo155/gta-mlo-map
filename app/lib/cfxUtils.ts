/** Extract Cfx.re server code from connect URL (e.g. cfx.re/join/abc123 → abc123) */
export function extractCfxId(url: string): string | null {
  const trimmed = String(url || "").trim();
  if (!trimmed) return null;

  // servers.fivem.net/servers/detail/CODE (detail page URL)
  let match = trimmed.match(/(?:servers\.fivem\.net|cfx\.re)\/servers\/detail\/([a-z0-9]+)/i);
  if (match) return match[1].toLowerCase();

  // Standard: cfx.re/join/CODE or fivem.net/join/CODE or connect.fivem.net/join/CODE
  match = trimmed.match(/(?:cfx\.re|connect\.fivem\.net|fivem\.net)\/join\/([a-z0-9]+)/i);
  if (match) return match[1].toLowerCase();

  // fivem://connect/CODE
  match = trimmed.match(/fivem:\/\/connect\/([a-z0-9]+)/i);
  if (match) return match[1].toLowerCase();

  // Bare code: https://byejz8 or just byejz8 (alphanumeric 4-16 chars, no path)
  const bare = trimmed.replace(/^https?:\/\//i, "").split("/")[0]?.split("?")[0] || trimmed;
  if (/^[a-z0-9]{4,16}$/i.test(bare)) return bare.toLowerCase();

  return null;
}

/** Get the proper connect URL for joining. Converts detail page URLs to cfx.re/join/CODE. */
export function getConnectUrl(connectUrl: string | null | undefined, cfxId: string | null | undefined): string | null {
  const url = String(connectUrl || "").trim();
  const id = cfxId || extractCfxId(url);
  if (id && (!url || /servers\.fivem\.net\/servers\/detail\//i.test(url) || /cfx\.re\/servers\/detail\//i.test(url))) {
    return `https://cfx.re/join/${id}`;
  }
  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("fivem://") ? url : `https://${url}`;
}
