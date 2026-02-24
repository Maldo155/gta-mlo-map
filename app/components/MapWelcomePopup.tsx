"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "mlomesh_map_welcome_seen";

type Props = {
  /** Controlled: when provided, parent manages visibility */
  show?: boolean;
  onClose?: () => void;
};

export default function MapWelcomePopup({ show: controlledShow, onClose }: Props) {
  const [internalShow, setInternalShow] = useState(false);
  const [creatorBoxRect, setCreatorBoxRect] = useState<DOMRect | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const isControlled = controlledShow !== undefined;
  const show = isControlled ? controlledShow : internalShow;

  useEffect(() => {
    if (isControlled) return;
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (!seen) setInternalShow(true);
    } catch {
      setInternalShow(true);
    }
  }, [isControlled]);

  useEffect(() => {
    if (!show) return;
    function updateRect() {
      const el = document.getElementById("map-creator-search-highlight");
      if (el) {
        setCreatorBoxRect(el.getBoundingClientRect());
        return el;
      }
      return null;
    }
    const el = updateRect();
    if (el) {
      roRef.current = new ResizeObserver(() => updateRect());
      roRef.current.observe(el);
      return () => {
        roRef.current?.disconnect();
        roRef.current = null;
      };
    }
    let attempts = 0;
    const maxAttempts = 50;
    const poll = setInterval(() => {
      attempts++;
      const found = updateRect();
      if (found) {
        clearInterval(poll);
        roRef.current = new ResizeObserver(() => updateRect());
        roRef.current.observe(found);
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
      }
    }, 100);
    return () => {
      clearInterval(poll);
      roRef.current?.disconnect();
      roRef.current = null;
    };
  }, [show]);

  const handleDismiss = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalShow(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
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
        pointerEvents: "none",
      }}
    >
      {/* Blur overlay: full screen with cutout for creator search box only */}
      {creatorBoxRect && (
        <>
          {/* Top */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: creatorBoxRect.top,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              pointerEvents: "auto",
            }}
          />
          {/* Bottom */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              top: creatorBoxRect.bottom,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              pointerEvents: "auto",
            }}
          />
          {/* Left */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: creatorBoxRect.top,
              left: 0,
              width: creatorBoxRect.left,
              height: creatorBoxRect.height,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              pointerEvents: "auto",
            }}
          />
          {/* Right */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: creatorBoxRect.top,
              left: creatorBoxRect.right,
              right: 0,
              height: creatorBoxRect.height,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              pointerEvents: "auto",
            }}
          />
        </>
      )}
      {/* Fallback if rect not yet available: blur full screen */}
      {!creatorBoxRect && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            pointerEvents: "auto",
          }}
        />
      )}
      {/* Thick arrow pointing at creator search box (tip at box, arrow extends right) */}
      {creatorBoxRect && (
        <div
          style={{
            position: "fixed",
            left: creatorBoxRect.right,
            top: creatorBoxRect.top + creatorBoxRect.height / 2,
            transform: "translateY(-50%)",
            zIndex: 2002,
            pointerEvents: "none",
          }}
        >
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none" style={{ display: "block" }}>
            <path
              d="M120 50H15 M15 50L50 15 M15 50L50 85"
              stroke="#ef4444"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {/* Modal - pointer-events auto so it's clickable */}
      <div
        style={{
          position: "relative",
          zIndex: 2001,
          pointerEvents: "auto",
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
    </div>
  );
}
