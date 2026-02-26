"use client";

/**
 * Live player count from FiveM API. Each card fetches independently - do NOT switch
 * to batch fetch; the API returns different shapes for single vs multi codes and
 * that caused display bugs. See /api/fivem-status for the API.
 */
import { useEffect, useState } from "react";
import { extractCfxId } from "@/app/lib/cfxUtils";

type Props = {
  connectUrl?: string | null;
  cfxId?: string | null;
  fallbackAvg?: number | null;
  fallbackMax?: number | null;
  variant?: "badge" | "inline";
};

export default function LivePlayerCount({
  connectUrl,
  cfxId,
  fallbackAvg,
  fallbackMax,
  variant = "badge",
}: Props) {
  const [live, setLive] = useState<{ players: number; max: number } | null>(null);
  const code = cfxId || (connectUrl ? extractCfxId(connectUrl) : null);

  useEffect(() => {
    if (!code) return;
    const codeStr = code;
    let cancelled = false;
    async function fetchCount(attempt = 0) {
      try {
        const res = await fetch(`/api/fivem-status?code=${encodeURIComponent(codeStr)}`);
        if (cancelled) return;
        const data = await res.json();
        if (!data || typeof data !== "object") {
          if (attempt < 1) setTimeout(() => fetchCount(attempt + 1), 2000);
          return;
        }
        const key = codeStr.toLowerCase();
        const val = (data as Record<string, unknown>)[key];
        if (val && typeof val === "object" && typeof (val as { players?: number }).players === "number") {
          setLive(val as { players: number; max: number });
        } else if (typeof (data as { players?: number }).players === "number") {
          setLive(data as { players: number; max: number });
        }
      } catch {
        if (attempt < 1 && !cancelled) setTimeout(() => fetchCount(attempt + 1), 2000);
        else setLive(null);
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [code]);

  if (live && (live.players >= 0 || live.max > 0)) {
    if (variant === "badge") {
      return (
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(34, 197, 94, 0.2)",
            color: "#22c55e",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {live.players} / {live.max} online
        </span>
      );
    }
    return (
      <span style={{ opacity: 0.9, fontWeight: 600 }}>
        {live.players} / {live.max} players online
      </span>
    );
  }

  if (fallbackAvg != null || fallbackMax != null) {
    return (
      <span style={{ fontSize: 14, opacity: 0.85 }}>
        {fallbackAvg != null && <span>~{fallbackAvg} avg </span>}
        {fallbackMax != null && <span>• {fallbackMax} max</span>}
      </span>
    );
  }

  return null;
}
