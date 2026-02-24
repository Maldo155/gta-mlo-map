"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import ServerBadges from "../components/ServerBadges";
import ServerModal from "../components/ServerModal";
import ClaimModal from "../components/ClaimModal";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [creatorsList, setCreatorsList] = useState<{ key: string; label: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterEconomy, setFilterEconomy] = useState<string>("");
  const [filterRp, setFilterRp] = useState<string>("");
  const [filterWhitelisted, setFilterWhitelisted] = useState<boolean | null>(null);
  const [filterNoP2W, setFilterNoP2W] = useState(false);
  const [filterPdActive, setFilterPdActive] = useState(false);
  const [filterEmsActive, setFilterEmsActive] = useState(false);
  const [filterControllerFriendly, setFilterControllerFriendly] = useState(false);
  const [filterNewPlayerFriendly, setFilterNewPlayerFriendly] = useState(false);
  const [filterLookingFor, setFilterLookingFor] = useState<Set<string>>(new Set());
  const [liveCounts, setLiveCounts] = useState<Record<string, { players: number; max: number }>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [likedServerIds, setLikedServerIds] = useState<Set<string>>(new Set());
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [claimServer, setClaimServer] = useState<Server | null>(null);
  const closeModal = useCallback(() => setSelectedServer(null), []);

  const refreshServers = useCallback(() => {
    fetch("/api/servers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setServers(d.servers || []))
      .catch(() => {});
  }, []);

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

  const claimId = searchParams.get("claim");
  useEffect(() => {
    if (!claimId || servers.length === 0) return;
    const server = servers.find((s) => s.id === claimId);
    if (server) {
      setClaimServer(server);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("claim");
      const clean = params.toString() ? `?${params}` : "";
      router.replace(`/servers${clean}`, { scroll: false });
    }
  }, [claimId, servers, searchParams, router]);
  useEffect(() => {
    fetch("/api/creators/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCreatorsList(d.creators || []))
      .catch(() => setCreatorsList([]));
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      fetch("/api/servers/likes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d) => setLikedServerIds(new Set(d.likedIds || [])))
        .catch(() => {});
    } else {
      setLikedServerIds(new Set());
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
      const matchPdActive = !filterPdActive || s.pd_active === true;
      const matchEmsActive = !filterEmsActive || s.ems_active === true;
      const matchController =
        !filterControllerFriendly || s.controller_friendly === true;
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
        matchPdActive &&
        matchEmsActive &&
        matchController &&
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
    filterPdActive,
    filterEmsActive,
    filterControllerFriendly,
    filterNewPlayerFriendly,
    filterLookingFor,
  ]);

  const claimedServers = useMemo(
    () => filtered.filter((s) => s.grandfathered === true || s.claimed_by_user_id),
    [filtered]
  );
  const unclaimedServers = useMemo(
    () => filtered.filter((s) => !s.grandfathered && !s.claimed_by_user_id),
    [filtered]
  );

  const clearFilters = () => {
    setFilterRegion("");
    setFilterEconomy("");
    setFilterRp("");
    setFilterWhitelisted(null);
    setFilterNoP2W(false);
    setFilterPdActive(false);
    setFilterEmsActive(false);
    setFilterControllerFriendly(false);
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

  const recordView = useCallback((serverId: string) => {
    fetch(`/api/servers/${serverId}/view`, { method: "POST" }).catch(() => {});
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, views: (s.views ?? 0) + 1 } : s
      )
    );
  }, []);

  function toggleLike(serverId: string) {
    if (!session?.access_token) return;
    fetch(`/api/servers/${serverId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
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
    filterPdActive ||
    filterEmsActive ||
    filterControllerFriendly ||
    filterNewPlayerFriendly ||
    filterLookingFor.size > 0;

  return (
    <>
      {selectedServer && (
        <ServerModal
          server={selectedServer}
          onClose={closeModal}
          recordView={recordView}
          t={t}
          creatorsList={creatorsList}
          liveCounts={liveCounts}
        />
      )}
      {claimServer && (
        <ClaimModal
          server={claimServer}
          session={session}
          onClose={() => setClaimServer(null)}
          onSuccess={refreshServers}
          t={t}
        />
      )}
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
            'linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover',
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
            <a href="/creators" className="header-link header-link-creators">
              {t("nav.creators")}
            </a>
            <a href="/servers" className="header-link header-link-servers">
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <a
              href={session ? "/servers/submit" : "/auth/start?next=%2Fservers%2Fsubmit"}
              style={{
                display: "inline-block",
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
            <button
              type="button"
              onClick={() => document.getElementById("unclaimed-servers")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                background: "#5865f2",
                border: "1px solid #5865f2",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("servers.claimYourCity")}
            </button>
          </div>

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
              className="servers-location-selects"
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

            {/* Preferences - matches Server features layout */}
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
              className="servers-preferences-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 8,
                padding: 18,
                background: "#14181f",
                borderRadius: 10,
                border: "1px solid rgba(55, 65, 81, 0.5)",
                marginBottom: 20,
              }}
            >
              {[
                {
                  checked: filterWhitelisted === true,
                  set: (v: boolean) => setFilterWhitelisted(v ? true : null),
                  label: t("servers.filters.whitelisted"),
                },
                {
                  checked: filterNoP2W,
                  set: setFilterNoP2W,
                  label: t("servers.filters.noP2W"),
                },
                {
                  checked: filterPdActive,
                  set: setFilterPdActive,
                  label: t("servers.filters.pdActive"),
                },
                {
                  checked: filterEmsActive,
                  set: setFilterEmsActive,
                  label: t("servers.filters.emsActive"),
                },
                {
                  checked: filterControllerFriendly,
                  set: setFilterControllerFriendly,
                  label: t("servers.filters.controllerFriendly"),
                },
                {
                  checked: filterNewPlayerFriendly,
                  set: setFilterNewPlayerFriendly,
                  label: t("servers.filters.newPlayerFriendly"),
                },
              ].map(({ checked, set, label }) => (
                <label
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    minHeight: 40,
                    whiteSpace: "nowrap",
                    fontSize: 13,
                    userSelect: "none",
                    color: "#e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(e.target.checked)}
                    style={{ width: 18, height: 18, flexShrink: 0, accentColor: "#22c55e", cursor: "pointer" }}
                  />
                  {label}
                </label>
              ))}
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
              marginTop: 16,
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
            <>
              {claimedServers.length > 0 && (
                <>
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 16,
                      color: "#f1f5f9",
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(34, 197, 94, 0.2))",
                      padding: "12px 20px",
                      borderRadius: 12,
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    {t("servers.claimedSection")}
                  </h2>
                  <div
                    className="servers-card-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 20,
                      marginBottom: unclaimedServers.length > 0 ? 48 : 0,
                    }}
                  >
              {claimedServers.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedServer(s)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedServer(s)}
                  style={{
                    padding: 0,
                    background: s.banner_url
                      ? `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.94) 100%), url(${s.banner_url}) center center / cover no-repeat`
                      : "#0f1115",
                    border: "1px solid #1f2937",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    minHeight: 200,
                  }}
                >
                  <ServerBadges ogServer={s.og_server} verified={s.verified || !!(s.claimed_by_user_id || s.grandfathered)} position="bottom" />
                  {(s.og_server || s.verified) && !s.banner_url && (
                    <div style={{ height: 42, minHeight: 42, flexShrink: 0 }} />
                  )}
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0, position: "relative", zIndex: 1, background: s.banner_url ? "linear-gradient(180deg, transparent 0%, rgba(15,17,21,0.4) 60%, rgba(15,17,21,0.85) 100%)" : "transparent" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      width: "100%",
                      padding: 0,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {s.logo_url && (
                        <img
                          src={s.logo_url}
                          alt=""
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 10,
                            objectFit: "cover",
                            flexShrink: 0,
                            border: "2px solid rgba(75, 85, 99, 0.6)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          }}
                        />
                      )}
                      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "inherit", textShadow: "0 0 3px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)" }}>
                        {s.server_name}
                      </h2>
                    </div>
                  </div>
                  {(() => {
                    const MAX_PER_CAT = 2;
                    const tagStyle = { padding: "4px 8px", borderRadius: 4, fontSize: 12 };
                    const general = [s.region && (REGIONS.find((r) => r.key === s.region)?.label || s.region), s.rp_type && (RP_TYPES.find((r) => r.key === s.rp_type)?.label || s.rp_type), s.economy_type && (ECONOMY_TYPES.find((e) => e.key === s.economy_type)?.label || s.economy_type)].filter(Boolean) as string[];
                    const criminal = [...(Array.isArray(s.criminal_types) ? s.criminal_types.map((k: string) => CRIMINAL_DEPTH.find((c) => c.key === k)?.label || k) : []), ...(s.criminal_other ? s.criminal_other.split(/[,;]/).map((p) => p.trim()).filter(Boolean) : [])];
                    const lookingFor = [...(Array.isArray(s.looking_for_types) ? s.looking_for_types.map((k: string) => LOOKING_FOR_POSITIONS.find((p) => p.key === k)?.label || k) : []), ...(s.looking_for_other ? s.looking_for_other.split(/[,;]/).map((p) => p.trim()).filter(Boolean) : [])];
                    const creators = Array.isArray(s.creator_keys) ? s.creator_keys.map((key) => creatorsList.find((c) => c.key === key)?.label || key) : [];
                    const badges = [s.no_pay_to_win && "No P2W", s.whitelisted && "Whitelisted"].filter(Boolean) as string[];
                    const renderSlice = (items: string[], take: number, extraStyle: Record<string, unknown>) => {
                      const shown = items.slice(0, take);
                      const more = items.length - take;
                      return (
                        <>
                          {shown.map((item, i) => (
                            <span key={`${item}-${i}`} style={{ ...tagStyle, ...extraStyle }}>{item}</span>
                          ))}
                          {more > 0 && <span style={{ ...tagStyle, background: "rgba(75, 85, 99, 0.5)", color: "#9ca3af" }}>+{more}</span>}
                        </>
                      );
                    };
                    const hasAny = general.length + criminal.length + lookingFor.length + creators.length + badges.length > 0;
                    if (!hasAny) return null;
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, opacity: 0.9 }}>
                        {general.length > 0 && renderSlice(general, MAX_PER_CAT, { background: "#1f2937" })}
                        {criminal.length > 0 && renderSlice(criminal, MAX_PER_CAT, { background: "#1e3a5f" })}
                        {lookingFor.length > 0 && renderSlice(lookingFor.map((l) => `LF: ${l}`), MAX_PER_CAT, { background: "rgba(234, 179, 8, 0.2)", color: "#eab308" })}
                        {creators.length > 0 && renderSlice(creators, MAX_PER_CAT, { background: "rgba(99, 102, 241, 0.2)", color: "#818cf8" })}
                        {badges.length > 0 && badges.map((b) => <span key={b} style={{ ...tagStyle, background: b === "No P2W" ? "rgba(34, 197, 94, 0.2)" : "#1f2937", color: b === "No P2W" ? "#22c55e" : undefined }}>{b}</span>)}
                      </div>
                    );
                  })()}
                  {(() => {
                    const cfxCode = (s.cfx_id || extractCfxId(s.connect_url || ""))?.toLowerCase();
                    const live = cfxCode ? liveCounts[cfxCode] : null;
                    if (live && (live.players >= 0 || live.max > 0)) {
                      return (
                        <div style={{ fontSize: 14, opacity: 0.95 }}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(34, 197, 94, 0.2)", color: "#22c55e", fontWeight: 600 }}>
                            {live.players} / {live.max} online
                          </span>
                        </div>
                      );
                    }
                    if (s.avg_player_count != null || s.max_slots != null) {
                      return (
                        <div style={{ fontSize: 14, opacity: 0.8 }}>
                          {s.avg_player_count != null && <span>~{s.avg_player_count} avg </span>}
                          {s.max_slots != null && <span>• {s.max_slots} max</span>}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {s.description && (
                    <p
                      style={{
                        fontSize: 15,
                        opacity: 0.9,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                        textShadow: s.banner_url ? "0 1px 3px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,0.7)" : "none",
                      }}
                    >
                      {s.description}
                    </p>
                  )}
                    <div style={{ marginTop: "auto" }} onClick={(e) => e.stopPropagation()}>
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
                            padding: "8px 16px",
                            borderRadius: 8,
                            background: "#22c55e",
                            color: "#0f172a",
                            fontWeight: 600,
                            textDecoration: "none",
                            fontSize: 16,
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
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #5865f2",
                            color: "#5865f2",
                            textDecoration: "none",
                            fontSize: 16,
                          }}
                        >
                          Discord
                        </a>
                      )}
                      <a
                        href={`/servers/${s.id}`}
                        onClick={() => recordView(s.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #4b5563",
                          color: "#9ca3af",
                          textDecoration: "none",
                          fontSize: 16,
                        }}
                      >
                        {t("servers.viewDetails")}
                      </a>
                      {session?.user?.id && s.user_id && session.user.id === s.user_id && (
                        <a
                          href={`/servers/${s.id}/edit`}
                          onClick={() => recordView(s.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #6366f1",
                            color: "#818cf8",
                            textDecoration: "none",
                            fontSize: 16,
                          }}
                        >
                          Edit
                        </a>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16, opacity: 0.95, justifyContent: "flex-start" }}>
                      <span title={t("servers.views") ?? "Views"} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 22 }}>👁</span>
                        {(s.views ?? 0).toLocaleString()}
                      </span>
                      <span className="server-like-row" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {session ? (
                          <button
                            type="button"
                            onClick={() => toggleLike(s.id)}
                            title={likedServerIds.has(s.id) ? t("servers.unlike") : t("servers.like")}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 4,
                              margin: -2,
                              opacity: likedServerIds.has(s.id) ? 1 : 0.6,
                              minWidth: 40,
                              minHeight: 40,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 26,
                            }}
                          >
                            {likedServerIds.has(s.id) ? "❤️" : "🤍"}
                          </button>
                        ) : (
                          <a
                            href={`/auth/start?next=${encodeURIComponent("/servers")}`}
                            title={t("servers.signInToLike") ?? "Sign in to like"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: 40,
                              minHeight: 40,
                              padding: 4,
                              margin: -2,
                              opacity: 0.6,
                              fontSize: 26,
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            🤍
                          </a>
                        )}
                        <span style={{ fontSize: 16 }}>{(s.like_count ?? 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
                  </div>
                </>
              )}
              {unclaimedServers.length > 0 && (
                <div id="unclaimed-servers" style={{ scrollMarginTop: 24 }}>
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: "#f1f5f9",
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                      background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(249, 115, 22, 0.15))",
                      padding: "12px 20px",
                      borderRadius: 12,
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                    }}
                  >
                    {t("servers.unclaimedSection")}
                  </h2>
                  <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>{t("servers.unclaimedHint")}</p>
                  <div
                    className="servers-card-grid servers-unclaimed-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {unclaimedServers.map((s) => {
                      const MAX_PER_CAT = 2;
                      const tagStyle = { padding: "4px 8px", borderRadius: 4, fontSize: 12 };
                      const general = [s.region && (REGIONS.find((r) => r.key === s.region)?.label || s.region), s.rp_type && (RP_TYPES.find((r) => r.key === s.rp_type)?.label || s.rp_type), s.economy_type && (ECONOMY_TYPES.find((e) => e.key === s.economy_type)?.label || s.economy_type)].filter(Boolean) as string[];
                      const criminal = [...(Array.isArray(s.criminal_types) ? s.criminal_types.map((k: string) => CRIMINAL_DEPTH.find((c) => c.key === k)?.label || k) : []), ...(s.criminal_other ? s.criminal_other.split(/[,;]/).map((p) => p.trim()).filter(Boolean) : [])];
                      const lookingFor = [...(Array.isArray(s.looking_for_types) ? s.looking_for_types.map((k: string) => LOOKING_FOR_POSITIONS.find((p) => p.key === k)?.label || k) : []), ...(s.looking_for_other ? s.looking_for_other.split(/[,;]/).map((p) => p.trim()).filter(Boolean) : [])];
                      const creators = Array.isArray(s.creator_keys) ? s.creator_keys.map((key) => creatorsList.find((c) => c.key === key)?.label || key) : [];
                      const badges = [s.no_pay_to_win && "No P2W", s.whitelisted && "Whitelisted"].filter(Boolean) as string[];
                      const renderSlice = (items: string[], take: number, extraStyle: Record<string, unknown>) => (
                        <>
                          {items.slice(0, take).map((item, i) => (
                            <span key={`${item}-${i}`} style={{ ...tagStyle, ...extraStyle }}>{item}</span>
                          ))}
                          {items.length > take && <span style={{ ...tagStyle, background: "rgba(75, 85, 99, 0.5)", color: "#9ca3af" }}>+{items.length - take}</span>}
                        </>
                      );
                      const hasAny = general.length + criminal.length + lookingFor.length + creators.length + badges.length > 0;
                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: 20,
                            background: s.banner_url ? `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.94) 100%), url(${s.banner_url}) center center / cover no-repeat` : "#0f1115",
                            border: "1px solid #1f2937",
                            borderRadius: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {(() => {
                            const parts = (s.server_name || "").split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
                            const nameOnly = parts[0] || s.server_name || "";
                            const detailsRest = parts.slice(1).join(" | ");
                            return (
                              <>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: detailsRest ? 8 : 12, color: "#e2e8f0", textShadow: "0 0 3px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>
                                  {nameOnly}
                                </h2>
                                {detailsRest && (
                                  <p style={{ fontSize: 14, opacity: 0.9, margin: 0, marginBottom: 12, lineHeight: 1.4 }}>
                                    {detailsRest}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {s.logo_url && (
                              <img
                                src={s.logo_url}
                                alt=""
                                style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "2px solid rgba(75, 85, 99, 0.6)" }}
                              />
                            )}
                            {(s.region || s.rp_type) && (
                              <div style={{ fontSize: 12, opacity: 0.8 }}>
                                {s.region && (REGIONS.find((r) => r.key === s.region)?.label || s.region)}
                                {s.region && s.rp_type && " • "}
                                {s.rp_type && (RP_TYPES.find((r) => r.key === s.rp_type)?.label || s.rp_type)}
                              </div>
                            )}
                          </div>
                          {s.description && (
                            <p style={{ fontSize: 14, opacity: 0.9, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {s.description}
                            </p>
                          )}
                          {hasAny && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {general.length > 0 && renderSlice(general, MAX_PER_CAT, { background: "#1f2937" })}
                              {criminal.length > 0 && renderSlice(criminal, MAX_PER_CAT, { background: "#1e3a5f" })}
                              {lookingFor.length > 0 && renderSlice(lookingFor.map((l) => `LF: ${l}`), MAX_PER_CAT, { background: "rgba(234, 179, 8, 0.2)", color: "#eab308" })}
                              {creators.length > 0 && renderSlice(creators, MAX_PER_CAT, { background: "rgba(99, 102, 241, 0.2)", color: "#818cf8" })}
                              {badges.length > 0 && badges.map((b) => <span key={b} style={{ ...tagStyle, background: b === "No P2W" ? "rgba(34, 197, 94, 0.2)" : "#1f2937", color: b === "No P2W" ? "#22c55e" : undefined }}>{b}</span>)}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => s.discord_url && setClaimServer(s)}
                              disabled={!s.discord_url}
                              style={{
                                padding: "10px 18px",
                                borderRadius: 8,
                                background: s.discord_url ? "rgba(88, 101, 242, 0.3)" : "#374151",
                                border: "1px solid " + (s.discord_url ? "#5865f2" : "#4b5563"),
                                color: s.discord_url ? "#a5b4fc" : "#6b7280",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: s.discord_url ? "pointer" : "not-allowed",
                              }}
                            >
                              {t("servers.claimThisCity")}
                            </button>
                            {(() => {
                              const cfxCode = (s.cfx_id || extractCfxId(s.connect_url || ""))?.toLowerCase();
                              const live = cfxCode ? liveCounts[cfxCode] : null;
                              if (live && (live.players >= 0 || live.max > 0)) {
                                return (
                                  <span style={{ fontSize: 14, padding: "2px 8px", borderRadius: 4, background: "rgba(34, 197, 94, 0.2)", color: "#22c55e", fontWeight: 600 }}>
                                    {live.players} / {live.max} online
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
