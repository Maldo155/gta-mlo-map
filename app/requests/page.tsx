"use client";

import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

export default function RequestsPage() {
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
        <div className="requests-page-wrap" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <h1>{t("requests.title")}</h1>
        <p style={{ opacity: 0.7 }}>
          {t("requests.subtitle")}
        </p>
        <a href="/submit">
          <button className="cta-submit">{t("requests.submit")}</button>
        </a>
        </div>
      </div>
    </main>
  );
}
