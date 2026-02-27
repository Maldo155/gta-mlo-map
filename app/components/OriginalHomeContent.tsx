"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import { useLanguage } from "./LanguageProvider";
import LivePlayerCount from "./LivePlayerCount";
import type { Server } from "../lib/serverTags";

const PARTNER_FADE_MS = 800;
const PARTNER_INTERVAL_MS = 5000;

type PartnerCreator = {
  creator_key: string;
  logo_url: string | null;
  spotlight_logo_size: number;
  displayName: string;
  count: number;
};

function PartnersFadeSlideshow({
  partners,
  t,
}: {
  partners: PartnerCreator[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [visibleSlot, setVisibleSlot] = useState(0);
  const [slot0, setSlot0] = useState(partners[0] ?? null);
  const [slot1, setSlot1] = useState(partners[1] ?? partners[0] ?? null);
  const indexRef = useRef(0);
  const slotRef = useRef(0);
  const listRef = useRef(partners);
  listRef.current = partners;
  const n = partners.length;
  const partnersKey = partners.map((p) => p.creator_key).join(",");

  useEffect(() => {
    listRef.current = partners;
    const p0 = partners[0] ?? null;
    const p1 = partners[1] ?? p0;
    setSlot0(p0);
    setSlot1(p1);
    indexRef.current = 0;
    slotRef.current = 0;
    setVisibleSlot(0);
  }, [partnersKey]);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => {
      const L = listRef.current;
      const i = indexRef.current;
      const slot = slotRef.current;
      const next = (i + 1) % n;
      const twoAhead = (i + 2) % n;
      indexRef.current = next;
      if (slot === 0) {
        setSlot1(L[next] ?? L[0]);
        setVisibleSlot(1);
        slotRef.current = 1;
        setTimeout(() => setSlot0(L[twoAhead] ?? L[0]), PARTNER_FADE_MS);
      } else {
        setSlot0(L[next] ?? L[0]);
        setVisibleSlot(0);
        slotRef.current = 0;
        setTimeout(() => setSlot1(L[twoAhead] ?? L[0]), PARTNER_FADE_MS);
      }
    }, PARTNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [n]);

  const renderCard = (p: PartnerCreator | null) => {
    if (!p) return null;
    return (
      <a
        href="/creators"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        padding: 28,
        border: "2px solid rgba(34,211,238,0.5)",
        borderRadius: 16,
        backgroundColor: "#0f1528",
        textDecoration: "none",
        color: "inherit",
        boxSizing: "border-box",
        }}
      >
        {p.logo_url ? (
          <img
            src={p.logo_url}
            alt=""
            loading="lazy"
            style={{
              maxWidth: `${Math.min(100, p.spotlight_logo_size)}%`,
              maxHeight: 120,
              objectFit: "contain",
            }}
          />
        ) : (
          <span style={{ fontWeight: 700, fontSize: 24 }}>{p.displayName}</span>
        )}
      </a>
    );
  };

  if (!slot0 && !slot1) return null;

  return (
    <div
      style={{
        position: "relative",
        width: 340,
        height: 260,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "inline-flex",
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 18,
          fontWeight: 800,
          background: "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(245, 158, 11, 0.35))",
          border: "1px solid rgba(251, 191, 36, 0.7)",
          color: "#fde68a",
          boxShadow: "0 0 16px rgba(251, 191, 36, 0.5)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        ★
      </span>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: visibleSlot === 0 ? 1 : 0,
          transition: `opacity ${PARTNER_FADE_MS}ms ease-in-out`,
        }}
      >
        {renderCard(slot0)}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: visibleSlot === 1 ? 1 : 0,
          transition: `opacity ${PARTNER_FADE_MS}ms ease-in-out`,
        }}
      >
        {renderCard(slot1)}
      </div>
    </div>
  );
}

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

