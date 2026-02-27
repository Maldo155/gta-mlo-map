"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider";

const GATE_STORAGE_KEY = "mlomesh-home-preference";
const GATE_CLICKS_KEY = "mlomesh-gate-clicks";

export function setHomePreference(pref: "mlo" | "cities") {
  if (typeof window !== "undefined") {
    localStorage.setItem(GATE_STORAGE_KEY, pref);
  }
}

export function getHomePreference(): "mlo" | "cities" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(GATE_STORAGE_KEY);
  if (v === "mlo" || v === "cities") return v;
  return null;
}

function getGateClicks(): Record<"mlo" | "map" | "cities", number> {
  if (typeof window === "undefined") return { mlo: 0, map: 0, cities: 0 };
  try {
    const raw = localStorage.getItem(GATE_CLICKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { mlo: +parsed.mlo || 0, map: +parsed.map || 0, cities: +parsed.cities || 0 };
    }
  } catch {}
  return { mlo: 0, map: 0, cities: 0 };
}

function incrementGateClick(tile: "mlo" | "map" | "cities") {
  if (typeof window === "undefined") return;
  const next = { ...getGateClicks(), [tile]: getGateClicks()[tile] + 1 };
  localStorage.setItem(GATE_CLICKS_KEY, JSON.stringify(next));
}

const MLO_FALLBACK = "/maps/find-mlos-tile.png";
const CITIES_FALLBACK = "/maps/find-servers-tile.png";
const SLIDE_INTERVAL_MS = 6000;
const FADE_DURATION_MS = 800;

function GateTileSlideshow({
  images,
  fallback,
  borderColor,
}: {
  images: string[];
  fallback: string;
  borderColor: string;
}) {
  const list = images.length > 0 ? images : [fallback];
  const n = list.length;
  const listRef = useRef(list);
  listRef.current = list;

  const [visibleSlot, setVisibleSlot] = useState(0);
  const [slot0, setSlot0] = useState(list[0]);
  const [slot1, setSlot1] = useState(list[1] ?? list[0]);
  const indexRef = useRef(0);
  const slotRef = useRef(0);

  useEffect(() => {
    listRef.current = list;
    const startIndex = n > 1 ? Math.floor(Math.random() * n) : 0;
    setSlot0(list[startIndex]);
    setSlot1(list[(startIndex + 1) % n]);
    indexRef.current = startIndex;
    slotRef.current = 0;
    setVisibleSlot(0);
  }, [images, fallback]);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => {
      const L = listRef.current;
      const i = indexRef.current;
      const slot = slotRef.current;
      const len = L.length;
      const next = (i + 1) % len;
      const twoAhead = (i + 2) % len;
      indexRef.current = next;
      if (slot === 0) {
        setSlot1(L[next]);
        setVisibleSlot(1);
        slotRef.current = 1;
        setTimeout(() => setSlot0(L[twoAhead]), FADE_DURATION_MS);
      } else {
        setSlot0(L[next]);
        setVisibleSlot(0);
        slotRef.current = 0;
        setTimeout(() => setSlot1(L[twoAhead]), FADE_DURATION_MS);
      }
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div
      className="home-gate-tile-slideshow"
      style={{
        height: 200,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${slot0})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: visibleSlot === 0 ? 1 : 0,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${slot1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: visibleSlot === 1 ? 1 : 0,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
        }}
      />
    </div>
  );
}

