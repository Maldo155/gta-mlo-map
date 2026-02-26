export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const CACHE_MS = 45_000; // 45 seconds
const cache = new Map<string, { data: { players: number; max: number }; expires: number }>();

/**
 * Live player count from FiveM servers-frontend API.
 * Always returns keyed format: { "code": { players, max } } so clients parse consistently.
 * Used by LivePlayerCount (per-card fetch) - do not switch to batch without updating all clients.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const codesParam = searchParams.get("codes");
  const codes = code
    ? [code]
    : codesParam
      ? codesParam.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

  if (codes.length === 0) {
    return NextResponse.json({ error: "Provide code or codes param" }, { status: 400 });
  }
  if (codes.length > 50) {
    return NextResponse.json({ error: "Max 50 codes" }, { status: 400 });
  }

  const now = Date.now();
  const result: Record<string, { players: number; max: number } | null> = {};
  const toFetch: string[] = [];

  const codeLower = (x: string) => x.toLowerCase();
  for (const c of codes) {
    const key = codeLower(c);
    const cached = cache.get(key);
    if (cached && cached.expires > now) {
      result[c] = cached.data;
    } else {
      toFetch.push(c);
    }
  }

  if (toFetch.length > 0) {
    async function fetchOne(code: string): Promise<{ code: string; data: { players: number; max: number } | null }> {
      const url = `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(code)}`;
      const opts = {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; MLOMesh/1.0; +https://mlomesh.vercel.app)",
        },
        signal: AbortSignal.timeout(10000),
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(url, opts);
          if (!res.ok) {
            if (attempt < 1) await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          const json = await res.json();
          const d = json.Data ?? json;
          const vars = d.vars ?? {};
          const players =
            typeof d.clients === "number" ? d.clients
            : typeof json.selfReportedClients === "number" ? json.selfReportedClients
            : typeof d.players?.count === "number" ? d.players.count
            : Array.isArray(d.players) ? d.players.length
            : typeof d.Players === "number" ? d.Players
            : typeof json.clients === "number" ? json.clients
            : 0;
          const max =
            typeof d.sv_maxclients === "number" ? d.sv_maxclients
            : typeof d.svMaxclients === "number" ? d.svMaxclients
            : typeof json.svMaxclients === "number" ? json.svMaxclients
            : typeof d.slots === "number" ? d.slots
            : (() => { const v = vars.sv_maxClients ?? vars.sv_maxclients; return typeof v === "number" ? v : (typeof v === "string" ? parseInt(v, 10) : 0); })();
          const maxValid = typeof max === "number" && !Number.isNaN(max) ? max : 0;
          return { code, data: { players, max: maxValid } };
        } catch {
          if (attempt < 1) await new Promise((r) => setTimeout(r, 1500));
        }
      }
      return { code, data: null };
    }
    const fetched = await Promise.all(toFetch.map(fetchOne));
    for (const { code: c, data } of fetched) {
      result[c] = data;
      if (data) cache.set(c.toLowerCase(), { data, expires: now + CACHE_MS });
    }
  }

  // Always return keyed by code so all clients parse the same way
  const normalized: Record<string, { players: number; max: number } | null> = {};
  for (const [k, v] of Object.entries(result)) {
    normalized[k.toLowerCase()] = v;
  }
  const body: Record<string, { players: number; max: number } | null> = {};
  for (const c of codes) {
    const key = c.toLowerCase();
    body[key] = normalized[key] ?? null;
  }
  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}
