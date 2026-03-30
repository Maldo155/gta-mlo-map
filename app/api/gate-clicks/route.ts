import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

const ROW_ID = 1;

async function getCounts() {
  const { data, error } = await getSupabaseAdmin()
    .from("gate_clicks")
    .select("mlo, map, cities")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    mlo: typeof data?.mlo === "number" ? data.mlo : 0,
    map: typeof data?.map === "number" ? data.map : 0,
    cities: typeof data?.cities === "number" ? data.cities : 0,
  };
}

export async function GET() {
  try {
    const counts = await getCounts();
    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tile = body?.tile;
    if (tile !== "mlo" && tile !== "map" && tile !== "cities") {
      return NextResponse.json({ error: "Invalid tile" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin().rpc("increment_gate_click", {
      p_tile: tile,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows = data as Array<{ mlo: number; map: number; cities: number }> | null;
    const counts = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (counts) {
      return NextResponse.json(counts);
    }

    const fallback = await getCounts();
    return NextResponse.json(fallback);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
