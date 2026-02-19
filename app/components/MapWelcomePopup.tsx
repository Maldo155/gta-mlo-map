"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "mlomesh_map_welcome_seen";

export default function MapWelcomePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (!seen) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          margin: 16,
          padding: "28px 32px",
          background: "linear-gradient(180deg, #1a2234 0%, #0f1419 100%)",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: "#e5e7eb",
            marginBottom: 24,
          }}
        >
          This interactive map shows FiveM MLOs across the GTA world. Click markers
          to view details, or use the filters to narrow your search.{" "}
          <strong style={{ color: "#93c5fd" }}>For best results, search by creator.</strong>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 700,
            color: "#0f1419",
            background: "linear-gradient(135deg, #c7ff4a, #a3e635)",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(199, 255, 74, 0.4)",
          }}
        >
          Explore MLOs!
        </button>
      </div>
    </div>
  );
}
