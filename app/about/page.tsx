"use client";

import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();

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
            }}
          >
            <p style={{ marginBottom: 20 }}>
              A lot of us have been there: hunting for that one perfect MLO for
              your org, your business, or your house. You search and search—
              <em>I wonder if there is even an MLO in this location?</em>—and too
              often you end up picking whatever&apos;s easiest to find or
              whatever looks cheapest. But is it really the best fit?
            </p>
            <p style={{ marginBottom: 20 }}>
              That&apos;s why <span className="hero-brand">MLOMesh</span> exists. We wanted a single place where MLO
              creators can put their work in front of the right people—and where
              players and city owners can browse, filter, and compare MLOs
              without the usual guesswork.
            </p>
            <p style={{ marginBottom: 0 }}>
              Whether you&apos;re a creator sharing your maps or someone looking
              for the right one, <span className="hero-brand">MLOMesh</span> is built to make discovery simpler and
              choices clearer.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
