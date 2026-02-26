"use client";

import SiteHeader from "../components/SiteHeader";
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
