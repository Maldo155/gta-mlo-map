"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthLink from "./components/AuthLink";
import { getSupabaseBrowser } from "./lib/supabaseBrowser";
import DiscordLink from "./components/DiscordLink";
import LanguageSelect from "./components/LanguageSelect";
import { useLanguage } from "./components/LanguageProvider";

type Mlo = {
  id: string;
  name: string;
  creator?: string;
  website_url?: string;
  image_url?: string;
  category?: string;
  tag?: string;
  x?: number | null;
  y?: number | null;
  created_at?: string;
};

type RequestItem = {
  id: string;
  title: string;
  details?: string;
  x?: number | null;
  y?: number | null;
  upvotes: number;
  downvotes: number;
  image_url?: string | null;
  created_at?: string;
};

function HomeContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const signInTriggered = useRef(false);

  // Initiate OAuth from homepage only - works reliably (cookies set before redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const signin = searchParams.get("signin");
    const next = searchParams.get("next") || "/servers/submit";
    if (signin === "1" && !signInTriggered.current) {
      signInTriggered.current = true;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/servers/submit")}`;
      getSupabaseBrowser().auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo },
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Recovery: if Supabase redirects to /?code=xxx instead of /auth/callback, redirect to callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = params.get("next") || "/servers/submit";
      window.location.replace(
        `${window.location.origin}/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
      return;
    }
  }, []);

  const [mlos, setMlos] = useState<Mlo[]>([]);
  const [banner, setBanner] = useState<{
    title: string | null;
    subtitle: string | null;
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
  const [creatorTiles, setCreatorTiles] = useState<
    { creator_key: string; logo_url?: string | null; banner_url?: string | null; spotlight_logo_size?: number | null }[]
  >([]);
  const [spotlightCreatorsData, setSpotlightCreatorsData] = useState<
    { creator_key: string; logo_url: string | null; spotlight_logo_size: number; verified_creator: boolean; partnership: boolean; displayName: string; count: number }[]
  >([]);
  const [partnersCreatorsData, setPartnersCreatorsData] = useState<
    { creator_key: string; logo_url: string | null; spotlight_logo_size: number; displayName: string; count: number }[]
  >([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending">(
    "idle"
  );
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [contactError, setContactError] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [votedRequests, setVotedRequests] = useState<
    Record<string, "up" | "down">
  >({});
  const DETAILS_MAX = 280;

  /** Set to true when ready to show the Partners section on the homepage */
  const SHOW_PARTNERS_SECTION = true;

  /** Set to true when ready to show the Reviews section on the homepage */
  const SHOW_REVIEWS_SECTION = false;

  // MLO conveyor speed (seconds per full cycle). Higher = slower. Edit this to change scroll speed.
  const MLO_CONVEYOR_SPEED_SEC = 400;

  function fetchBanner() {
    fetch("/api/site-banner", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setBanner({
          title: d.title ?? null,
          subtitle: d.subtitle ?? null,
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

  useEffect(() => {
    fetchBanner();
    const interval = setInterval(fetchBanner, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/mlo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMlos(d.mlos || []));
  }, []);

  useEffect(() => {
    function fetchTiles() {
      fetch("/api/creator-tiles", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => setCreatorTiles(json.tiles || []))
        .catch(() => setCreatorTiles([]));
    }
    fetchTiles();
    const interval = setInterval(fetchTiles, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function fetchSpotlight() {
      fetch("/api/creator-tiles/spotlight", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => setSpotlightCreatorsData(json.creators || []))
        .catch(() => setSpotlightCreatorsData([]));
    }
    fetchSpotlight();
    const interval = setInterval(fetchSpotlight, 5_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function fetchPartners() {
      fetch("/api/creator-tiles/partners", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => setPartnersCreatorsData(json.creators || []))
        .catch(() => setPartnersCreatorsData([]));
    }
    fetchPartners();
    const interval = setInterval(fetchPartners, 5_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/requests", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("votedRequests");
    if (stored) {
      try {
        setVotedRequests(JSON.parse(stored));
      } catch {
        setVotedRequests({});
      }
    }
  }, []);

  const featuredMlos = useMemo(() => {
    return [...mlos].slice(0, 6);
  }, [mlos]);

  const conveyorMlos = useMemo(() => {
    if (!mlos.length) return [];
    const shuffled = [...mlos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 25);
  }, [mlos]);

  const topCreators = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mlo of mlos) {
      if (!mlo.creator) continue;
      counts.set(mlo.creator, (counts.get(mlo.creator) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [mlos]);

  const spotlightCreators = useMemo(() => {
    const tiles = Array.isArray(creatorTiles) ? creatorTiles : [];
    const inSpotlight = tiles.filter(
      (t) => t.creator_key && (t.logo_url || t.banner_url)
    );
    if (inSpotlight.length === 0) return [];
    const countByKey: Record<string, number> = {};
    const displayNameByKey: Record<string, string> = {};
    for (const mlo of mlos) {
      const key = (mlo.creator || "").trim().toLowerCase();
      if (!key) continue;
      countByKey[key] = (countByKey[key] || 0) + 1;
      if (!(key in displayNameByKey)) displayNameByKey[key] = (mlo.creator || "").trim();
    }
    return inSpotlight
      .map((t) => {
        const tileKey = (t.creator_key || "").trim().toLowerCase();
        const tileKeySpaces = tileKey.replace(/-/g, " ");
        const displayName = displayNameByKey[tileKey] || displayNameByKey[tileKeySpaces] || t.creator_key;
        const count = countByKey[tileKey] ?? countByKey[tileKeySpaces] ?? 0;
        const size =
          t.spotlight_logo_size != null && Number.isFinite(Number(t.spotlight_logo_size))
            ? Math.min(100, Math.max(15, Number(t.spotlight_logo_size)))
            : 60;
        return {
          creator_key: t.creator_key,
          logo_url: t.logo_url || null,
          spotlight_logo_size: size,
          verified_creator: (t as { verified_creator?: boolean }).verified_creator === true,
          partnership: (t as { partnership?: boolean }).partnership === true,
          displayName,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [creatorTiles, mlos]);

  const displayedSpotlight = useMemo(() => {
    if (spotlightCreatorsData.length > 0) return spotlightCreatorsData.slice(0, 5);
    return spotlightCreators;
  }, [spotlightCreatorsData, spotlightCreators]);

  const partnersCreators = useMemo(() => {
    const tiles = Array.isArray(creatorTiles) ? creatorTiles : [];
    const partners = tiles.filter(
      (t) => t.creator_key && (t as { partnership?: boolean }).partnership === true && (t.logo_url || t.banner_url)
    );
    if (partners.length === 0) return [];
    const countByKey: Record<string, number> = {};
    const displayNameByKey: Record<string, string> = {};
    for (const mlo of mlos) {
      const key = (mlo.creator || "").trim().toLowerCase();
      if (!key) continue;
      countByKey[key] = (countByKey[key] || 0) + 1;
      if (!(key in displayNameByKey)) displayNameByKey[key] = (mlo.creator || "").trim();
    }
    return partners
      .map((t) => {
        const tileKey = (t.creator_key || "").trim().toLowerCase();
        const displayName = displayNameByKey[tileKey] || t.creator_key;
        const count = countByKey[tileKey] ?? 0;
        const size =
          (t as { spotlight_logo_size?: number | null }).spotlight_logo_size != null &&
          Number.isFinite(Number((t as { spotlight_logo_size?: number | null }).spotlight_logo_size))
            ? Math.min(100, Math.max(15, Number((t as { spotlight_logo_size?: number }).spotlight_logo_size)))
            : 60;
        return {
          creator_key: t.creator_key,
          logo_url: t.logo_url || null,
          spotlight_logo_size: size,
          displayName,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [creatorTiles, mlos]);

  const displayedPartners = useMemo(() => {
    if (partnersCreatorsData.length > 0) return partnersCreatorsData;
    return partnersCreators;
  }, [partnersCreatorsData, partnersCreators]);

  const latestRequests = useMemo(() => {
    return [...requests].slice(0, 4);
  }, [requests]);

  async function submitRequest() {
    if (!requestTitle.trim()) return;
    setRequestStatus("sending");
    const form = new FormData();
    form.append("title", requestTitle.trim());
    form.append("details", requestDetails.trim());
    const res = await fetch("/api/requests", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const json = await res.json();
      setRequests((prev) => [json.request, ...prev]);
      setRequestTitle("");
      setRequestDetails("");
    }
    setRequestStatus("idle");
  }

  async function voteRequest(id: string, direction: "up" | "down") {
    const current = votedRequests[id];
    if (current === direction) return;
    const res = await fetch("/api/requests/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, direction, previous: current || null }),
    });

    if (res.ok) {
      const json = await res.json();
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? json.request : req))
      );
      const next = { ...votedRequests, [id]: direction };
      setVotedRequests(next);
      localStorage.setItem("votedRequests", JSON.stringify(next));
    }
  }

  async function submitContact() {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError(t("contact.missing"));
      setContactStatus("error");
      return;
    }
    setContactError("");
    setContactStatus("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      }),
    });
    if (res.ok) {
      setContactStatus("sent");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setShowContact(false);
      return;
    }
    const text = await res.text();
    setContactError(text || t("contact.error"));
    setContactStatus("error");
  }


  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="header-logo-float">
          <img
            src="/mlomesh-logo.png"
            alt="MLOMesh logo"
            className="header-logo"
          />
        </div>
        <header
          className="site-header"
          style={{
            padding: "16px 24px",
            backgroundColor: "#10162b",
            backgroundImage: 'url("/header-bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="header-top">
            <div className="header-brand" />
            <div className="header-actions">
              <LanguageSelect />
              <AuthLink />
              <DiscordLink />
              <button
                type="button"
                className="header-contact"
                onClick={() => {
                  const next = !showContact;
                  setShowContact(next);
                  setContactStatus("idle");
                  setContactError("");
                  if (!showContact) {
                    setTimeout(() => {
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 0);
                  }
                }}
              >
                {t("contact.button")}
              </button>
            </div>
          </div>
        <nav className="header-nav">
          <a href="/" className="header-link">
            {t("nav.home")}
          </a>
          <a href="/map" className="header-link">
            {t("nav.map")}
          </a>
          <a href="/about" className="header-link">
            {t("nav.about")}
          </a>
          <a href="/creators" className="header-link">
            {t("nav.creators")}
          </a>
          <a href="/servers" className="header-link">
            {t("nav.servers")}
          </a>
          <a href="/submit" className="header-link">
            {t("nav.submit")}
          </a>
        </nav>
        </header>

      <section
        className="home-section-wrap"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 24px 0",
        }}
      >
        <style>{`
          @keyframes statusFlash {
            0% { box-shadow: 0 0 0 rgba(251,191,36,0.0); border-color: #fbbf24; }
            50% { box-shadow: 0 0 24px rgba(251,191,36,0.5); border-color: #f59e0b; }
            100% { box-shadow: 0 0 0 rgba(251,191,36,0.0); border-color: #fbbf24; }
          }
          @keyframes statusPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.92; transform: scale(1.01); }
          }
          @keyframes statusFade {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
        <div
          className="home-status-banner"
          style={{
            borderRadius: 18,
            border: `2px solid ${banner?.border_color || "#fbbf24"}`,
            background:
              banner?.background_color ||
              "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(239,68,68,0.15))",
            padding: "26px 28px",
            boxShadow: "0 18px 32px rgba(0,0,0,0.35)",
            textAlign: "center",
            animation: banner?.animation === "none"
              ? undefined
              : banner?.animation === "pulse"
                ? "statusPulse 2s ease-in-out infinite"
                : banner?.animation === "fade"
                  ? "statusFade 2s ease-in-out infinite"
                  : "statusFlash 1.6s ease-in-out infinite",
            fontFamily: banner?.font_family ? `"${banner.font_family}", sans-serif` : undefined,
          }}
        >
          <div
            style={{
              fontSize: banner?.title_font_size ?? 32,
              fontWeight: banner?.title_font_weight ?? 900,
              letterSpacing: banner?.letter_spacing ?? "0.8px",
              color: banner?.title_font_color || undefined,
            }}
          >
            {banner?.title || t("home.status.title")}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: banner?.subtitle_font_size ?? 20,
              color: banner?.subtitle_color || "#fde68a",
            }}
          >
            {banner?.subtitle || t("home.status.subtitle")}
          </div>
        </div>
      </section>

      <section
        className="home-section-wrap home-hero-section"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#b8c2d9",
              border: "1px solid #243046",
              padding: "6px 12px",
              borderRadius: 999,
              background: "#10162b",
              marginBottom: 16,
            }}
          >
            {t("home.badge")}
          </div>
          <h1
            className="home-hero-title hero-tagline"
            style={{
              fontSize: 46,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {(() => {
              const hero = t("home.hero.title");
              const parts = hero.split("MLOMesh");
              if (parts.length === 1) return hero;
              return (
                <>
                  {parts[0]}
                  <span className="hero-brand">MLOMesh</span>
                  {parts.slice(1).join("MLOMesh")}
                </>
              );
            })()}
          </h1>
          <div
            className="home-hero-actions"
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              justifyContent: "center",
            }}
          >
            <a href="/submit">
              <button className="cta-submit">{t("home.hero.cta.submit")}</button>
            </a>
          </div>
        </div>
      </section>

      <section className="home-section-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px" }}>
        <div
          className="home-tiles-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <a href="/map" style={{ textDecoration: "none" }}>
            <div
              style={{
                border: "1px solid #243046",
                borderRadius: 14,
                padding: 18,
                background: "rgba(16, 22, 43, 0.8)",
                minHeight: 140,
              }}
              className="card"
            >
              <div
                className="card-tile-thumb"
                style={{
                  height: 80,
                  borderRadius: 10,
                  backgroundImage: "url(/maps/find-mlos-tile.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center center",
                  marginBottom: 10,
                  border: "1px solid #243046",
                  opacity: 0.88,
                }}
              />
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {t("home.tiles.map.title")}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                {t("home.tiles.map.subtitle")} ({mlos.length})
              </div>
              <div style={{ marginTop: 8, color: "#9ca3af", fontSize: 13 }}>
                {t("home.tiles.map.desc")}
              </div>
            </div>
          </a>
        </div>
      </section>

      <section className="home-section-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 24px" }}>
        <div
          className="home-spotlight-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              {t("home.fresh.label")}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {featuredMlos.length === 0 && (
                <div style={{ opacity: 0.7, fontSize: 13 }}>
                  {t("home.fresh.empty")}
                </div>
              )}
              {featuredMlos.map((mlo) => (
                <div
                  key={mlo.id}
                  style={{
                    border: "1px solid #243046",
                    borderRadius: 14,
                    padding: 16,
                    background: "#10162b",
                    minHeight: 140,
                  }}
                  className="card"
                >
                  <img
                    src={mlo.image_url || "/maps/gta-5-map-atlas-hd.jpg"}
                    alt=""
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginBottom: 10,
                      border: "1px solid #243046",
                      opacity: 0.9,
                      display: "block",
                    }}
                  />
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("home.mlo.label")}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
                    {mlo.name || t("home.mlo.untitled")}
                  </div>
                  <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>
                    {mlo.creator || t("home.mlo.unknownCreator")}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={`/map?mloId=${encodeURIComponent(
                        mlo.id
                      )}&highlight=1${
                        mlo.x != null && mlo.y != null
                          ? `&x=${encodeURIComponent(
                              mlo.x
                            )}&y=${encodeURIComponent(mlo.y)}`
                          : ""
                      }`}
                      style={{ color: "#93c5fd", fontSize: 12 }}
                    >
                      {t("home.mlo.viewMap")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {mlos.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    opacity: 0.9,
                  }}
                >
                  {t("home.conveyor.title")}
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                    maskImage:
                      "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
                    maskSize: "100% 100%",
                  }}
                >
                  <div
                    className="mlo-conveyor-track"
                    style={{
                      display: "flex",
                      gap: 8,
                      animation: `mloConveyorScroll ${MLO_CONVEYOR_SPEED_SEC}s linear infinite`,
                      width: "max-content",
                    }}
                  >
                    {[...conveyorMlos, ...conveyorMlos].map((mlo, idx) => (
                      <a
                        key={`${mlo.id}-dup-${idx}`}
                        href={`/map?mloId=${encodeURIComponent(mlo.id)}&highlight=1${
                          mlo.x != null && mlo.y != null
                            ? `&x=${encodeURIComponent(mlo.x)}&y=${encodeURIComponent(mlo.y)}`
                            : ""
                        }`}
                        className="mlo-conveyor-card card"
                        style={{
                          flexShrink: 0,
                          width: 200,
                          border: "1px solid #243046",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#10162b",
                          textDecoration: "none",
                          color: "inherit",
                          display: "block",
                        }}
                      >
                        <img
                          src={mlo.image_url || "/maps/gta-5-map-atlas-hd.jpg"}
                          alt=""
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderBottom: "1px solid #243046",
                            display: "block",
                          }}
                        />
                        <div style={{ padding: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {mlo.name || t("home.mlo.untitled")}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {mlo.creator || t("home.mlo.unknownCreator")}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                border: "1px solid #c7ff4a",
                borderRadius: 14,
                padding: 12,
                background:
                  "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(111,95,231,0.12))",
                boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  marginBottom: 8,
                }}
              >
                {t("home.spotlight.label")}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {t("home.spotlight.title")}
              </div>
            </div>
            <div
              style={{
                border: "1px solid #c7ff4a",
                borderRadius: 14,
                padding: 12,
                background: "#10162b",
              }}
            >
              {displayedSpotlight.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {displayedSpotlight.map((creator) => (
                    <a
                      key={creator.creator_key}
                      href="/creators"
                      style={{
                        display: "block",
                        position: "relative",
                        border: "1px solid #243046",
                        borderRadius: 12,
                        overflow: "hidden",
                        minHeight: 80,
                        backgroundColor: "#0f1528",
                        textDecoration: "none",
                        color: "inherit",
                        padding: 12,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 56,
                        }}
                      >
                        {creator.logo_url ? (
                          <img
                            key={creator.logo_url}
                            src={creator.logo_url}
                            alt=""
                            loading="lazy"
                            style={{
                              maxWidth: `${creator.spotlight_logo_size}%`,
                              maxHeight: 48,
                              width: "auto",
                              height: "auto",
                              objectFit: "contain",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{creator.displayName}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {(creator as { verified_creator?: boolean }).verified_creator && (
                          <span
                            title="Verified MLO Creator"
                            style={{
                              display: "inline-flex",
                              padding: "1px 6px",
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 700,
                              background: "rgba(59, 130, 246, 0.25)",
                              border: "1px solid rgba(59, 130, 246, 0.5)",
                              color: "#93c5fd",
                            }}
                          >
                            ✓
                          </span>
                        )}
                        {(creator as { partnership?: boolean }).partnership && (
                          <span
                            title="Partner"
                            style={{
                              display: "inline-flex",
                              padding: "1px 6px",
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 800,
                              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(245, 158, 11, 0.3))",
                              border: "1px solid rgba(251, 191, 36, 0.6)",
                              color: "#fde68a",
                              boxShadow: "0 0 10px rgba(251, 191, 36, 0.4)",
                            }}
                          >
                            ★
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "center", fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                        {t("home.spotlight.count", { count: creator.count })}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ opacity: 0.7, fontSize: 13 }}>
                  {t("home.spotlight.empty")}
                </div>
              )}
            </div>

            {SHOW_PARTNERS_SECTION && (
              <>
                <div
                  style={{
                    border: "1px solid rgba(251, 191, 36, 0.6)",
                    borderRadius: 14,
                    padding: 12,
                    background:
                      "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.06))",
                    boxShadow: "0 10px 24px rgba(251, 191, 36, 0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "1px 6px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(245, 158, 11, 0.3))",
                        border: "1px solid rgba(251, 191, 36, 0.6)",
                        color: "#fde68a",
                        boxShadow: "0 0 10px rgba(251, 191, 36, 0.4)",
                      }}
                    >
                      ★
                    </span>
                    {t("home.partners.label")}
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "1px 6px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(245, 158, 11, 0.3))",
                        border: "1px solid rgba(251, 191, 36, 0.6)",
                        color: "#fde68a",
                        boxShadow: "0 0 10px rgba(251, 191, 36, 0.4)",
                      }}
                    >
                      ★
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid rgba(251, 191, 36, 0.5)",
                    borderRadius: 14,
                    padding: 12,
                    background: "#10162b",
                  }}
                >
                  {displayedPartners.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {displayedPartners.map((creator) => (
                        <a
                          key={creator.creator_key}
                          href="/creators"
                          style={{
                            display: "block",
                            position: "relative",
                            border: "1px solid rgba(251, 191, 36, 0.4)",
                            borderRadius: 12,
                            overflow: "hidden",
                            minHeight: 80,
                            backgroundColor: "#0f1528",
                            textDecoration: "none",
                            color: "inherit",
                            padding: 12,
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 56,
                            }}
                          >
                            {creator.logo_url ? (
                              <img
                                src={creator.logo_url}
                                alt=""
                                loading="lazy"
                                style={{
                                  maxWidth: `${creator.spotlight_logo_size}%`,
                                  maxHeight: 48,
                                  width: "auto",
                                  height: "auto",
                                  objectFit: "contain",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{creator.displayName}</span>
                            )}
                          </div>
                          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                            {t("home.partners.count", { count: creator.count })}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      {t("home.partners.empty")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes mloConveyorScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {showContact && (
        <section
          id="contact"
          className="home-section-wrap"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px 56px",
          }}
        >
          <div
            style={{
              border: "1px solid #243046",
              borderRadius: 16,
              padding: 20,
              background: "rgba(16, 22, 43, 0.9)",
              boxShadow: "0 18px 32px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.4 }}>
              {t("contact.title")}
            </div>
            <div style={{ marginTop: 6, color: "#cbd5f5" }}>
              {t("contact.subtitle")}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              <input
                placeholder={t("contact.name")}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <input
                placeholder={t("contact.email")}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <textarea
              placeholder={t("contact.message")}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
              style={{ marginTop: 12 }}
            />

            {contactStatus === "sent" && (
              <div style={{ marginTop: 10, color: "#86efac" }}>
                {t("contact.success")}
              </div>
            )}
            {contactStatus === "error" && (
              <div style={{ marginTop: 10, color: "#fca5a5" }}>
                {contactError || t("contact.error")}
              </div>
            )}

            <button
              onClick={submitContact}
              disabled={contactStatus === "sending"}
              style={{ marginTop: 12 }}
            >
              {contactStatus === "sending"
                ? t("contact.sending")
                : t("contact.send")}
            </button>
            <div style={{ marginTop: 14, fontSize: 13, color: "#94a3b8" }}>
              {t("liveChat.orTry")}{" "}
              <button
                type="button"
                onClick={() => typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("openLiveChat"))}
                style={{
                  background: "none",
                  border: "none",
                  color: "#22d3ee",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Live Chat
              </button>
            </div>
          </div>
        </section>
      )}

      {SHOW_REVIEWS_SECTION && (
      <section className="home-section-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 0.4,
            marginBottom: 10,
          }}
        >
          {t("home.requests.label")}
        </div>
          <div
            className="home-requests-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 340px) 1fr",
              gap: 12,
            }}
          >
          <div
            className="home-requests-feed"
            style={{
              border: "1px solid #243046",
              borderRadius: 14,
              padding: 16,
              background: "#10162b",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {t("home.requests.form.title")}
            </div>
            <input
              placeholder={t("home.requests.form.titlePlaceholder")}
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
            />
            <textarea
              placeholder={t("home.requests.form.detailsPlaceholder")}
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              rows={3}
              style={{ marginTop: 8 }}
              maxLength={DETAILS_MAX}
            />
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
              {requestDetails.length}/{DETAILS_MAX}
            </div>
            <button
              onClick={submitRequest}
              disabled={requestStatus === "sending"}
              style={{ marginTop: 10 }}
            >
              {requestStatus === "sending"
                ? t("home.requests.form.posting")
                : t("home.requests.form.post")}
            </button>
          </div>

          <div
            style={{
              border: "1px solid #243046",
              borderRadius: 14,
              padding: 16,
              background: "#10162b",
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {latestRequests.length === 0 && (
              <div style={{ opacity: 0.7, fontSize: 13 }}>
                {t("home.requests.feed.empty")}
              </div>
            )}
            {latestRequests.map((req, idx) => (
              <div
                key={req.id}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    idx === latestRequests.length - 1
                      ? "none"
                      : "1px solid #243046",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {t("home.requests.feed.label")}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  {req.title}
                </div>
                {req.details && (
                  <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 13 }}>
                    {req.details}
                  </div>
                )}
                {(req.x != null || req.y != null) && (
                  <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 12 }}>
                    {req.x != null ? `X: ${req.x}` : ""}{" "}
                    {req.y != null ? `Y: ${req.y}` : ""}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => voteRequest(req.id, "up")}>
                    👍 {req.upvotes ?? 0}
                  </button>
                  <button onClick={() => voteRequest(req.id, "down")}>
                    👎 {req.downvotes ?? 0}
                  </button>
                  {votedRequests[req.id] && (
                    <span style={{ fontSize: 11, opacity: 0.6 }}>
                      {t("home.requests.vote.voted", {
                        direction:
                          votedRequests[req.id] === "up"
                            ? t("vote.up")
                            : t("vote.down"),
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            background: "#0f1115",
          }}
        >
          <p>Loading…</p>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
