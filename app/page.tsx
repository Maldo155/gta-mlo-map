"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthLink from "./components/AuthLink";
import DiscordLink from "./components/DiscordLink";
import RedditLink from "./components/RedditLink";
import LanguageSelect from "./components/LanguageSelect";
import SiteHeader from "./components/SiteHeader";
import HomeSplitContent from "./components/HomeSplitContent";
import HomeGate from "./components/HomeGate";
import { useLanguage } from "./components/LanguageProvider";
import type { Server } from "./lib/serverTags";

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

export function HomeContentFull({ variant }: { variant: "split" | "mloOnly" | "citiesOnly" }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  // Recovery: if Supabase redirects to /?code=xxx instead of /auth/callback, redirect to callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = params.get("next") || "/servers";
      window.location.replace(
        `${window.location.origin}/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
      return;
    }
  }, []);

  const [mlos, setMlos] = useState<Mlo[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
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

  /** Set to true to show partners as a conveyor (one at a time, same speed as MLO conveyor). Off by default for now. */
  const SHOW_PARTNERS_CONVEYOR = true;

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

  useEffect(() => {
    fetchBanner();
    const interval = setInterval(fetchBanner, 15_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/mlo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMlos(d.mlos || []));
  }, []);

  useEffect(() => {
    fetch("/api/servers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setServers(d.servers || []));
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
    const interval = setInterval(fetchSpotlight, 60_000);
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
    const interval = setInterval(fetchPartners, 60_000);
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
    return [...mlos].slice(0, 10);
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

  const conveyorServers = useMemo(() => {
    const claimed = servers.filter((s) => s.grandfathered === true || s.claimed_by_user_id);
    const withPics = claimed.filter(
      (s) =>
        (s.banner_url && s.banner_url.trim()) ||
        (s.logo_url && s.logo_url.trim()) ||
        (s.thumbnail_url && s.thumbnail_url.trim()) ||
        (Array.isArray(s.gallery_images) && s.gallery_images.length > 0)
    );
    if (!withPics.length) return [];
    const shuffled = [...withPics];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 20);
  }, [servers]);

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

  const partnerConveyorItems = useMemo(() => {
    if (!displayedPartners.length) return [];
    const items: typeof displayedPartners = [];
    const targetCount = 25;
    while (items.length < targetCount) {
      for (const p of displayedPartners) items.push(p);
    }
    return items.slice(0, targetCount);
  }, [displayedPartners]);

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
          background: `linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover`,
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
        <SiteHeader
          showContact
          onContactClick={() => {
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
        />

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
        {banner?.enabled !== false && (banner?.title || banner?.subtitle) && (
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
          {banner?.title && (
            <div
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
              style={{
                marginTop: banner?.title ? 12 : 0,
                fontSize: banner?.subtitle_font_size ?? 20,
                color: banner?.subtitle_color || "#fde68a",
              }}
            >
              {banner.subtitle}
            </div>
          )}
        </div>
        )}
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
              flexWrap: "wrap",
            }}
          >
            <a href="/submit">
              <button className="cta-submit">{t("home.hero.cta.submit")}</button>
            </a>
            <a href="/servers/submit">
              <button className="cta-server">{t("home.hero.cta.server")}</button>
            </a>
          </div>
        </div>
      </section>

      <section className="home-section-wrap" style={{ width: "100%", margin: 0, padding: 0 }}>
        <HomeSplitContent
          t={t}
          mlos={mlos}
          featuredMlos={featuredMlos}
          conveyorMlos={conveyorMlos}
          servers={servers}
          conveyorServers={conveyorServers}
          displayedPartners={displayedPartners}
          partnerConveyorItems={partnerConveyorItems}
          displayedSpotlight={displayedSpotlight}
          showPartnersSection={SHOW_PARTNERS_SECTION}
          showPartnersConveyor={SHOW_PARTNERS_CONVEYOR}
          conveyorSpeedSec={MLO_CONVEYOR_SPEED_SEC}
          variant={variant}
        />
      </section>

      <style>{`
        @keyframes mloConveyorScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes partnerConveyorScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes serverConveyorScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partner-conveyor-card:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 32px rgba(251, 191, 36, 0.25) !important;
        }
        .server-conveyor-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
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

function getServerImageUrl(s: { banner_url?: string | null; logo_url?: string | null; thumbnail_url?: string | null; gallery_images?: string[] | null }): string | null {
  if (s.banner_url?.trim()) return s.banner_url;
  if (s.logo_url?.trim()) return s.logo_url;
  if (s.thumbnail_url?.trim()) return s.thumbnail_url;
  if (Array.isArray(s.gallery_images) && s.gallery_images.length > 0) return s.gallery_images[0];
  return null;
}

function GatePage() {
  const searchParams = useSearchParams();
  const [mlosCount, setMlosCount] = useState<number | undefined>();
  const [creatorsCount, setCreatorsCount] = useState<number | undefined>();
  const [serversCount, setServersCount] = useState<number | undefined>();
  const [mloImages, setMloImages] = useState<string[]>([]);
  const [serverImages, setServerImages] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = params.get("next") || "/servers";
      window.location.replace(
        `${window.location.origin}/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
      return;
    }
  }, [searchParams]);

  function fetchGateCounts() {
    Promise.all([
      fetch("/api/mlo", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/servers", { cache: "no-store" }).then((r) => r.json()),
    ])
    .then(([mloRes, serverRes]) => {
      const mlos = Array.isArray(mloRes.mlos) ? mloRes.mlos : [];
      const creators = new Set(mlos.map((m: { creator?: string }) => (m.creator || "").trim()).filter(Boolean));
      setMlosCount(mlos.length);
      setCreatorsCount(creators.size);

      const mloImgUrls = mlos
        .filter((m: { image_url?: string | null }) => m.image_url?.trim())
        .map((m: { image_url: string }) => m.image_url);
      setMloImages(mloImgUrls);

      const servers = Array.isArray(serverRes.servers) ? serverRes.servers : [];
      setServersCount(servers.length);
      const claimedWithPic = servers.filter(
        (s: { grandfathered?: boolean; claimed_by_user_id?: string | null; banner_url?: string | null; logo_url?: string | null; thumbnail_url?: string | null; gallery_images?: string[] | null }) =>
          (s.grandfathered === true || !!s.claimed_by_user_id) && getServerImageUrl(s)
      );
      const srvImgUrls = claimedWithPic.map(
        (s: { grandfathered?: boolean; claimed_by_user_id?: string | null; banner_url?: string | null; logo_url?: string | null; thumbnail_url?: string | null; gallery_images?: string[] | null }) =>
          getServerImageUrl(s)!
      );
      setServerImages(srvImgUrls);
    })
    .catch(() => {
      /* API unavailable (dev, network, etc) – keep existing counts */
    });
  }

  useEffect(() => {
    fetchGateCounts();
    const interval = setInterval(fetchGateCounts, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className="home-root gate-page"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: `linear-gradient(180deg, rgba(4, 6, 10, 0.68) 0%, rgba(4, 6, 10, 0.78) 50%, rgba(2, 4, 8, 0.92) 100%), #0a0c10 url("/api/home-bg") no-repeat center top / cover`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        className="gate-page-content-wrap"
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <div
          className="gate-language-wrap"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            paddingTop: "max(16px, env(safe-area-inset-top, 0))",
            paddingBottom: 12,
            flexShrink: 0,
          }}
        >
          <LanguageSelect />
          <DiscordLink />
          <RedditLink />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <HomeGate
          mlosCount={mlosCount}
          creatorsCount={creatorsCount}
          serversCount={serversCount}
          mloImages={mloImages}
          serverImages={serverImages}
        />
        </div>
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
      <GatePage />
    </Suspense>
  );
}
