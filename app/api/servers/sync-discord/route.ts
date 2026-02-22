/**
 * Admin-only: Sync all FiveM servers to Discord forum (#your-cities).
 * Use this to backfill existing servers that weren't synced when added.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/adminAuth";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { syncServerToDiscordInBackground } from "@/app/lib/discordServerForum";

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const supabase = getSupabaseAdmin();
  const { data: servers, error: fetchError } = await supabase
    .from("servers")
    .select("id")
    .order("created_at", { ascending: false });

  if (fetchError || !servers?.length) {
    return NextResponse.json(
      { synced: 0, message: "No servers found or fetch failed." },
      { status: 200 }
    );
  }

  let synced = 0;
  for (const s of servers) {
    try {
      await syncServerToDiscordInBackground(s.id);
      synced++;
    } catch (err) {
      console.error("[Server Discord Sync]", s.id, err);
    }
  }

  return NextResponse.json({
    synced,
    total: servers.length,
    message: `Synced ${synced} of ${servers.length} servers to Discord.`,
  });
}
