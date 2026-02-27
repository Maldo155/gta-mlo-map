"use client";

import SiteHeader from "../components/SiteHeader";
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
        <SiteHeader />
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
