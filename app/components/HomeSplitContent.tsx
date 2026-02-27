"use client";

import LivePlayerCount from "./LivePlayerCount";
import type { Server } from "../lib/serverTags";
import { getConnectUrl } from "../lib/cfxUtils";

type Mlo = {
  id: string;
  name: string;
  creator?: string;
  image_url?: string;
  x?: number | null;
  y?: number | null;
};

type CreatorSpotlight = {
  creator_key: string;
  logo_url: string | null;
  spotlight_logo_size: number;
  verified_creator?: boolean;
  partnership?: boolean;
  displayName: string;
  count: number;
};

type CreatorPartner = {
  creator_key: string;
  logo_url: string | null;
  spotlight_logo_size: number;
  displayName: string;
  count: number;
};

type Props = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  mlos: Mlo[];
  featuredMlos: Mlo[];
  conveyorMlos: Mlo[];
  servers: Server[];
  conveyorServers: Server[];
  displayedPartners: CreatorPartner[];
  partnerConveyorItems: CreatorPartner[];
  displayedSpotlight: CreatorSpotlight[];
  showPartnersSection: boolean;
  showPartnersConveyor: boolean;
  conveyorSpeedSec: number;
  /** "split" = both columns, "mloOnly" = left only, "citiesOnly" = right only */
  variant?: "split" | "mloOnly" | "citiesOnly";
};