function OriginalHomeContent() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isMloHome = pathname === "/mlo";
  const isCitiesHome = pathname === "/cities";
  const useCompactLayout = isMloHome || isCitiesHome;
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
  const serversCount = servers.length;
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
    const url = isMloHome ? "/api/site-banner" : isCitiesHome ? "/api/site-banner-cities" : "/api/site-banner";
    fetch(url, { cache: "no-store" })
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
  }, [isMloHome, isCitiesHome]);

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
    return [...mlos].slice(0, 12);
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
    const withPics = servers.filter(
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


  const sectionWrapStyle = {
    width: "100%" as const,
    maxWidth: 1440,
    margin: "0 auto" as const,
    padding: useCompactLayout ? "24px 32px 40px" : "28px 32px 40px",
    boxSizing: "border-box" as const,
  };

  return (
    <main
      className="home-root original-home"
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
          background: isCitiesHome
            ? `linear-gradient(180deg, rgba(10, 13, 20, 0.7) 0%, rgba(10, 13, 20, 0.78) 50%, rgba(8, 10, 15, 0.92) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover`
            : `linear-gradient(180deg, rgba(10, 13, 20, 0.55) 0%, rgba(10, 13, 20, 0.65) 50%, rgba(8, 10, 15, 0.82) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, overflowX: "hidden", width: "100%", maxWidth: "100%" }}>
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
        style={sectionWrapStyle}
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
            padding: "36px 44px",
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
                fontSize: banner?.title_font_size ?? 36,
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
                fontSize: banner?.subtitle_font_size ?? 22,
                color: banner?.subtitle_color || "#fde68a",
              }}
            >
              {banner.subtitle}
            </div>
          )}
        </div>
        )}
      </section>

      {mlos.length > 0 && isMloHome && (
      <section
        className="home-section-wrap"
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 32px 20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: SHOW_PARTNERS_SECTION && displayedPartners.length > 0 ? "grid" : "block",
            gridTemplateColumns: "auto 1fr",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {SHOW_PARTNERS_SECTION && displayedPartners.length > 0 && (
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: 0.3,
                    color: "#a855f7",
                    textShadow: "0 0 16px rgba(168, 85, 247, 0.75), 0 0 34px rgba(56, 189, 248, 0.5)",
                  }}
                >
                  {t("home.partners.label")}
                </span>
              </div>
              <PartnersFadeSlideshow
                partners={displayedPartners}
                t={t}
              />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.3,
            opacity: 0.9,
            marginBottom: 10,
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
              gap: 12,
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
                  width: 260,
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
                    height: 140,
                    objectFit: "cover",
                    borderBottom: "1px solid #243046",
                    display: "block",
                  }}
                />
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {mlo.name || t("home.mlo.untitled")}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    {mlo.creator || t("home.mlo.unknownCreator")}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
          </div>
        </div>
      </section>
      )}

      <section
        className={`home-section-wrap home-hero-section ${useCompactLayout ? "mlo-hero-compact" : ""}`}
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: useCompactLayout ? "48px 32px 32px" : "80px 32px 48px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: useCompactLayout ? "grid" : "block",
            gridTemplateColumns: useCompactLayout ? "1fr auto" : undefined,
            gap: useCompactLayout ? 40 : undefined,
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: useCompactLayout ? undefined : 820,
              margin: useCompactLayout ? 0 : "0 auto",
              textAlign: useCompactLayout ? "left" : "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                fontSize: 14,
                color: "#b8c2d9",
                border: "1px solid #243046",
                padding: "10px 18px",
                  borderRadius: 999,
                  background: "#10162b",
                  marginBottom: 20,
                }}
              >
                {t("home.badge")}
              </div>
              <h1
                className="home-hero-title hero-tagline"
                style={{
                  fontSize: useCompactLayout ? 58 : 62,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {(() => {
                  const hero = isMloHome ? t("home.hero.title.mlo") : isCitiesHome ? t("home.hero.title.cities") : t("home.hero.title");
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
                  marginTop: 28,
                  justifyContent: useCompactLayout ? "flex-start" : "center",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {!isCitiesHome && (
                  <a href="/submit">
                    <button className="cta-submit">{t("home.hero.cta.submit")}</button>
                  </a>
                )}
                {isMloHome ? (
                  <a
                    href="/map"
                    style={{
                    color: "#93c5fd",
                    fontSize: 18,
                    textDecoration: "none",
                      opacity: 0.95,
                    }}
                  >
                    {t("home.hero.cta.map")} →
                  </a>
                ) : isCitiesHome ? (
                  <>
                    <a href="/servers#unclaimed-servers">
                      <button className="cta-server">{t("servers.claimYourCity")}</button>
                    </a>
                    <a href="/servers/submit">
                      <button className="cta-server">{t("home.hero.cta.server")}</button>
                    </a>
                  </>
                ) : (
                  <a href="/servers/submit">
                    <button className="cta-server">{t("home.hero.cta.server")}</button>
                  </a>
                )}
              </div>
            </div>
          </div>
          {isMloHome && (
            <a href="/map" style={{ textDecoration: "none", flexShrink: 0 }}>
              <div
                style={{
                  border: "2px solid rgba(34,211,238,0.5)",
                  borderRadius: 16,
                  padding: 24,
                  background: "rgba(16, 22, 43, 0.9)",
                  boxSizing: "border-box",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  width: 380,
                }}
                className="card home-map-tile"
              >
                <div
                  style={{
                    height: 140,
                    borderRadius: 12,
                    backgroundImage: "url(/maps/find-mlos-tile.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    marginBottom: 12,
                    border: "1px solid rgba(34,211,238,0.3)",
                    opacity: 0.9,
                  }}
                />
            <div style={{ fontSize: 14, opacity: 0.7, color: "#22d3ee" }}>
              {t("home.tiles.map.title")}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, color: "#67e8f9" }}>
              {t("home.tiles.map.subtitle")} ({mlos.length})
            </div>
            <div style={{ marginTop: 10, color: "#7dd3fc", fontSize: 16 }}>
                  {t("home.tiles.map.desc")}
                </div>
              </div>
            </a>
          )}
          {isCitiesHome && (
            <a href="/servers" style={{ textDecoration: "none", flexShrink: 0 }}>
              <div
                style={{
                  border: "2px solid rgba(255,111,0,0.5)",
                  borderRadius: 16,
                  padding: 24,
                  background: "rgba(16, 22, 43, 0.9)",
                  boxSizing: "border-box",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  width: 380,
                }}
                className="card home-map-tile"
              >
                <div
                  style={{
                    height: 140,
                    borderRadius: 12,
                    backgroundImage: "url(/maps/find-servers-tile.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    marginBottom: 12,
                    border: "1px solid rgba(255,111,0,0.3)",
                    opacity: 0.9,
                  }}
                />
                <div style={{ fontSize: 14, opacity: 0.7, color: "#ff9f5c" }}>
                  {t("home.tiles.servers.title")}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, color: "#ffb380" }}>
                  {t("home.tiles.servers.subtitle")} ({serversCount})
                </div>
                <div style={{ marginTop: 10, color: "#c4a574", fontSize: 16 }}>
                  {t("home.tiles.servers.desc")}
                </div>
              </div>
            </a>
          )}
        </div>
      </section>

      {isCitiesHome && (
      <section
        className="home-section-wrap"
        style={{ maxWidth: 1580, margin: "0 auto", padding: "32px 24px 24px" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {/* Top Cities - placeholder for rank system */}
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 0.4,
                marginBottom: 8,
                color: "#ff9f5c",
              }}
            >
              {t("home.cities.topCities.label")}
            </div>
            <div
              className="card"
              style={{
                border: "2px solid rgba(255,111,0,0.4)",
                borderRadius: 16,
                padding: 24,
                background: "rgba(16, 22, 43, 0.9)",
              }}
            >
              <div
                style={{
                  height: 120,
                  borderRadius: 12,
                  marginBottom: 16,
                  overflow: "hidden",
                }}
              >
                <img src="/under-construction.svg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ffb380" }}>
                {t("home.cities.topCities.comingSoon")}
              </div>
              <div style={{ marginTop: 12, color: "#c4a574", fontSize: 14 }}>
                {t("home.cities.topCities.desc")}
              </div>
            </div>
          </div>
          {/* Featured Cities - placeholder for monetization */}
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 0.4,
                marginBottom: 8,
                color: "#fbbf24",
              }}
            >
              {t("home.cities.featured.label")}
            </div>
            <div
              className="card"
              style={{
                border: "2px solid rgba(251, 191, 36, 0.4)",
                borderRadius: 16,
                padding: 24,
                background: "rgba(16, 22, 43, 0.9)",
              }}
            >
              <div
                style={{
                  height: 120,
                  borderRadius: 12,
                  marginBottom: 16,
                  overflow: "hidden",
                }}
              >
                <img src="/under-construction.svg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fde68a" }}>
                {t("home.cities.featured.comingSoon")}
              </div>
              <div style={{ marginTop: 12, color: "#c4a574", fontSize: 14 }}>
                {t("home.cities.featured.desc")}
              </div>
            </div>
          </div>
        </div>

        {conveyorServers.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.4, color: "#ff8c42", marginBottom: 16 }}>
              {t("home.cities.conveyor.title")}
            </div>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 1580,
                margin: "0 auto",
                overflow: "hidden",
                maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
                maskSize: "100% 100%",
              }}
            >
              <div
                className="server-conveyor-track"
                style={{
                  display: "flex",
                  gap: 16,
                  animation: `serverConveyorScroll ${MLO_CONVEYOR_SPEED_SEC}s linear infinite`,
                  width: "max-content",
                }}
              >
                {[...conveyorServers, ...conveyorServers].map((s, idx) => {
                  const imgUrl =
                    (s.banner_url && s.banner_url.trim()) ||
                    (s.thumbnail_url && s.thumbnail_url.trim()) ||
                    (Array.isArray(s.gallery_images) && s.gallery_images[0]?.trim()) ||
                    (s.logo_url && s.logo_url.trim()) ||
                    "";
                  return (
                    <div
                      key={`${s.id}-${idx}`}
                      className="server-conveyor-card card"
                      style={{
                        flexShrink: 0,
                        width: 300,
                        border: "1px solid rgba(255,111,0,0.35)",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "#10162b",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <a href={`/servers/${s.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                        <div
                          style={{
                            height: 140,
                            background: imgUrl ? `url(${imgUrl}) center/cover no-repeat` : "#1a1f26",
                            borderBottom: "1px solid rgba(255,111,0,0.25)",
                          }}
                        />
                        <div style={{ padding: 14 }}>
                          <div style={{ fontSize: 17, fontWeight: 700 }}>{s.server_name}</div>
                          <div style={{ marginTop: 6 }}>
                            <LivePlayerCount
                              connectUrl={s.connect_url}
                              cfxId={s.cfx_id}
                              fallbackAvg={s.avg_player_count}
                              fallbackMax={s.max_slots}
                              variant="badge"
                            />
                          </div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {!useCompactLayout && (
      <section
        className="home-section-wrap"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 32px" }}
      >
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
            <a href="/servers" style={{ textDecoration: "none" }}>
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
                  style={{
                    height: 80,
                    borderRadius: 10,
                    backgroundImage: "url(/maps/find-servers-tile.png)",
                    backgroundSize: "130%",
                    backgroundPosition: "center center",
                    marginBottom: 10,
                    border: "1px solid #243046",
                    opacity: 0.88,
                  }}
                />
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {t("home.tiles.servers.title")}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                  {t("home.tiles.servers.subtitle")} ({serversCount})
                </div>
                <div style={{ marginTop: 8, color: "#9ca3af", fontSize: 13 }}>
                  {t("home.tiles.servers.desc")}
                </div>
              </div>
            </a>
        </div>
      </section>
      )}

      {!isCitiesHome && (
      <section
        className={`home-section-wrap ${useCompactLayout ? "mlo-home-main" : ""}`}
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: useCompactLayout ? "0 32px 28px" : "0 32px 36px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          className={`home-spotlight-grid ${useCompactLayout ? "mlo-home-grid" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: useCompactLayout ? "1fr" : "minmax(0, 1fr) 320px",
            gap: useCompactLayout ? 28 : 20,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: useCompactLayout ? 24 : 20,
              order: useCompactLayout ? 1 : undefined,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: useCompactLayout ? 20 : 22,
                fontWeight: 800,
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              {t("home.fresh.label")}
            </div>
            <div
              className={useCompactLayout ? "home-fresh-mlo-grid" : undefined}
              style={{
                display: "grid",
                gridTemplateColumns: useCompactLayout ? "repeat(4, minmax(0, 1fr))" : "repeat(auto-fit, minmax(280px, 1fr))",
                gap: useCompactLayout ? 24 : 20,
                width: "100%",
                minWidth: 0,
              }}
            >
              {featuredMlos.length === 0 ? (
                <div style={{ opacity: 0.7, fontSize: 13, gridColumn: "1 / -1" }}>
                  {t("home.fresh.empty")}
                </div>
              ) : (
              featuredMlos.map((mlo) => (
                <div
                  key={mlo.id}
                  style={{
                    border: "1px solid #243046",
                    borderRadius: 10,
                    padding: useCompactLayout ? 14 : 14,
                    background: "#10162b",
                  }}
                  className="card"
                >
                  <div
                    style={{
                      aspectRatio: useCompactLayout ? "4/3" : "16/9",
                      borderRadius: 6,
                      marginBottom: 10,
                      border: "1px solid #243046",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={mlo.image_url || "/maps/gta-5-map-atlas-hd.jpg"}
                      alt=""
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>
                    {t("home.mlo.label")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {mlo.name || t("home.mlo.untitled")}
                  </div>
                  <div style={{ marginTop: 2, color: "#9ca3af", fontSize: 11 }}>
                    {mlo.creator || t("home.mlo.unknownCreator")}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <a
                      href={`/map?mloId=${encodeURIComponent(mlo.id)}&highlight=1${
                        mlo.x != null && mlo.y != null
                          ? `&x=${encodeURIComponent(mlo.x)}&y=${encodeURIComponent(mlo.y)}`
                          : ""
                      }`}
                      style={{ color: "#93c5fd", fontSize: 14 }}
                    >
                      {t("home.mlo.viewMap")}
                    </a>
                  </div>
                </div>
              ))
              )}
            </div>
            {mlos.length > 0 && !useCompactLayout && (
              <>
                <div
                  style={{
                    fontSize: 18,
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
                      gap: 12,
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
                          width: 280,
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
                            height: 140,
                            objectFit: "cover",
                            borderBottom: "1px solid #243046",
                            display: "block",
                          }}
                        />
                        <div style={{ padding: 14 }}>
                          <div style={{ fontSize: 17, fontWeight: 700 }}>
                            {mlo.name || t("home.mlo.untitled")}
                          </div>
                          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
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
          <div
            className={useCompactLayout ? "mlo-partners-spotlight-row" : undefined}
              style={{
                display: useCompactLayout ? "grid" : "flex",
                gridTemplateColumns: useCompactLayout ? "1fr" : undefined,
              flexDirection: "column",
              gap: 12,
              order: useCompactLayout ? 3 : undefined,
              alignItems: "stretch",
              minWidth: 0,
            }}
          >
            {SHOW_PARTNERS_SECTION && (isCitiesHome || !isMloHome) && (
              <div
                style={{
                  display: useCompactLayout ? "flex" : undefined,
                  flexDirection: useCompactLayout ? "column" : undefined,
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    border: "1px solid #243046",
                    borderRadius: useCompactLayout ? 14 : 18,
                    padding: useCompactLayout ? "22px 24px" : "28px 32px",
                    background:
                      "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.05))",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: useCompactLayout ? 20 : 24,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 18,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(245, 158, 11, 0.35))",
                        border: "1px solid rgba(251, 191, 36, 0.7)",
                        color: "#fde68a",
                        boxShadow: "0 0 16px rgba(251, 191, 36, 0.5)",
                      }}
                    >
                      ★
                    </span>
                    <span
                      style={{
                        color: "#a855f7",
                        fontWeight: 900,
                        textShadow: "0 0 16px rgba(168, 85, 247, 0.75), 0 0 34px rgba(56, 189, 248, 0.5)",
                      }}
                    >
                      {t("home.partners.label")}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 18,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(245, 158, 11, 0.35))",
                        border: "1px solid rgba(251, 191, 36, 0.7)",
                        color: "#fde68a",
                        boxShadow: "0 0 16px rgba(251, 191, 36, 0.5)",
                      }}
                    >
                      ★
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #243046",
                    borderRadius: 18,
                    padding: 24,
                    background: "#0d1324",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  {displayedPartners.length > 0 ? (
                    SHOW_PARTNERS_CONVEYOR ? (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          className="partner-conveyor-viewport"
                          style={{
                            width: useCompactLayout ? 260 : 328,
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="partner-conveyor-track"
                            style={{
                              display: "flex",
                              gap: 12,
                              animation: `partnerConveyorScroll ${MLO_CONVEYOR_SPEED_SEC}s linear infinite`,
                              width: "max-content",
                            }}
                          >
                            {[...partnerConveyorItems, ...partnerConveyorItems].map((creator, idx) => (
                              <a
                                key={`${creator.creator_key}-${idx}`}
                                href="/creators"
                                className="partner-conveyor-card"
                                style={{
                                  flexShrink: 0,
                                  width: useCompactLayout ? 252 : 320,
                                  border: "1px solid #243046",
                                  borderRadius: useCompactLayout ? 12 : 16,
                                  overflow: "hidden",
                                  backgroundColor: "#0f1528",
                                  textDecoration: "none",
                                  color: "inherit",
                                  padding: 24,
                                  boxSizing: "border-box",
                                  display: "block",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: 140,
                                  }}
                                >
                                  {creator.logo_url ? (
                                    <img
                                      src={creator.logo_url}
                                      alt=""
                                      loading="lazy"
                                      style={{
                                        maxWidth: `${creator.spotlight_logo_size}%`,
                                        maxHeight: 96,
                                        width: "auto",
                                        height: "auto",
                                        objectFit: "contain",
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontWeight: 700, fontSize: 20 }}>{creator.displayName}</span>
                                  )}
                                </div>
                                <div style={{ textAlign: "center", fontSize: 14, opacity: 0.9, marginTop: 8, fontWeight: 600 }}>
                                  {t("home.partners.count", { count: creator.count })}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {displayedPartners.map((creator) => (
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
                    )
                  ) : (
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      {t("home.partners.empty")}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div
              style={{
                display: useCompactLayout ? "flex" : undefined,
                flexDirection: useCompactLayout ? "column" : undefined,
                gap: 12,
                minWidth: 0,
              }}
            >
            <div
              style={{
                border: useCompactLayout ? "2px solid rgba(34,211,238,0.5)" : "1px solid #c7ff4a",
                borderRadius: useCompactLayout ? 16 : 14,
                padding: useCompactLayout ? 24 : 12,
                background: useCompactLayout ? "#0f1528" : "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(111,95,231,0.12))",
                boxShadow: useCompactLayout ? undefined : "0 10px 24px rgba(0,0,0,0.35)",
                boxSizing: "border-box",
              }}
            >
              {useCompactLayout ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: 0.3,
                        color: "#a855f7",
                        textShadow: "0 0 16px rgba(168, 85, 247, 0.75), 0 0 34px rgba(56, 189, 248, 0.5)",
                      }}
                    >
                      {t("home.spotlight.label")}
                    </span>
                    <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6, color: "#cbd5f5" }}>
                      {t("home.spotlight.title")}
                    </div>
                  </div>
                  {displayedSpotlight.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 12,
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      {displayedSpotlight.map((creator) => (
                        <a
                          key={creator.creator_key}
                          href="/creators"
                          className="card"
                          style={{
                            display: "block",
                            flex: 1,
                            minWidth: 0,
                            border: "1px solid #243046",
                            borderRadius: 12,
                            overflow: "hidden",
                            backgroundColor: "#10162b",
                            textDecoration: "none",
                            color: "inherit",
                            padding: 16,
                            boxSizing: "border-box",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 80,
                            }}
                          >
                            {creator.logo_url ? (
                              <img
                                key={creator.logo_url}
                                src={creator.logo_url}
                                alt=""
                                loading="lazy"
                                style={{
                                  maxWidth: `${Math.min(100, creator.spotlight_logo_size)}%`,
                                  maxHeight: 64,
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
                          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                            {(creator as { verified_creator?: boolean }).verified_creator && (
                              <span
                                title="Verified MLO Creator"
                                style={{
                                  display: "inline-flex",
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  fontSize: 10,
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
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  fontSize: 10,
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
                          <div style={{ textAlign: "center", fontSize: 12, opacity: 0.9, marginTop: 6 }}>
                            {t("home.spotlight.count", { count: creator.count })}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7, fontSize: 13, textAlign: "center" }}>
                      {t("home.spotlight.empty")}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.4, marginBottom: 8 }}>
                    {t("home.spotlight.label")}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {t("home.spotlight.title")}
                  </div>
                  {displayedSpotlight.length > 0 ? (
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", marginTop: 12 }}>
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
                              <span title="Verified MLO Creator" style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 999, fontSize: 9, fontWeight: 700, background: "rgba(59, 130, 246, 0.25)", border: "1px solid rgba(59, 130, 246, 0.5)", color: "#93c5fd" }}>✓</span>
                            )}
                            {(creator as { partnership?: boolean }).partnership && (
                              <span title="Partner" style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 999, fontSize: 9, fontWeight: 800, background: "linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(245, 158, 11, 0.3))", border: "1px solid rgba(251, 191, 36, 0.6)", color: "#fde68a", boxShadow: "0 0 10px rgba(251, 191, 36, 0.4)" }}>★</span>
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
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </section>
      )}

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
          box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important;
        }
        .server-conveyor-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(255,111,0,0.3);
        }
      `}</style>

      {showContact && (
        <section
          id="contact"
          className="home-section-wrap"
          style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px 72px" }}
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
      <section className="home-section-wrap" style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px 64px" }}>
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
                    ↑ {req.upvotes ?? 0}
                  </button>
                  <button onClick={() => voteRequest(req.id, "down")}>
                    ↓ {req.downvotes ?? 0}
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

export default OriginalHomeContent;
