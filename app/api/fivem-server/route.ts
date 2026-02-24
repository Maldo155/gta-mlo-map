/**
 * Fetch full FiveM server data by CFX code.
 * Used for claim flow and admin "Add from FiveM" feature.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toLowerCase();
  if (!code || !/^[a-z0-9]+$/.test(code)) {
    return NextResponse.json(
      { error: "Invalid CFX code. Use the code from cfx.re/join/xxxxx" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(code)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch server data" },
        { status: 502 }
      );
    }

    const json = await res.json();
    const d = json.Data ?? json;

    // Extract Discord from vars (e.g. "dc.gg/edot" or full URL)
    const vars = d.vars ?? {};
    let discordUrl = typeof vars.discord === "string" ? vars.discord.trim() : "";
    if (discordUrl && !discordUrl.startsWith("http")) {
      discordUrl = discordUrl.includes("discord.gg")
        ? `https://${discordUrl}`
        : `https://discord.gg/${discordUrl.replace(/^dc\.gg\/?/i, "").trim()}`;
    }

    const hostname =
      typeof d.hostname === "string"
        ? d.hostname.replace(/\^[0-9]/g, "").trim()
        : "";
    const gametype = typeof d.gametype === "string" ? d.gametype : "";
    const clients = typeof d.clients === "number" ? d.clients : 0;
    const svMaxclients =
      typeof d.sv_maxclients === "number" ? d.sv_maxclients : d.svMaxclients ?? 0;

    return NextResponse.json({
      cfx_code: code,
      hostname,
      gametype,
      clients,
      max_slots: svMaxclients,
      discord_url: discordUrl || null,
      connect_url: `https://cfx.re/join/${code}`,
    });
  } catch (err) {
    console.error("[FiveM server fetch]", err);
    return NextResponse.json(
      { error: "Could not reach FiveM servers" },
      { status: 502 }
    );
  }
}
