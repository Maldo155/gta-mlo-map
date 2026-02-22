export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { extractCfxId } from "@/app/lib/cfxUtils";
import { syncServerToDiscordInBackground } from "@/app/lib/discordServerForum";
import type { Server } from "@/app/lib/serverTags";

const TABLE = "servers";

const VALID_REGIONS = ["NA", "EU", "SA", "OC", "ASIA", "OTHER"] as const;
const VALID_ECONOMY = ["realistic", "boosted", "hardcore", "vmenu", "custom"] as const;
const VALID_RP = ["serious", "semi", "casual"] as const;
const VALID_CRIMINAL = ["heists", "gangs", "drugs", "vehicles", "organized", "mixed", "minimal"] as const;
const VALID_LOOKING_FOR = ["leo", "ems", "gangs", "mc", "staff", "fire", "doj", "mechanic", "realtor", "news"] as const;

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("featured", { ascending: false })
    .order("featured_order", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: likesData } = await supabase
    .from("server_likes")
    .select("server_id");
  const likeCountMap: Record<string, number> = {};
  for (const row of likesData || []) {
    const sid = row.server_id as string;
    likeCountMap[sid] = (likeCountMap[sid] || 0) + 1;
  }

  const servers = (data || []).map((s: { id: string; views?: number }) => ({
    ...s,
    views: s.views ?? 0,
    like_count: likeCountMap[s.id] ?? 0,
  })) as Server[];

  const res = NextResponse.json({ servers });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json(
      { error: "Sign in required. Please sign in with Discord to add a server." },
      { status: 401 }
    );
  }

  const { data: userData, error: authError } =
    await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  const body = await req.json();

  const serverName = String(body.server_name || "").trim();
  let connectUrl = String(body.connect_url || "").trim();
  if (
    connectUrl &&
    !connectUrl.startsWith("http://") &&
    !connectUrl.startsWith("https://") &&
    !connectUrl.startsWith("fivem://")
  ) {
    connectUrl = `https://${connectUrl}`;
  }

  const discordUrl = typeof body.discord_url === "string" ? body.discord_url.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!serverName || !discordUrl || !description) {
    return NextResponse.json(
      { error: "server_name, discord_url, and description are required" },
      { status: 400 }
    );
  }

  const region = VALID_REGIONS.includes(body.region)
    ? body.region
    : null;
  const economyType = VALID_ECONOMY.includes(body.economy_type)
    ? body.economy_type
    : null;
  const rpType = VALID_RP.includes(body.rp_type) ? body.rp_type : null;
  const criminalTypes = Array.isArray(body.criminal_types)
    ? body.criminal_types.filter((t: unknown) =>
        typeof t === "string" && VALID_CRIMINAL.includes(t as (typeof VALID_CRIMINAL)[number])
      )
    : [];
  const lookingForTypes = Array.isArray(body.looking_for_types)
    ? body.looking_for_types.filter((t: unknown) =>
        typeof t === "string" && VALID_LOOKING_FOR.includes(t as (typeof VALID_LOOKING_FOR)[number])
      )
    : [];

  const mloIds = Array.isArray(body.mlo_ids)
    ? body.mlo_ids.filter((id: unknown) => typeof id === "string")
    : [];
  const creatorKeys = Array.isArray(body.creator_keys)
    ? body.creator_keys.filter((k: unknown) => typeof k === "string" && String(k).trim().length > 0).map((k: string) => String(k).trim().toLowerCase())
    : [];
  const cfxIdExplicit =
    typeof body.cfx_id === "string" && /^[a-z0-9]+$/i.test(body.cfx_id.trim())
      ? body.cfx_id.trim().toLowerCase()
      : null;
  const cfxId = cfxIdExplicit || extractCfxId(connectUrl);

  const payload = {
    user_id: userData.user.id,
    server_name: serverName,
    owner_name: body.owner_name?.trim() || null,
    region,
    language: body.language?.trim() || "English",
    avg_player_count:
      typeof body.avg_player_count === "number" ? body.avg_player_count : null,
    max_slots: typeof body.max_slots === "number" ? body.max_slots : null,
    connect_url: connectUrl || null,
    discord_url: discordUrl || null,
    website_url: body.website_url?.trim() || null,
    description: description || null,
    economy_type: economyType,
    rp_type: rpType,
    whitelisted: Boolean(body.whitelisted),
    pd_active: body.pd_active !== false,
    ems_active: body.ems_active !== false,
    criminal_types: criminalTypes.length > 0 ? criminalTypes : null,
    criminal_other: typeof body.criminal_other === "string" ? body.criminal_other.trim() || null : null,
    looking_for_types: lookingForTypes.length > 0 ? lookingForTypes : null,
    looking_for_other: typeof body.looking_for_other === "string" ? body.looking_for_other.trim() || null : null,
    civ_jobs_count:
      typeof body.civ_jobs_count === "number" ? body.civ_jobs_count : null,
    custom_mlo_count:
      typeof body.custom_mlo_count === "number" ? body.custom_mlo_count : null,
    custom_script_count:
      typeof body.custom_script_count === "number"
        ? body.custom_script_count
        : null,
    no_pay_to_win: Boolean(body.no_pay_to_win),
    controller_friendly: Boolean(body.controller_friendly),
    new_player_friendly: body.new_player_friendly !== false,
    features_other: typeof body.features_other === "string" ? body.features_other.trim() || null : null,
    mlo_ids: mloIds,
    creator_keys: creatorKeys.length > 0 ? creatorKeys : null,
    cfx_id: cfxId,
    banner_url: body.banner_url?.trim() || null,
    thumbnail_url: body.thumbnail_url?.trim() || null,
    logo_url: body.logo_url?.trim() || null,
  };

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serverId = data?.id;
  if (serverId) {
    syncServerToDiscordInBackground(serverId).catch((err) =>
      console.error("[Server Discord Sync]", err)
    );
  }

  return NextResponse.json({ id: serverId, success: true });
}
