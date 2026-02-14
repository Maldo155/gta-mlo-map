"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

type FormState = "idle" | "sending" | "sent" | "error";

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [creator, setCreator] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tag, setTag] = useState("");
  const [notes, setNotes] = useState("");
  const [hp, setHp] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<{ a: number; b: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const startRef = useRef<number>(Date.now());

  function resetCaptcha() {
    startRef.current = Date.now();
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    setCaptcha({ a, b });
  }

  useEffect(() => {
    resetCaptcha();
  }, []);

  async function submit() {
    if (!name || !creator || !x || !y) return;
    if (!captcha) return;
    setState("sending");
    setErrorMessage("");

    const form = new FormData();
    form.append("name", name);
    form.append("creator", creator);
    form.append("websiteUrl", websiteUrl);
    form.append("category", category);
    form.append("x", x);
    form.append("y", y);
    form.append("imageUrl", imageUrl);
    form.append("tag", tag);
    form.append("notes", notes);
    form.append("hp", hp);
    form.append("elapsedMs", String(Date.now() - startRef.current));
    form.append("captchaA", String(captcha.a));
    form.append("captchaB", String(captcha.b));
    form.append("captchaAnswer", captchaAnswer);
    if (imageFile) {
      form.append("imageFile", imageFile);
    }

    const res = await fetch("/api/submit", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      setState("sent");
      setName("");
      setCreator("");
      setWebsiteUrl("");
      setCategory(CATEGORIES[0].key);
      setX("");
      setY("");
      setImageUrl("");
      setImageFile(null);
      setTag("");
      setNotes("");
      setHp("");
      setCaptchaAnswer("");
      setErrorMessage("");
      resetCaptcha();
      return;
    }

    const text = await res.text();
    setErrorMessage(text || "Something went wrong. Please try again.");
    setState("error");
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

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

        <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
          <button onClick={handleBack} style={{ marginBottom: 12 }}>
            ← {t("submit.back")}
          </button>
          <h1>{t("submit.title")}</h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>
            {t("submit.subtitle")}
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              placeholder={t("submit.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder={t("submit.creator")}
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
            />
            <input
              placeholder={t("submit.website")}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {t(`categories.${c.key}`)}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder={t("submit.x")}
                value={x}
                onChange={(e) => setX(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                placeholder={t("submit.y")}
                value={y}
                onChange={(e) => setY(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <input
              placeholder={t("submit.imageUrl")}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <input
              placeholder={t("submit.tag")}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <textarea
              placeholder={t("submit.notes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                {t("submit.captcha", {
                  equation: captcha ? `${captcha.a} + ${captcha.b}` : "...",
                })}
              </span>
              <input
                placeholder={t("submit.captchaAnswer")}
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                style={{ width: 100 }}
              />
            </div>
            <input
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              autoComplete="off"
              style={{ display: "none" }}
              tabIndex={-1}
            />
            <button onClick={submit} disabled={state === "sending"}>
              {state === "sending" ? t("submit.sending") : t("submit.submit")}
            </button>
            {state === "sent" && (
              <div style={{ color: "#22c55e" }}>
                {t("submit.success")}
                <div style={{ marginTop: 8 }}>
                  <button onClick={handleBack}>{t("submit.backToMap")}</button>
                </div>
              </div>
            )}
            {state === "error" && (
              <div style={{ color: "#ef4444" }}>{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
