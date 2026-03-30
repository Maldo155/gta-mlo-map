import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** Cache for 5 min – widget data changes slowly */
export const revalidate = 300;

const SERVER_ID =
  process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || "1468638822882607500";

function extractInviteCode(url: string): string | null {
  const m = url.match(/discord\.(?:gg|com\/invite)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export async function GET() {
  if (!SERVER_ID.trim()) {
    return NextResponse.json(
      { error: "DISCORD_SERVER_ID not configured" },
      { status: 400 }
    );
  }

  try {
    const widgetRes = await fetch(
      `https://discord.com/api/guilds/${SERVER_ID}/widget.json`,
      { next: { revalidate: 300 } }
    );
    if (!widgetRes.ok) {
      return NextResponse.json(
        { error: "Widget not available" },
        { status: 502 }
      );
    }
    const widget = (await widgetRes.json()) as {
      name?: string;
      instant_invite?: string | null;
      presence_count?: number;
      members?: unknown[];
      id?: string;
    };

    let inviteUrl: string | null = widget.instant_invite || null;
    let online = typeof widget.presence_count === "number" ? widget.presence_count : 0;
    let members = Array.isArray(widget.members) ? widget.members.length : 0;
    let icon: string | null = null;
    let banner: string | null = null;

    const code = inviteUrl ? extractInviteCode(inviteUrl) : null;
    if (code) {
      try {
        const invRes = await fetch(
          `https://discord.com/api/v10/invites/${code}?with_counts=true`,
          { next: { revalidate: 300 } }
        );
        if (invRes.ok) {
          const inv = (await invRes.json()) as {
            approximate_member_count?: number;
            approximate_presence_count?: number;
            guild?: { icon?: string; banner?: string; name?: string };
          };
          if (typeof inv.approximate_member_count === "number")
            members = inv.approximate_member_count;
          if (typeof inv.approximate_presence_count === "number")
            online = inv.approximate_presence_count;
          const g = inv.guild;
          if (g?.icon) icon = g.icon;
          if (g?.banner) banner = g.banner;
        }
      } catch {
        /* ignore invite fetch errors, use widget data */
      }
    }

    const guildId = widget.id || SERVER_ID;

    return NextResponse.json({
      name: widget.name || "Discord",
      inviteUrl,
      online,
      members,
      guildId,
      icon: icon ? `https://cdn.discordapp.com/icons/${guildId}/${icon}.png` : null,
      banner: banner ? `https://cdn.discordapp.com/banners/${guildId}/${banner}.png` : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