export default function HomeGate({
  mlosCount,
  creatorsCount,
  serversCount,
  mloImages = [],
  serverImages = [],
}: {
  mlosCount?: number;
  creatorsCount?: number;
  serversCount?: number;
  mloImages?: string[];
  serverImages?: string[];
}) {
  const { t } = useLanguage();
  const [clicks, setClicks] = useState<Record<"mlo" | "map" | "cities", number>>(() => ({ mlo: 0, map: 0, cities: 0 }));
  const [banner, setBanner] = useState<{
    title: string | null;
    subtitle: string | null;
    enabled?: boolean;
    font_family?: string | null;
    title_font_size?: number | null;
    subtitle_font_size?: number | null;
    title_font_weight?: string | null;
    letter_spacing?: string | null;
    subtitle_color?: string | null;
    title_font_color?: string | null;
    background_color?: string | null;
    border_color?: string | null;
    animation?: string | null;
  } | null>(null);

  useEffect(() => {
    setClicks(getGateClicks());
  }, []);

  useEffect(() => {
    function fetchBanner() {
      fetch("/api/site-banner-gate", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) =>
          setBanner({
            title: d.title ?? null,
            subtitle: d.subtitle ?? null,
            enabled: d.enabled !== false,
            font_family: d.font_family ?? null,
            title_font_size: d.title_font_size ?? null,
            subtitle_font_size: d.subtitle_font_size ?? null,
            title_font_weight: d.title_font_weight ?? null,
            letter_spacing: d.letter_spacing ?? null,
            subtitle_color: d.subtitle_color ?? null,
            title_font_color: d.title_font_color ?? null,
            background_color: d.background_color ?? null,
            border_color: d.border_color ?? null,
            animation: d.animation ?? null,
          })
        )
        .catch(() => setBanner(null));
    }
    fetchBanner();
    const interval = setInterval(fetchBanner, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (tile: "mlo" | "map" | "cities") => {
    incrementGateClick(tile);
    setClicks(getGateClicks());
  };

  return (
    <>
      <style>{`
        @keyframes statusFlash {
          0%, 100% { opacity: 1; box-shadow: 0 10px 24px rgba(0,0,0,0.3); }
          50% { opacity: 0.92; box-shadow: 0 10px 28px rgba(251,191,36,0.25); }
        }
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.008); }
        }
        @keyframes statusFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    <div
      className="home-gate-inner"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 32,
      }}
    >
      {banner?.enabled !== false && (banner?.title || banner?.subtitle) && (
        <div
          className="home-gate-banner"
          style={{
            width: "100%",
            maxWidth: 900,
            padding: "20px 24px",
            borderRadius: 12,
            border: `2px solid ${banner?.border_color || "#fbbf24"}`,
            background:
              banner?.background_color ||
              "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
            boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
            fontFamily: banner?.font_family ? `"${banner.font_family}", sans-serif` : undefined,
            animation:
              banner?.animation === "none"
                ? undefined
                : banner?.animation === "pulse"
                  ? "statusPulse 2s ease-in-out infinite"
                  : banner?.animation === "fade"
                    ? "statusFade 2s ease-in-out infinite"
                    : "statusFlash 1.6s ease-in-out infinite",
          }}
        >
          {banner?.title && (
            <div
              className="home-gate-banner-title"
              style={{
                fontSize: banner?.title_font_size ?? 32,
                fontWeight: banner?.title_font_weight ?? 900,
                letterSpacing: banner?.letter_spacing ?? "0.8px",
                color: banner?.title_font_color || undefined,
              }}
            >
              {banner.title}
            </div>
          )}
          {banner?.subtitle && (
            <div
              className="home-gate-banner-subtitle"
              style={{
                marginTop: banner?.title ? 12 : 0,
                fontSize: banner?.subtitle_font_size ?? 22,
                color: banner?.subtitle_color || "#fde68a",
              }}
            >
              {banner.subtitle}
            </div>
          )}
        </div>
      )}
      <div
        className="home-gate-welcome"
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 0.5,
          color: "#e8ecf7",
          textAlign: "center",
        }}
      >
        {t("home.gate.welcome")}
      </div>
      <div
        className="home-gate-title"
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#cbd5f5",
          textAlign: "center",
          opacity: 0.9,
        }}
      >
        {t("home.gate.title")}
      </div>
      <div
        className="home-gate-tiles"
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1200,
        }}
      >
        <a
          href="/mlo"
          onClick={() => {
            setHomePreference("mlo");
            handleClick("mlo");
          }}
          className="home-gate-tile-link"
          style={{ textDecoration: "none" }}
        >
          <div
            className="card home-gate-tile home-gate-tile-mlo"
            style={{
              width: 380,
              minWidth: 280,
              minHeight: 340,
              border: "2px solid rgba(34,211,238,0.5)",
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(16, 22, 43, 0.95)",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(34,211,238,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <GateTileSlideshow
              images={mloImages}
              fallback={MLO_FALLBACK}
              borderColor="rgba(34,211,238,0.3)"
            />
            <div className="home-gate-tile-content" style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="home-gate-tile-title" style={{ fontSize: 28, fontWeight: 800, color: "#67e8f9" }}>
                {t("home.gate.mlo")}
              </div>
              {creatorsCount != null && (
                <div className="home-gate-tile-count" style={{ fontSize: 18, opacity: 0.8, marginTop: 4, color: "#67e8f9" }}>
                  ({t("home.gate.creators", { count: creatorsCount })})
                </div>
              )}
              <div className="home-gate-tile-desc" style={{ marginTop: 8, color: "#7dd3fc", fontSize: 15 }}>
                {t("home.gate.mlo.desc")}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 12, textAlign: "center", fontSize: 13, opacity: 0.7 }}>
                {t("home.gate.clicks", { count: clicks.mlo })}
              </div>
            </div>
          </div>
        </a>
        <a
          href="/map"
          onClick={() => handleClick("map")}
          className="home-gate-tile-link"
          style={{ textDecoration: "none" }}
        >
          <div
            className="card home-gate-tile home-gate-tile-map"
            style={{
              width: 380,
              minWidth: 280,
              minHeight: 340,
              border: "2px solid rgba(34,197,94,0.5)",
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(16, 22, 43, 0.95)",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(34,197,94,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              className="home-gate-tile-hero"
              style={{
                height: 200,
                backgroundImage: "url(/maps/gta-5-map-atlas-hd.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderBottom: "1px solid rgba(34,197,94,0.3)",
              }}
            />
            <div className="home-gate-tile-content" style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="home-gate-tile-title" style={{ fontSize: 28, fontWeight: 800, color: "#34d399" }}>
                {t("home.gate.map")}
              </div>
              {mlosCount != null && (
                <div className="home-gate-tile-count" style={{ fontSize: 18, opacity: 0.8, marginTop: 4, color: "#34d399" }}>
                  ({t("home.gate.mlos", { count: mlosCount })})
                </div>
              )}
              <div className="home-gate-tile-desc" style={{ marginTop: 8, color: "#6ee7b7", fontSize: 15 }}>
                {t("home.gate.map.desc")}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 12, textAlign: "center", fontSize: 13, opacity: 0.7 }}>
                {t("home.gate.clicks", { count: clicks.map })}
              </div>
            </div>
          </div>
        </a>
        <a
          href="/cities"
          onClick={() => {
            setHomePreference("cities");
            handleClick("cities");
          }}
          className="home-gate-tile-link"
          style={{ textDecoration: "none" }}
        >
          <div
            className="card home-gate-tile home-gate-tile-cities"
            style={{
              width: 380,
              minWidth: 280,
              minHeight: 340,
              border: "2px solid rgba(255,111,0,0.5)",
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(16, 22, 43, 0.95)",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(255,111,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <GateTileSlideshow
              images={serverImages}
              fallback={CITIES_FALLBACK}
              borderColor="rgba(255,111,0,0.3)"
            />
            <div className="home-gate-tile-content" style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="home-gate-tile-title" style={{ fontSize: 28, fontWeight: 800, color: "#ff9f5c" }}>
                {t("home.gate.cities")}
              </div>
              {serversCount != null && (
                <div className="home-gate-tile-count" style={{ fontSize: 18, opacity: 0.8, marginTop: 4, color: "#ff9f5c" }}>
                  ({t("home.gate.servers", { count: serversCount })})
                </div>
              )}
              <div className="home-gate-tile-desc" style={{ marginTop: 8, color: "#c4a574", fontSize: 15 }}>
                {t("home.gate.cities.desc")}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 12, textAlign: "center", fontSize: 13, opacity: 0.7 }}>
                {t("home.gate.clicks", { count: clicks.cities })}
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
    </>
  );
}
