"use client";

import { useState, useEffect } from "react";
import { getVisitedMloIds } from "@/app/lib/visitedMlos";

export function useVisitedMloIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() =>
    typeof window !== "undefined" ? getVisitedMloIds() : new Set()
  );

  useEffect(() => {
    const refresh = () => setIds(getVisitedMloIds());
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return ids;
}
