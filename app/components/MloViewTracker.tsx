"use client";

import { useEffect, useRef } from "react";

/** Increments the view count when user lands on MLO detail page (view details = counts as a view). */
export default function MloViewTracker({ mloId }: { mloId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!mloId || sent.current) return;
    // Skip if ViewDetailsLink already fired (click-based count)
    try {
      const key = `mlomesh_view_${mloId}`;
      const ts = sessionStorage.getItem(key);
      if (ts) {
        const age = Date.now() - Number(ts);
        sessionStorage.removeItem(key);
        if (age < 10000) return; // Already counted from click within 10s
      }
    } catch {
      // ignore
    }
    sent.current = true;

    const payload = JSON.stringify({ mlo_id: mloId });

    // keepalive: true ensures the request completes even if user navigates away quickly
    fetch("/api/mlo/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Fallback: sendBeacon survives page unload/navigation
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/mlo/views", blob);
      }
    });
  }, [mloId]);

  return null;
}
