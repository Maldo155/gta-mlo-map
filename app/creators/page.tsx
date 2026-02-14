"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

type Mlo = {
  id: string;
  name: string;
  creator?: string;
  website_url?: string;
  image_url?: string;
  x?: number | null;
  y?: number | null;
};

type CreatorTile = {
  creator_key: string;
  banner_url?: string | null;
  fit_mode?: "cover" | "contain" | null;
  zoom?: number | null;
  position?: string | null;
  button_label?: string | null;
  button_url?: string | null;
  tile_border_glow?: boolean | null;
  tile_border_glow_color?: string | null;
};

export default function CreatorsPage() {
  const { t } = useLanguage();
  const [mlos, setMlos] = useState<Mlo[]>([]);
  const [search, setSearch] = useState("");
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [tileConfigs, setTileConfigs] = useState<Record<string, CreatorTile>>(
    {}
  );

  useEffect(() => {
    fetch("/api/mlo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setMlos(d.mlos || []);
        const ids = (d.mlos || []).map((mlo: Mlo) => mlo.id).filter(Boolean);
        if (ids.length === 0) return;
        fetch(`/api/mlo/views?ids=${encodeURIComponent(ids.join(","))}`)
          .then((res) => res.json())
          .then((json) => setViewCounts(json.views || {}))
          .catch(() => null);
      });
  }, []);

  useEffect(() => {
    function fetchTiles() {
      fetch("/api/creator-tiles", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          const map: Record<string, CreatorTile> = {};
          (json.tiles || []).forEach((tile: CreatorTile) => {
            if (!tile?.creator_key) return;
            map[String(tile.creator_key).toLowerCase()] = tile;
          });
          setTileConfigs(map);
        })
        .catch(() => null);
    }
    fetchTiles();
    const interval = setInterval(fetchTiles, 60_000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Mlo[]>();
    for (const mlo of mlos) {
      const key = (mlo.creator || "Unknown").trim() || "Unknown";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(mlo);
    }
    const entries = [...map.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    if (!search.trim()) return entries;
    const query = search.toLowerCase();
    return entries.filter(([creator]) =>
      creator.toLowerCase().includes(query)
    );
  }, [mlos, search]);

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
            <span className="header-pill">
              Discord
            </span>
            <LanguageSelect />
            
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
          <a href="/requests" className="header-link">
            {t("nav.requests")}
          </a>
          <a href="/submit" className="header-link">
            {t("nav.submit")}
          </a>
        </nav>
        </header>
        <div className="creators-page-content" style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1>{t("creators.title")}</h1>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          {t("creators.subtitle")}
        </p>
        <input
          placeholder={t("creators.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 320 }}
        />

        {grouped.length === 0 && (
          <div style={{ opacity: 0.7 }}>
            {mlos.length === 0
              ? t("creators.emptyMlos")
              : t("creators.empty")}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {grouped.map(([creator, list]) => {
            const tileConfig = tileConfigs[creator.trim().toLowerCase()];
            const zoom =
              tileConfig && Number.isFinite(Number(tileConfig.zoom))
                ? Math.min(Math.max(Number(tileConfig.zoom), 80), 140)
                : 100;
            const position = tileConfig?.position || "left center";
            const tileRowHeight = 52;
            const glowOn = Boolean(tileConfig?.tile_border_glow);
            const glowColor =
              glowOn && tileConfig?.tile_border_glow_color && /^#[0-9A-Fa-f]{3,8}$/.test(String(tileConfig.tile_border_glow_color))
                ? String(tileConfig.tile_border_glow_color)
                : "#c7ff4a";
            return (
              <details
                key={creator}
                style={{
                  border: glowOn ? `1px solid ${glowColor}` : "1px solid #1f2937",
                  borderRadius: 12,
                  padding: 0,
                  backgroundColor: "#0f1115",
                  boxShadow: glowOn
                    ? `0 0 12px ${glowColor}, 0 0 24px ${glowColor}40`
                    : undefined,
                }}
              >
                <summary
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: tileRowHeight,
                    cursor: "pointer",
                    listStyle: "none",
                    gap: 12,
                    padding: "14px",
                    backgroundImage: tileConfig?.banner_url
                      ? `url("${tileConfig.banner_url}")`
                      : undefined,
                    backgroundRepeat: tileConfig?.banner_url
                      ? "no-repeat"
                      : undefined,
                    backgroundPosition: tileConfig?.banner_url
                      ? position
                      : undefined,
                    backgroundSize: tileConfig?.banner_url
                      ? zoom === 100
                        ? "cover"
                        : `${zoom}% auto`
                      : undefined,
                    borderRadius: 12,
                  }}
                >
                  {!tileConfig?.banner_url ? (
                    <span style={{ fontWeight: 700 }}>{creator}</span>
                  ) : (
                    <span style={{ flex: 1 }} />
                  )}
                  {tileConfig?.button_label && tileConfig?.button_url && (
                    <a
                      href={tileConfig.button_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,200,160,0.7)",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 11,
                        background:
                          "linear-gradient(90deg, rgba(255,130,60,0.9), rgba(255,175,70,0.9))",
                        boxShadow:
                          "0 0 10px rgba(255,140,80,0.45), 0 0 0 1px rgba(255,200,160,0.4) inset",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tileConfig.button_label}
                    </a>
                  )}
                  <span style={{ opacity: 0.7, fontSize: 12 }}>
                    {t("creators.count", { count: list.length })}
                  </span>
                </summary>

              <div style={{ padding: 14 }}>
                <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                  {list.map((mlo) => (
                    <div
                      key={mlo.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 13,
                        padding: "6px 0",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{mlo.name}</div>
                        {mlo.website_url && (
                          <button
                            type="button"
                            onClick={() => {
                              fetch("/api/mlo/views", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ mlo_id: mlo.id }),
                              }).catch(() => null);
                              window.open(mlo.website_url, "_blank", "noopener,noreferrer");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#93c5fd",
                              padding: 0,
                              cursor: "pointer",
                            }}
                          >
                            {t("creators.creatorPage")}
                          </button>
                        )}
                      </div>
                      {mlo.x != null && mlo.y != null && (
                        <div style={{ textAlign: "right" }}>
                          <a
                            href={`/map?mloId=${encodeURIComponent(
                              mlo.id
                            )}&highlight=1&x=${encodeURIComponent(
                              mlo.x
                            )}&y=${encodeURIComponent(mlo.y)}`}
                            style={{ color: "#93c5fd", whiteSpace: "nowrap" }}
                          >
                            {t("creators.viewMap")}
                          </a>
                          <div
                            style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}
                          >
                            {t("views.label")}: {viewCounts[mlo.id] ?? 0}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </details>
            );
          })}
        </div>
        </div>
      </div>
    </main>
  );
}