export default function HomeSplitContent({
  t,
  mlos,
  featuredMlos,
  conveyorMlos,
  servers,
  conveyorServers,
  displayedPartners,
  partnerConveyorItems,
  displayedSpotlight,
  showPartnersSection,
  showPartnersConveyor,
  conveyorSpeedSec,
  variant = "split",
}: Props) {
  const maskStyle = {
    position: "relative" as const,
    width: "100%",
    overflow: "hidden" as const,
    maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
    maskSize: "100% 100%",
  };

  const showMlo = variant === "split" || variant === "mloOnly";
  const showCities = variant === "split" || variant === "citiesOnly";

  return (
    <div
      className="home-split-columns"
      style={{
        display: "grid",
        gridTemplateColumns: variant === "split" ? "1fr 1fr" : "1fr",
        width: "100%",
        minHeight: "60vh",
      }}
    >
      {showMlo && (
      <div
        className="home-mlo-column"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "16px 20px 24px",
          borderRight: "1px solid #243046",
          overflowY: "auto",
        }}
      >
        <a href="/map" style={{ textDecoration: "none", alignSelf: "center" }}>
          <div
            className="home-tile-card card"
            style={{
              border: "2px solid rgba(34,211,238,0.5)",
              borderRadius: 32,
              padding: 48,
              background: "rgba(16, 22, 43, 0.95)",
              width: 720,
              height: 420,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <div
              style={{
                height: 176,
                flexShrink: 0,
                borderRadius: 24,
                backgroundImage: "url(/maps/find-mlos-tile.png)",
                backgroundSize: "cover",
                backgroundPosition: "center center",
                marginBottom: 20,
                border: "1px solid rgba(34,211,238,0.3)",
                opacity: 0.88,
              }}
            />
            <div style={{ fontSize: 18, opacity: 0.75, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600, color: "#22d3ee" }}>{t("home.tiles.map.title")}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1.3, letterSpacing: "-0.02em", color: "#67e8f9" }}>{t("home.tiles.map.subtitle")} ({mlos.length})</div>
            <div style={{ marginTop: 8, color: "#7dd3fc", fontSize: 16, lineHeight: 1.5 }}>{t("home.tiles.map.desc")}</div>
          </div>
        </a>

        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.4, color: "#22d3ee" }}>{t("home.fresh.label")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }} className="home-fresh-grid">
          {featuredMlos.length === 0 && (
            <div style={{ opacity: 0.7, fontSize: 13, gridColumn: "1 / -1" }}>{t("home.fresh.empty")}</div>
          )}
          {featuredMlos.map((mlo) => (
            <div
              key={mlo.id}
              style={{
                border: "1px solid rgba(34,211,238,0.35)",
                borderRadius: 12,
                padding: 12,
                background: "#10162b",
                minHeight: 120,
              }}
              className="card"
            >
              <img
                src={mlo.image_url || "/maps/gta-5-map-atlas-hd.jpg"}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid rgba(34,211,238,0.25)",
                  display: "block",
                }}
              />
              <div style={{ fontSize: 11, opacity: 0.7, color: "#22d3ee" }}>{t("home.mlo.label")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{mlo.name || t("home.mlo.untitled")}</div>
              <div style={{ marginTop: 4, color: "#7dd3fc", fontSize: 12 }}>{mlo.creator || t("home.mlo.unknownCreator")}</div>
              <div style={{ marginTop: 6 }}>
                <a
                  href={`/map?mloId=${encodeURIComponent(mlo.id)}&highlight=1${mlo.x != null && mlo.y != null ? `&x=${mlo.x}&y=${mlo.y}` : ""}`}
                  style={{ color: "#22d3ee", fontSize: 11 }}
                >
                  {t("home.mlo.viewMap")}
                </a>
              </div>
            </div>
          ))}
        </div>

        {showPartnersSection && (
          <>
            <div
              style={{
                border: "1px solid #243046",
                borderRadius: 14,
                padding: "12px 16px",
                background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.05))",
                boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 16, letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ color: "#fde68a" }}>★</span>
                <span
                  style={{
                    color: "#a855f7",
                    fontWeight: 900,
                    textShadow: "0 0 16px rgba(168, 85, 247, 0.75), 0 0 34px rgba(56, 189, 248, 0.5)",
                  }}
                >
                  {t("home.partners.label")}
                </span>
                <span style={{ color: "#fde68a" }}>★</span>
              </div>
            </div>
            <div
              style={{
                border: "1px solid #243046",
                borderRadius: 14,
                padding: 16,
                background: "#0d1324",
              }}
            >
              {displayedPartners.length > 0 ? (
                showPartnersConveyor ? (
                  <div style={maskStyle}>
                    <div
                      className="partner-conveyor-track"
                      style={{
                        display: "flex",
                        gap: 12,
                        animation: `partnerConveyorScroll ${conveyorSpeedSec}s linear infinite`,
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
                            width: 220,
                            border: "1px solid #243046",
                            borderRadius: 14,
                            overflow: "hidden",
                            backgroundColor: "#0f1528",
                            textDecoration: "none",
                            color: "inherit",
                            padding: 20,
                            display: "block",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 100 }}>
                            {creator.logo_url ? (
                              <img src={creator.logo_url} alt="" loading="lazy" style={{ maxWidth: `${creator.spotlight_logo_size}%`, maxHeight: 72, objectFit: "contain" }} />
                            ) : (
                              <span style={{ fontWeight: 700, fontSize: 16 }}>{creator.displayName}</span>
                            )}
                          </div>
                          <div style={{ textAlign: "center", fontSize: 12, opacity: 0.9, marginTop: 6, fontWeight: 600 }}>
                            {t("home.partners.count", { count: creator.count })}
                          </div>
                        </a>
                      ))}
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
                          border: "1px solid #243046",
                          borderRadius: 10,
                          overflow: "hidden",
                          minHeight: 64,
                          backgroundColor: "#0f1528",
                          textDecoration: "none",
                          color: "inherit",
                          padding: 10,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 44 }}>
                          {creator.logo_url ? (
                            <img src={creator.logo_url} alt="" loading="lazy" style={{ maxWidth: `${creator.spotlight_logo_size}%`, maxHeight: 36, objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{creator.displayName}</span>
                          )}
                        </div>
                        <div style={{ textAlign: "center", fontSize: 10, opacity: 0.85 }}>{t("home.partners.count", { count: creator.count })}</div>
                      </a>
                    ))}
                  </div>
                )
              ) : (
                <div style={{ opacity: 0.7, fontSize: 12 }}>{t("home.partners.empty")}</div>
              )}
            </div>
          </>
        )}

        <div style={{ border: "2px solid rgba(199,255,74,0.6)", borderRadius: 14, padding: "12px 16px", background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(111,95,231,0.14))" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{t("home.spotlight.label")}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{t("home.spotlight.title")}</div>
        </div>
        <div style={{ border: "2px solid rgba(199,255,74,0.4)", borderRadius: 14, padding: 16, background: "#0d1324" }}>
          {displayedSpotlight.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {displayedSpotlight.map((creator) => (
                <a
                  key={creator.creator_key}
                  href="/creators"
                  style={{
                    display: "block",
                    border: "1px solid rgba(199,255,74,0.35)",
                    borderRadius: 12,
                    overflow: "hidden",
                    minHeight: 72,
                    backgroundColor: "#0f1528",
                    textDecoration: "none",
                    color: "inherit",
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 52 }}>
                    {creator.logo_url ? (
                      <img src={creator.logo_url} alt="" loading="lazy" style={{ maxWidth: `${creator.spotlight_logo_size}%`, maxHeight: 48, objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{creator.displayName}</span>
                    )}
                  </div>
                  <div style={{ textAlign: "center", fontSize: 11, opacity: 0.9, marginTop: 6, fontWeight: 600 }}>{t("home.spotlight.count", { count: creator.count })}</div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.7, fontSize: 12 }}>{t("home.spotlight.empty")}</div>
          )}
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#22d3ee" }}>{t("home.conveyor.title")}</div>
        {mlos.length > 0 ? (
          <div style={maskStyle}>
            <div
              className="mlo-conveyor-track"
              style={{
                display: "flex",
                gap: 8,
                animation: `mloConveyorScroll ${conveyorSpeedSec}s linear infinite`,
                width: "max-content",
              }}
            >
              {[...conveyorMlos, ...conveyorMlos].map((mlo, idx) => (
                <a
                  key={`${mlo.id}-${idx}`}
                  href={`/map?mloId=${encodeURIComponent(mlo.id)}&highlight=1${mlo.x != null && mlo.y != null ? `&x=${mlo.x}&y=${mlo.y}` : ""}`}
                  className="mlo-conveyor-card card"
                  style={{
                    flexShrink: 0,
                    width: 180,
                    border: "1px solid rgba(34,211,238,0.35)",
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
                    style={{ width: "100%", height: 90, objectFit: "cover", borderBottom: "1px solid rgba(34,211,238,0.25)", display: "block" }}
                  />
                  <div style={{ padding: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{mlo.name || t("home.mlo.untitled")}</div>
                    <div style={{ fontSize: 10, color: "#7dd3fc" }}>{mlo.creator || t("home.mlo.unknownCreator")}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.7, fontSize: 12 }}>{t("home.fresh.empty")}</div>
        )}
      </div>
      )}

      {showCities && (
      <div
        className="home-servers-column"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "16px 20px 24px",
          overflowY: "auto",
        }}
      >
        <a href="/servers" style={{ textDecoration: "none", alignSelf: "center" }}>
          <div
            className="home-tile-card card"
            style={{
              border: "2px solid rgba(255,111,0,0.5)",
              borderRadius: 32,
              padding: 48,
              background: "rgba(16, 22, 43, 0.95)",
              width: 720,
              height: 420,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <div
              style={{
                height: 176,
                flexShrink: 0,
                borderRadius: 24,
                backgroundImage: "url(/maps/find-servers-tile.png)",
                backgroundSize: "cover",
                backgroundPosition: "center center",
                marginBottom: 20,
                border: "1px solid rgba(255,111,0,0.3)",
                opacity: 0.88,
              }}
            />
            <div style={{ fontSize: 18, opacity: 0.75, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600, color: "#ff8c42" }}>{t("home.tiles.servers.title")}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1.3, letterSpacing: "-0.02em", color: "#ff9f5c" }}>{t("home.tiles.servers.subtitle")} ({servers.length})</div>
            <div style={{ marginTop: 8, color: "#c4a574", fontSize: 16, lineHeight: 1.5 }}>{t("home.tiles.servers.desc")}</div>
          </div>
        </a>

        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.4, color: "#ff8c42" }}>{t("home.tiles.servers.subtitle")}</div>
        {servers.length > 0 ? (
          <div style={maskStyle}>
            <div
              className="server-conveyor-track"
              style={{
                display: "flex",
                gap: 12,
                animation: `serverConveyorScroll ${conveyorSpeedSec}s linear infinite`,
                width: "max-content",
              }}
            >
              {[...conveyorServers, ...conveyorServers].map((s, idx) => (
                <div
                  key={`${s.id}-${idx}`}
                  className="server-conveyor-card card"
                  style={{
                    flexShrink: 0,
                    width: 240,
                    border: "1px solid rgba(255,111,0,0.35)",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#10162b",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <a href={`/servers/${s.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                    <div
                      style={{
                        height: 100,
                        background: s.banner_url ? `url(${s.banner_url}) center/cover no-repeat` : "#1a1f26",
                        borderBottom: "1px solid rgba(255,111,0,0.25)",
                      }}
                    />
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{s.server_name}</div>
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
                  <div style={{ padding: "0 10px 10px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {getConnectUrl(s.connect_url, s.cfx_id) && (
                      <a
                        href={getConnectUrl(s.connect_url, s.cfx_id)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: "4px 10px", borderRadius: 8, background: "#FF6F00", color: "#fff", fontWeight: 600, textDecoration: "none", fontSize: 12 }}
                      >
                        {t("servers.join")}
                      </a>
                    )}
                    <a href={`/servers/${s.id}`} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,111,0,0.5)", color: "#ff9f5c", textDecoration: "none", fontSize: 12 }}>
                      {t("servers.viewDetails")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.7, fontSize: 12 }}>{t("servers.empty")}</div>
        )}
      </div>
      )}
    </div>
  );
}
