"use client";

import { useEffect, useMemo, useState } from "react";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

type Mlo = {
  id: string;
  creator?: string;
};

type CreatorTile = {
  creator_key: string;
  banner_url?: string | null;
  logo_url?: string | null;
  spotlight_logo_size?: number | null;
  updated_at?: string | null;
};

const MAX_EARLY_SUPPORTERS = 10;

export default function AppreciationPage() {
  const { t } = useLanguage();
  const [creatorTiles, setCreatorTiles] = useState<CreatorTile[]>([]);
  const [mlos, setMlos] = useState<Mlo[]>([]);

  useEffect(() => {
    function fetchTiles() {
      fetch("/api/creator-tiles", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => setCreatorTiles(json.tiles || []))
        .catch(() => setCreatorTiles([]));
    }
    function fetchMlos() {
      fetch("/api/mlo", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setMlos(d.mlos || []));
    }
    fetchTiles();
    fetchMlos();
    const interval = setInterval(() => {
      fetchTiles();
      fetchMlos();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const earlySupporters = useMemo(() => {
    const withCustomTiles = (creatorTiles || []).filter(
      (t) => t.creator_key && (t.logo_url || t.banner_url)
    );
    const byKey: Record<string, number> = {};
    const displayNameByKey: Record<string, string> = {};
    for (const mlo of mlos) {
      const key = (mlo.creator || "").trim().toLowerCase();
      if (!key) continue;
      byKey[key] = (byKey[key] || 0) + 1;
      if (!(key in displayNameByKey)) displayNameByKey[key] = (mlo.creator || "").trim();
    }
    return withCustomTiles
      .sort((a, b) => {
        const aAt = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bAt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return aAt - bAt;
      })
      .slice(0, MAX_EARLY_SUPPORTERS)
      .map((t) => {
        const tileKey = (t.creator_key || "").trim().toLowerCase();
        const tileKeySpaces = tileKey.replace(/-/g, " ");
        const displayName = displayNameByKey[tileKey] || displayNameByKey[tileKeySpaces] || t.creator_key;
        const count = byKey[tileKey] ?? byKey[tileKeySpaces] ?? 0;
        const size =
          t.spotlight_logo_size != null && Number.isFinite(Number(t.spotlight_logo_size))
            ? Math.min(100, Math.max(15, Number(t.spotlight_logo_size)))
            : 60;
        return {
          creator_key: t.creator_key,
          logo_url: t.logo_url || null,
          banner_url: t.banner_url || null,
          spotlight_logo_size: size,
          displayName,
          count,
        };
      });
  }, [creatorTiles, mlos]);

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
          background: '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
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
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="header-top">
            <div className="header-brand" />
            <div className="header-actions">
              <DiscordLink />
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
            padding: "48px 24px 64px",
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Early supporters
          </h1>
          <p
            style={{
              fontSize: 16,
              opacity: 0.85,
              marginBottom: 32,
              maxWidth: 560,
            }}
          >
            A big thank you to the first creators who set up custom tiles and helped bring MLOMesh to life. 
            This list grows as more creators join—up to the first 10.
          </p>

          {earlySupporters.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {earlySupporters.map((creator, idx) => (
                <a
                  key={creator.creator_key}
                  href="/creators"
                  style={{
                    display: "block",
                    border: "1px solid #243046",
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: "rgba(16, 22, 43, 0.9)",
                    textDecoration: "none",
                    color: "inherit",
                    padding: 16,
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#c7ff4a";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(199, 255, 74, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#243046";
                    e.currentTarget.style.boxShadow = "none";
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
                        src={creator.logo_url}
                        alt=""
                        style={{
                          maxWidth: `${creator.spotlight_logo_size}%`,
                          maxHeight: 56,
                          width: "auto",
                          height: "auto",
                          objectFit: "contain",
                          flexShrink: 0,
                        }}
                      />
                    ) : creator.banner_url ? (
                      <div
                        style={{
                          width: "100%",
                          height: 48,
                          backgroundImage: `url("${creator.banner_url}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {creator.displayName}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: 14,
                      marginTop: 8,
                    }}
                  >
                    {creator.displayName}
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      opacity: 0.75,
                      marginTop: 4,
                    }}
                  >
                    {creator.count} {creator.count === 1 ? "MLO" : "MLOs"}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      marginTop: 6,
                    }}
                  >
                    #{idx + 1}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                opacity: 0.7,
                border: "1px dashed #243046",
                borderRadius: 12,
              }}
            >
              No custom tiles yet. As creators add them, they&apos;ll appear here (up to 10). 
              Updates automatically.
            </div>
          )}

          <p
            style={{
              fontSize: 13,
              opacity: 0.6,
              marginTop: 24,
            }}
          >
            Updates every 60 seconds. Order by when the custom tile was first added.
          </p>
        </section>
      </div>
    </main>
  );
}
