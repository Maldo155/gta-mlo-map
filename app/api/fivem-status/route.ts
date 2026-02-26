export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const CACHE_MS = 45_000; // 45 seconds
const cache = new Map<string, { data: { players: number; max: number }; expires: number }>();

/** GET ?code=xxx or ?codes=xxx,yyy — returns live player count from FiveM API */
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
    const fetched = await Promise.all(
      toFetch.map(async (c) => {
        try {
          const res = await fetch(
            `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(c)}`,
            { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return { code: c, data: null };
          const json = await res.json();
          const d = json.Data ?? json;
          // FiveM API: clients (common), selfReportedClients, players.count, players.length, Players
          const players =
            typeof d.clients === "number" ? d.clients
            : typeof json.selfReportedClients === "number" ? json.selfReportedClients
            : typeof d.players?.count === "number" ? d.players.count
            : Array.isArray(d.players) ? d.players.length
            : typeof d.Players === "number" ? d.Players
            : typeof json.clients === "number" ? json.clients
            : 0;
          // FiveM API: sv_maxclients, svMaxclients, slots
          const max =
            typeof d.sv_maxclients === "number" ? d.sv_maxclients
            : typeof d.svMaxclients === "number" ? d.svMaxclients
            : typeof d.slots === "number" ? d.slots
            : typeof json.sv_maxclients === "number" ? json.sv_maxclients
            : 0;
          const data = { players, max };
          cache.set(c.toLowerCase(), { data, expires: now + CACHE_MS });
          return { code: c, data };
        } catch {
          return { code: c, data: null };
        }
      })
    );
    for (const { code: c, data } of fetched) {
      result[c] = data;
    }
  }

  // Normalize keys to lowercase so client lookups (cfxCode.toLowerCase()) match
  const normalized: Record<string, { players: number; max: number } | null> = {};
  for (const [k, v] of Object.entries(result)) {
    normalized[k.toLowerCase()] = v;
  }

  if (codes.length === 1) {
    return NextResponse.json(normalized[codes[0].toLowerCase()] ?? null);
  }
  return NextResponse.json(normalized);
}
