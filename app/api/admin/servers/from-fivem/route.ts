/**
 * Admin-only: Add a server from FiveM API data.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/adminAuth";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { syncServerToDiscordInBackground } from "@/app/lib/discordServerForum";

const FIVEM_API = "https://servers-frontend.fivem.net/api/servers/single";

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
  const manualDiscord = typeof body.discord_url === "string" ? body.discord_url.trim() : "";
  if (!code || !/^[a-z0-9]+$/.test(code)) {
    return NextResponse.json({ error: "Invalid CFX code" }, { status: 400 });
  }

  try {
    const res = await fetch(`${FIVEM_API}/${code}`, {
      headers: { "User-Agent": "MLOMesh/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? "Server not found on FiveM" : "Failed to fetch from FiveM" },
        { status: 400 }
      );
    }

    const data = await res.json();
    const serverData = data?.Data ?? data;
    const vars = serverData?.vars ?? {};
    const discordVar = vars.discord ?? vars.Discord ?? "";

    const hostname = (serverData?.hostname ?? "Unknown")
      .replace(/\^[0-9]/g, "")
      .trim();
    let discordUrl: string | null = null;
    if (manualDiscord) {
      discordUrl = manualDiscord.startsWith("http") ? manualDiscord : `https://${manualDiscord}`;
    } else if (typeof discordVar === "string" && discordVar.trim()) {
      const d = discordVar.trim();
      discordUrl = d.startsWith("http") ? d : `https://${d}`;
    }

    const connectUrl = `https://cfx.re/join/${code}`;

    const payload = {
      server_name: hostname || `FiveM Server ${code}`,
      connect_url: connectUrl,
      discord_url: discordUrl,
      description: vars.sv_projectDesc || vars.sv_projectName || hostname || "FiveM roleplay server.",
      cfx_id: code,
    };

    const { data: inserted, error: insertError } = await getSupabaseAdmin()
      .from("servers")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Server already exists in database" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const serverId = inserted?.id;
    if (serverId) {
      syncServerToDiscordInBackground(serverId).catch((err) =>
        console.error("[Server Discord Sync]", err)
      );
    }

    return NextResponse.json({ id: serverId, success: true });
  } catch (err) {
    console.error("[Admin add from FiveM]", err);
    return NextResponse.json(
      { error: "Failed to add server" },
      { status: 500 }
    );
  }
}
