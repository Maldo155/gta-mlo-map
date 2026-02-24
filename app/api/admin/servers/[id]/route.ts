export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const MAX_OG_SERVERS = 20;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await req.json();

  const supabase = getSupabaseAdmin();

  const updates: Record<string, unknown> = {};

  if (typeof body.verified === "boolean") {
    updates.verified = body.verified;
  }

  if (typeof body.claimable === "boolean") {
    updates.claimable = body.claimable;
  }

  if (typeof body.og_server === "boolean") {
    if (body.og_server === true) {
      const { count } = await supabase
        .from("servers")
        .select("*", { count: "exact", head: true })
        .eq("og_server", true);

      const currentServer = await supabase
        .from("servers")
        .select("og_server")
        .eq("id", id)
        .single();

      const alreadyOg = currentServer.data?.og_server === true;
      const ogCount = count ?? 0;

      if (!alreadyOg && ogCount >= MAX_OG_SERVERS) {
        return NextResponse.json(
          { error: `Only ${MAX_OG_SERVERS} servers can have the OG badge. Remove one first.` },
          { status: 400 }
        );
      }
    }
    updates.og_server = body.og_server;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error: updateError } = await supabase
    .from("servers")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
