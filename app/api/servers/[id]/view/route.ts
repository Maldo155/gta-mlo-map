export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("views")
    .eq("id", id)
    .single();

  if (fetchError || !server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const nextViews = (Number(server.views) || 0) + 1;
  const { error: updateError } = await supabase
    .from("servers")
    .update({ views: nextViews })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ views: nextViews });
}
