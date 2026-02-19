"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

const VISIT_KEY = "mlomesh:visit-counted";

export default function VisitCounter() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const counted =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(VISIT_KEY);

    const method = counted ? "GET" : "POST";
    fetch("/api/visits", { method, cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") {
          setCount(data.count);
          if (!counted) {
            window.sessionStorage.setItem(VISIT_KEY, "1");
          }
        }
      })
      .catch(() => {});
  }, []);

  if (pathname === "/map" || count == null) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "max(16px, env(safe-area-inset-left, 0px))",
        bottom: "max(16px, env(safe-area-inset-bottom, 0px))",
        zIndex: 50,
        borderRadius: 999,
        border: "1px solid #243046",
        background: "rgba(16,22,43,0.9)",
        color: "#e5e7eb",
        padding: "8px 12px",
        fontSize: 12,
        letterSpacing: 0.4,
        boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
        maxWidth: "calc(100vw - 90px)",
      }}
    >
      {t("home.visits")}: {count.toLocaleString()}
    </div>
  );
}
