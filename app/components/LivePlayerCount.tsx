"use client";

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
    fetch(`/api/fivem-status?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => (data && typeof data.players === "number" ? setLive(data) : setLive(null)))
      .catch(() => setLive(null));
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
      <span style={{ opacity: 0.8 }}>
        {fallbackAvg != null && <>~{fallbackAvg} avg players </>}
        {fallbackMax != null && <>• {fallbackMax} max slots</>}
      </span>
    );
  }

  return null;
}
