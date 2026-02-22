"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";
import type { Server } from "../lib/serverTags";
import {
  REGIONS,
  ECONOMY_TYPES,
  RP_TYPES,
  CRIMINAL_DEPTH,
  LOOKING_FOR_POSITIONS,
} from "../lib/serverTags";
import { extractCfxId } from "../lib/cfxUtils";

const PREDEFINED_LOOKING_FOR_KEYS = new Set<string>(LOOKING_FOR_POSITIONS.map((p) => p.key));

const PROFANITY_BLOCKLIST = new Set([
  "ass", "asses", "asshole", "assholes",
  "bitch", "bitches", "bastard", "bastards",
  "cock", "cocks", "cunt", "cunts",
  "dick", "dicks", "dickhead",
  "fuck", "fucked", "fucker", "fucking", "fucks",
  "pussy", "pussies", "pussys",
  "shit", "shitty", "shitter",
  "slut", "sluts", "whore", "whores",
  "tit", "tits", "titty",
]);

function containsProfanity(value: string): boolean {
  const lower = value.toLowerCase().trim();
  if (PROFANITY_BLOCKLIST.has(lower)) return true;
  const words = lower.split(/\s+/);
  return words.some((w) => PROFANITY_BLOCKLIST.has(w));
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseLookingForOther(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[,;\n]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
}

export default function ServersContent() {
  const { t } = useLanguage();
  const [servers, setServers] = useState<Server[]>([]);
  const [creatorsList, setCreatorsList] = useState<{ key: string; label: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterEconomy, setFilterEconomy] = useState<string>("");
  const [filterRp, setFilterRp] = useState<string>("");
  const [filterWhitelisted, setFilterWhitelisted] = useState<boolean | null>(
    null
  );
  const [filterNoP2W, setFilterNoP2W] = useState(false);
  const [filterNewPlayerFriendly, setFilterNewPlayerFriendly] = useState(false);
  const [filterLookingFor, setFilterLookingFor] = useState<Set<string>>(new Set());
  const [liveCounts, setLiveCounts] = useState<Record<string, { players: number; max: number }>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [likedServerIds, setLikedServerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange((_, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/servers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setServers(d.servers || []))
      .catch(() => setServers([]));
  }, []);
  useEffect(() => {
    fetch("/api/creators/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCreatorsList(d.creators || []))
      .catch(() => setCreatorsList([]));
  }, []);

  const VISITOR_ID_KEY = "mlomesh_visitor_id";
  function getOrCreateVisitorId(): string {
    if (typeof window === "undefined") return "";
    try {
      let id = localStorage.getItem(VISITOR_ID_KEY);
      if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
        id = crypto.randomUUID();
        localStorage.setItem(VISITOR_ID_KEY, id);
      }
      return id;
    } catch {
      return "";
    }
  }

  useEffect(() => {
    if (session?.access_token) {
      fetch("/api/servers/likes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d) => setLikedServerIds(new Set(d.likedIds || [])))
        .catch(() => {});
    } else {
      const vid = getOrCreateVisitorId();
      if (vid) {
        fetch("/api/servers/likes", {
          headers: { "X-Visitor-ID": vid },
        })
          .then((r) => r.json())
          .then((d) => setLikedServerIds(new Set(d.likedIds || [])))
          .catch(() => {});
      } else {
        setLikedServerIds(new Set());
      }
    }
  }, [session?.access_token]);

  useEffect(() => {
    const serversWithCfx = servers.filter((s) => {
      const id = s.cfx_id || extractCfxId(s.connect_url || "");
      return !!id;
    });
    if (serversWithCfx.length === 0) return;
    const codes = serversWithCfx.map((s) => (s.cfx_id || extractCfxId(s.connect_url || ""))!).filter(Boolean);
    const uniq = [...new Set(codes)];
    if (uniq.length === 0) return;
    fetch(`/api/fivem-status?codes=${uniq.join(",")}`)
      .then((r) => r.json())
      .then((data) => setLiveCounts(data || {}))
      .catch(() => setLiveCounts({}));
  }, [servers]);

  const allLookingForOptions = useMemo(() => {
    const predefined = LOOKING_FOR_POSITIONS.map((p) => ({ key: p.key, label: p.label }));
    const customSet = new Map<string, string>();
    for (const s of servers) {
      const other = (s.looking_for_other || "").trim();
      if (!other) continue;
      const parts = other.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        const lower = p.toLowerCase();
        if (
          !PREDEFINED_LOOKING_FOR_KEYS.has(lower) &&
          !customSet.has(lower) &&
          !containsProfanity(p)
        ) {
          customSet.set(lower, toTitleCase(p));
        }
      }
    }
    const custom = [...customSet.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([lower, display]) => ({ key: lower, label: display }));
    return [...predefined, ...custom];
  }, [servers]);

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.server_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase());
      const matchRegion = !filterRegion || s.region === filterRegion;
      const matchEconomy = !filterEconomy || s.economy_type === filterEconomy;
      const matchRp = !filterRp || s.rp_type === filterRp;
      const matchWhitelisted =
        filterWhitelisted === null || s.whitelisted === filterWhitelisted;
      const matchNoP2W = !filterNoP2W || s.no_pay_to_win === true;
      const matchNewPlayer =
        !filterNewPlayerFriendly || s.new_player_friendly === true;
      const serverTypes = (s.looking_for_types || []) as string[];
      const serverOtherParts = parseLookingForOther(s.looking_for_other);
      const matchLookingFor =
        filterLookingFor.size === 0 ||
        (filterLookingFor.size > 0 &&
          [...filterLookingFor].some((selected) => {
            if (PREDEFINED_LOOKING_FOR_KEYS.has(selected)) {
              return serverTypes.includes(selected);
            }
            return serverOtherParts.includes(selected.toLowerCase());
          }));
      return (
        matchSearch &&
        matchRegion &&
        matchEconomy &&
        matchRp &&
        matchWhitelisted &&
        matchNoP2W &&
        matchNewPlayer &&
        matchLookingFor
      );
    });
  }, [
    servers,
    search,
    filterRegion,
    filterEconomy,
    filterRp,
    filterWhitelisted,
    filterNoP2W,
    filterNewPlayerFriendly,
    filterLookingFor,
  ]);

  const clearFilters = () => {
    setFilterRegion("");
    setFilterEconomy("");
    setFilterRp("");
    setFilterWhitelisted(null);
    setFilterNoP2W(false);
    setFilterNewPlayerFriendly(false);
    setFilterLookingFor(new Set());
    setSearch("");
  };

  function toggleLookingFor(key: string) {
    setFilterLookingFor((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function recordView(serverId: string) {
    fetch(`/api/servers/${serverId}/view`, { method: "POST" }).catch(() => {});
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, views: (s.views ?? 0) + 1 } : s
      )
    );
  }

  function toggleLike(serverId: string) {
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      const vid = getOrCreateVisitorId();
      if (!vid) return;
      headers["X-Visitor-ID"] = vid;
    }
    fetch(`/api/servers/${serverId}/like`, { method: "POST", headers })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) return;
        setLikedServerIds((prev) => {
          const next = new Set(prev);
          if (res.liked) next.add(serverId);
          else next.delete(serverId);
          return next;
        });
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId ? { ...s, like_count: res.like_count ?? (s.like_count ?? 0) } : s
          )
        );
      })
      .catch(() => {});
  }

  const hasActiveFilters =
    search ||
    filterRegion ||
    filterEconomy ||
    filterRp ||
    filterWhitelisted !== null ||
    filterNoP2W ||
    filterNewPlayerFriendly ||
    filterLookingFor.size > 0;

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
            padding: "12px 16px",
            backgroundColor: "#10162b",
            backgroundImage: 'url("/header-bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            color: "white",
          }}
        >
          <div className="header-top">
            <div className="header-brand" />
            <div className="header-actions">
              <LanguageSelect />
              <AuthLink />
              <DiscordLink />
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

        <div
          className="servers-page-content"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "24px 16px 64px",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {t("servers.title")}
          </h1>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>
            {t("servers.subtitle")}
          </p>
          <a
            href={session ? "/servers/submit" : "/auth/start?next=%2Fservers%2Fsubmit"}
            style={{
              display: "inline-block",
              marginBottom: 24,
              padding: "10px 18px",
              borderRadius: 8,
              background: "#22c55e",
              color: "#0f172a",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            {t("servers.addServer")}
          </a>

          {/* Filters */}
          <div
            className="servers-filters"
            style={{
              marginBottom: 28,
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(55, 65, 81, 0.6)",
              background: "rgba(15, 23, 42, 0.85)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="search"
                placeholder={t("servers.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 400,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#1f2937",
                  color: "white",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Location & style */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              {t("servers.filters.locationStyle")}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#1f2937",
                  color: "white",
                  fontSize: 13,
                }}
              >
                <option value="">{t("servers.filters.region")}</option>
                {REGIONS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <select
                value={filterEconomy}
                onChange={(e) => setFilterEconomy(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#1f2937",
                  color: "white",
                  fontSize: 13,
                }}
              >
                <option value="">{t("servers.filters.economy")}</option>
                {ECONOMY_TYPES.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.label}
                  </option>
                ))}
              </select>
              <select
                value={filterRp}
                onChange={(e) => setFilterRp(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#1f2937",
                  color: "white",
                  fontSize: 13,
                }}
              >
                <option value="">{t("servers.filters.rpType")}</option>
                {RP_TYPES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferences */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              {t("servers.filters.preferences")}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  userSelect: "none",
                  color: "#e2e8f0",
                }}
              >
                <input
                  type="checkbox"
                  checked={filterWhitelisted === true}
                  onChange={(e) =>
                    setFilterWhitelisted(e.target.checked ? true : null)
                  }
                  style={{ width: 16, height: 16, accentColor: "#22c55e", cursor: "pointer" }}
                />
                <span>{t("servers.filters.whitelisted")}</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  userSelect: "none",
                  color: "#e2e8f0",
                }}
              >
                <input
                  type="checkbox"
                  checked={filterNoP2W}
                  onChange={(e) => setFilterNoP2W(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#22c55e", cursor: "pointer" }}
                />
                <span>{t("servers.filters.noP2W")}</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  userSelect: "none",
                  color: "#e2e8f0",
                }}
              >
                <input
                  type="checkbox"
                  checked={filterNewPlayerFriendly}
                  onChange={(e) => setFilterNewPlayerFriendly(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#22c55e", cursor: "pointer" }}
                />
                <span>{t("servers.filters.newPlayerFriendly")}</span>
              </label>
            </div>

            {/* I want to join/be */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              {t("servers.filters.lookingForPrompt")}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {allLookingForOptions.map((pos) => {
                const isSelected = filterLookingFor.has(pos.key);
                return (
                  <button
                    key={pos.key}
                    type="button"
                    className="servers-role-chip"
                    onClick={() => toggleLookingFor(pos.key)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 20,
                      border: isSelected ? "1px solid #22c55e" : "1px solid #374151",
                      background: isSelected ? "rgba(34, 197, 94, 0.25)" : "rgba(31, 41, 55, 0.5)",
                      color: isSelected ? "#86efac" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #64748b",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {t("servers.clearFilters")}
              </button>
            )}
          </div>

          <p
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(31, 41, 55, 0.8)",
                border: "1px solid #374151",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              {t("servers.resultCount", {
                count: filtered.length,
                total: servers.length,
              })}
            </span>
          </p>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                opacity: 0.8,
                borderRadius: 12,
                border: "1px solid #374151",
                background: "#1f2937",
              }}
            >
              {servers.length === 0
                ? t("servers.empty")
                : t("servers.noResults")}
            </div>
          ) : (
            <div
              className="servers-card-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 20,
              }}
            >
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    padding: 0,
                    background: "#0f1115",
                    border: "1px solid #1f2937",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    overflow: "hidden",
                  }}
                >
                  {s.banner_url && (
                    <a
                      href={`/servers/${s.id}`}
                      onClick={() => recordView(s.id)}
                      style={{ display: "block", lineHeight: 0 }}
                    >
                      <img
                        src={s.banner_url}
                        alt=""
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </a>
                  )}
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {s.logo_url && (
                        <img
                          src={s.logo_url}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                        {s.server_name}
                      </h2>
                    </div>
                    {s.verified && (
                      <span
                        title="Verified"
                        style={{
                          color: "#3b82f6",
                          fontSize: 14,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {(s.region || s.rp_type || s.economy_type || (Array.isArray(s.criminal_types) && s.criminal_types.length > 0) || s.criminal_other || (Array.isArray(s.looking_for_types) && s.looking_for_types.length > 0) || s.looking_for_other || (Array.isArray(s.creator_keys) && s.creator_keys.length > 0)) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        fontSize: 12,
                        opacity: 0.9,
                      }}
                    >
                      {s.region && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#1f2937",
                          }}
                        >
                          {REGIONS.find((r) => r.key === s.region)?.label || s.region}
                        </span>
                      )}
                      {s.rp_type && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#1f2937",
                          }}
                        >
                          {RP_TYPES.find((r) => r.key === s.rp_type)?.label || s.rp_type}
                        </span>
                      )}
                      {s.economy_type && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#1f2937",
                          }}
                        >
                          {ECONOMY_TYPES.find((e) => e.key === s.economy_type)?.label || s.economy_type}
                        </span>
                      )}
                      {Array.isArray(s.criminal_types) &&
                        s.criminal_types.map((k: string) => (
                          <span
                            key={k}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "#1f2937",
                            }}
                          >
                            {CRIMINAL_DEPTH.find((c) => c.key === k)?.label || k}
                          </span>
                        ))}
                      {s.criminal_other &&
                        s.criminal_other
                          .split(/[,;]/)
                          .map((part: string) => part.trim())
                          .filter(Boolean)
                          .map((lbl: string) => (
                            <span
                              key={lbl}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#1e3a5f",
                              }}
                            >
                              {lbl}
                            </span>
                          ))}
                      {Array.isArray(s.looking_for_types) &&
                        s.looking_for_types.map((k: string) => (
                          <span
                            key={`lf-${k}`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "rgba(234, 179, 8, 0.2)",
                              color: "#eab308",
                            }}
                          >
                            Looking for: {LOOKING_FOR_POSITIONS.find((p) => p.key === k)?.label || k}
                          </span>
                        ))}
                      {s.looking_for_other &&
                        s.looking_for_other
                          .split(/[,;]/)
                          .map((part: string) => part.trim())
                          .filter(Boolean)
                          .map((lbl: string) => (
                            <span
                              key={`lf-other-${lbl}`}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(234, 179, 8, 0.2)",
                                color: "#eab308",
                              }}
                            >
                              Looking for: {lbl}
                            </span>
                          ))}
                      {Array.isArray(s.creator_keys) &&
                        s.creator_keys.map((key: string) => {
                          const label = creatorsList.find((c) => c.key === key)?.label || key;
                          return (
                            <a
                              key={`creator-${key}`}
                              href={`/creators?expanded=${encodeURIComponent(label)}`}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(99, 102, 241, 0.2)",
                                color: "#818cf8",
                                textDecoration: "none",
                              }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      {s.no_pay_to_win && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(34, 197, 94, 0.2)",
                            color: "#22c55e",
                          }}
                        >
                          No P2W
                        </span>
                      )}
                      {s.whitelisted && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "#1f2937",
                          }}
                        >
                          Whitelisted
                        </span>
                      )}
                    </div>
                  )}
                  {(() => {
                    const cfxCode = (s.cfx_id || extractCfxId(s.connect_url || ""))?.toLowerCase();
                    const live = cfxCode ? liveCounts[cfxCode] : null;
                    if (live && (live.players >= 0 || live.max > 0)) {
                      return (
                        <div style={{ fontSize: 13, opacity: 0.95, display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "rgba(34, 197, 94, 0.2)",
                              color: "#22c55e",
                              fontWeight: 600,
                            }}
                          >
                            {live.players} / {live.max} online
                          </span>
                        </div>
                      );
                    }
                    if (s.avg_player_count != null || s.max_slots != null) {
                      return (
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                          {s.avg_player_count != null && (
                            <span>~{s.avg_player_count} avg </span>
                          )}
                          {s.max_slots != null && (
                            <span>• {s.max_slots} max slots</span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {s.description && (
                    <p
                      style={{
                        fontSize: 13,
                        opacity: 0.85,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {s.description}
                    </p>
                  )}
                  <div style={{ marginTop: "auto" }}>
                    <div className="server-card-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      {s.connect_url && (
                        <a
                          href={
                            s.connect_url.startsWith("http://") ||
                            s.connect_url.startsWith("https://") ||
                            s.connect_url.startsWith("fivem://")
                              ? s.connect_url
                              : `https://${s.connect_url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordView(s.id)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 8,
                            background: "#22c55e",
                            color: "#0f172a",
                            fontWeight: 600,
                            textDecoration: "none",
                            fontSize: 14,
                          }}
                        >
                          {t("servers.join")}
                        </a>
                      )}
                      {s.discord_url && (
                        <a
                          href={s.discord_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordView(s.id)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 8,
                            border: "1px solid #5865f2",
                            color: "#5865f2",
                            textDecoration: "none",
                            fontSize: 14,
                          }}
                        >
                          Discord
                        </a>
                      )}
                      <a
                        href={`/servers/${s.id}`}
                        onClick={() => recordView(s.id)}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 8,
                          border: "1px solid #4b5563",
                          color: "#9ca3af",
                          textDecoration: "none",
                          fontSize: 14,
                        }}
                      >
                        {t("servers.viewDetails")}
                      </a>
                      {session?.user?.id && s.user_id && session.user.id === s.user_id && (
                        <a
                          href={`/servers/${s.id}/edit`}
                          onClick={() => recordView(s.id)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 8,
                            border: "1px solid #6366f1",
                            color: "#818cf8",
                            textDecoration: "none",
                            fontSize: 14,
                          }}
                        >
                          Edit
                        </a>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, opacity: 0.9, justifyContent: "flex-start" }}>
                      <span title={t("servers.views") ?? "Views"}>
                        👁 {(s.views ?? 0).toLocaleString()}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => toggleLike(s.id)}
                          title={likedServerIds.has(s.id) ? t("servers.unlike") : t("servers.like")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                            opacity: likedServerIds.has(s.id) ? 1 : 0.6,
                          }}
                        >
                          {likedServerIds.has(s.id) ? "❤️" : "🤍"}
                        </button>
                        <span>{(s.like_count ?? 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
