"use client";

import SiteHeader from "../components/SiteHeader";
import { useLanguage } from "../components/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <main
      className="home-root about-page"
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
          background: 'linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover',
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
        <SiteHeader />

        <section
          className="home-section-wrap about-section"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "48px 24px 64px",
          }}
        >
          <h1
            className="about-title"
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 0.5,
              marginBottom: 24,
            }}
          >
            {t("nav.about")}
          </h1>
          <div
            className="about-content-box"
            style={{
              fontSize: 24,
              lineHeight: 1.65,
              color: "#e5e7eb",
              backgroundColor: "rgba(16, 22, 43, 0.75)",
              backdropFilter: "blur(10px)",
              borderRadius: 12,
              border: "1px solid rgba(36, 48, 70, 0.6)",
              padding: "28px 32px",
              borderLeft: "4px solid rgba(168, 85, 247, 0.6)",
            }}
          >
            <p style={{ marginBottom: 20 }}>
              &ldquo;A lot of us have been there: you need a specific MLO for your org,
              your business, or your house. You search everywhere—<em>is there
              even something at this location?</em>—and usually end up grabbing
              whatever&apos;s easiest to find or whatever looks cheapest. But is
              it actually the right fit?
            </p>
            <p style={{ marginBottom: 20 }}>
              That&apos;s why <span className="hero-brand">MLOMesh</span> exists. I wanted one place where creators could
              actually put their work in front of the right people, and where
              players and city owners could browse and compare MLOs without
              guessing or digging through a dozen Discords and marketplaces.
            </p>
            <p style={{ marginBottom: 20 }}>
              So we built a map you can click around to see what MLOs exist where,
              plus a cities directory so you can browse FiveM servers, see who&apos;s
              featuring what, and find the right interiors for your city. Creator
              filtering, coordinates, and spotlight for builders who deserve more
              visibility.
            </p>
            <p style={{ marginBottom: 0 }}>
              Whether you&apos;re a creator putting your maps out there or someone
              hunting for the right interior, <span className="hero-brand">MLOMesh</span> is here to make that
              discovery a bit simpler.&rdquo;
            </p>
            <p style={{ marginTop: 28, marginBottom: 0, fontSize: 22, opacity: 0.95 }}>
              — Maldo
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
