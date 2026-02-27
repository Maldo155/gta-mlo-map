"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import SiteHeader from "@/app/components/SiteHeader";
import { useLanguage } from "@/app/components/LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";
import {
  REGIONS,
  ECONOMY_TYPES,
  RP_TYPES,
  CRIMINAL_DEPTH,
  LOOKING_FOR_POSITIONS,
} from "@/app/lib/serverTags";
import GallerySortable from "@/app/components/GallerySortable";

type FormState = "idle" | "sending" | "sent" | "error";

export default function SubmitServerPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [serverName, setServerName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [region, setRegion] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [economyType, setEconomyType] = useState("");
  const [rpType, setRpType] = useState("");
  const [whitelisted, setWhitelisted] = useState(false);
  const [pdActive, setPdActive] = useState(true);
  const [emsActive, setEmsActive] = useState(true);
  const [criminalTypes, setCriminalTypes] = useState<string[]>([]);
  const [criminalOther, setCriminalOther] = useState("");
  const [lookingForTypes, setLookingForTypes] = useState<string[]>([]);
  const [lookingForOther, setLookingForOther] = useState("");
  const [creatorKeys, setCreatorKeys] = useState<string[]>([]);
  const [authorizedEditors, setAuthorizedEditors] = useState("");
  const [cfxId, setCfxId] = useState("");
  const [creatorsList, setCreatorsList] = useState<{ key: string; label: string; logo_url?: string | null }[]>([]);
  const [civJobsCount, setCivJobsCount] = useState("");
  const [customMloCount, setCustomMloCount] = useState("");
  const [customScriptCount, setCustomScriptCount] = useState("");
  const [noPayToWin, setNoPayToWin] = useState(false);
  const [controllerFriendly, setControllerFriendly] = useState(false);
  const [newPlayerFriendly, setNewPlayerFriendly] = useState(true);
  const [featuresOther, setFeaturesOther] = useState("");
  const [avgPlayers, setAvgPlayers] = useState("");
  const [maxSlots, setMaxSlots] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDropActive, setGalleryDropActive] = useState(false);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setAuthLoading(false));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_e, next) => setSession(next)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/creators/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCreatorsList(d.creators || []))
      .catch(() => setCreatorsList([]));
  }, []);

  async function uploadImage(
    file: File,
    type: "banner" | "logo" | "gallery",
    opts: { silent?: boolean } = {}
  ): Promise<string | null> {
    if (!session?.access_token) return null;
    const setUploading = type === "gallery" ? setGalleryUploading : type === "banner" ? setBannerUploading : setLogoUploading;
    if (!opts?.silent) setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const res = await fetch("/api/servers/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (json.publicUrl) {
        if (type === "banner") setBannerUrl(json.publicUrl);
        else if (type === "logo") setLogoUrl(json.publicUrl);
        else setGalleryImages((prev) => [...prev, json.publicUrl].slice(0, 10));
        return json.publicUrl;
      }
      setErrorMessage(json.error || "Upload failed.");
      return null;
    } catch {
      setErrorMessage("Upload failed. Please try again.");
      return null;
    } finally {
      if (!opts?.silent) setUploading(false);
    }
  }

  const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  async function handleGalleryDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDropActive(false);
    if (galleryUploading || galleryImages.length >= 10) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => IMAGE_TYPES.includes(f.type));
    if (files.length === 0) return;
    const toUpload = files.slice(0, 10 - galleryImages.length);
    setGalleryUploading(true);
    for (const file of toUpload) {
      await uploadImage(file, "gallery", { silent: true });
    }
    setGalleryUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serverName.trim() || !discordUrl.trim() || !description.trim()) {
      setErrorMessage("Server name, Discord URL, and description are required.");
      setState("error");
      return;
    }
    setState("sending");
    setErrorMessage("");

    const body: Record<string, unknown> = {
      server_name: serverName.trim(),
      owner_name: ownerName.trim() || null,
      region: region || null,
      connect_url: createUrl.trim() || null,
      discord_url: discordUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      description: description.trim() || null,
      economy_type: economyType || null,
      rp_type: rpType || null,
      whitelisted,
      pd_active: pdActive,
      ems_active: emsActive,
      criminal_types: criminalTypes.length > 0 ? criminalTypes : null,
      criminal_other: criminalOther.trim() || null,
      looking_for_types: lookingForTypes.length > 0 ? lookingForTypes : null,
      looking_for_other: lookingForOther.trim() || null,
      creator_keys: creatorKeys.length > 0 ? creatorKeys : null,
      authorized_editors: authorizedEditors.trim()
        ? authorizedEditors.split(/[,;\n]+/).map((u) => u.trim()).filter(Boolean)
        : null,
      cfx_id: cfxId.trim() || null,
      civ_jobs_count: civJobsCount ? parseInt(civJobsCount, 10) : null,
      custom_mlo_count: customMloCount ? parseInt(customMloCount, 10) : null,
      custom_script_count: customScriptCount ? parseInt(customScriptCount, 10) : null,
      no_pay_to_win: noPayToWin,
      controller_friendly: controllerFriendly,
      new_player_friendly: newPlayerFriendly,
      features_other: featuresOther.trim() || null,
      avg_player_count: avgPlayers ? parseInt(avgPlayers, 10) : null,
      max_slots: maxSlots ? parseInt(maxSlots, 10) : null,
      banner_url: bannerUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      gallery_images: galleryImages.length > 0 ? galleryImages.slice(0, 10) : null,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/servers", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      setState("sent");
      setTimeout(() => router.push(`/servers/${json.id}`), 1500);
      return;
    }
    setErrorMessage(json.error || "Something went wrong. Please try again.");
    setState("error");
  }

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 8,
    border: "1px solid #3d4a5c",
    background: "#1a1f26",
    color: "#f1f5f9",
    width: "100%",
    maxWidth: 400,
    fontSize: 15,
  };

  const labelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#e2e8f0" };

  const sectionBoxStyle = {
    padding: 18,
    background: "#14181f",
    borderRadius: 10,
    border: "1px solid rgba(55, 65, 81, 0.5)",
  };

  if (authLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          background: "#0f1115",
        }}
      >
        <p>Loading…</p>
      </main>
    );
  }

  if (!session) {
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
          <section
            style={{
              maxWidth: 420,
              margin: "0 auto",
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              Sign in to add a server
            </h1>
            <p style={{ opacity: 0.85, marginBottom: 24, lineHeight: 1.5 }}>
              You need to sign in with Discord to list your FiveM server.
            </p>
            <a
              href="/auth/start?next=%2Fservers%2Fsubmit"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                borderRadius: 10,
                background: "#5865f2",
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Sign in with Discord
            </a>
          </section>
        </div>
      </main>
    );
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
          background: "linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url(\"/api/home-bg\") no-repeat center top / cover",
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

        <div
          className="servers-submit-form"
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "32px 24px 64px",
          }}
        >
          <div
            style={{
              background: "rgba(15, 17, 22, 0.96)",
              borderRadius: 16,
              padding: "32px 28px 48px",
              border: "1px solid rgba(45, 55, 72, 0.8)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <a
              href="/servers"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              {t("servers.backToCities")}
            </a>
            <button
              type="button"
              onClick={() =>
                getSupabaseBrowser().auth.signOut().then(() => router.push("/servers"))
              }
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "transparent",
                border: "1px solid #4b5563",
                color: "#9ca3af",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            Add your FiveM Server
          </h1>
          <p style={{ opacity: 0.9, marginBottom: 8, lineHeight: 1.5, fontSize: 15 }}>
            Only <strong>server name</strong>, <strong>Discord URL</strong>, and <strong>description</strong> are required. Everything else helps players find you.
          </p>
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 28 }}>* Required fields</p>

          {state === "sent" ? (
            <div
              style={{
                padding: 24,
                background: "rgba(34, 197, 94, 0.2)",
                borderRadius: 12,
                color: "#22c55e",
              }}
            >
              Server submitted! Redirecting...
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Server name *</label>
                <input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Awesome RP"
                  required
                  style={inputStyle}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Connect URL</label>
                  <input
                    value={createUrl}
                    onChange={(e) => setCreateUrl(e.target.value)}
                    placeholder="cfx.re/join/xxxxx or servers.fivem.net/.../detail/xxxxx"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Cfx.re code <span style={{ fontWeight: 400, opacity: 0.7 }}>(for live player count)</span></label>
                  <input
                    value={cfxId}
                    onChange={(e) => setCfxId(e.target.value)}
                    placeholder="Auto-detected from cfx.re URLs above"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Owner name</label>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your name or team"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Discord URL *</label>
                  <input
                    type="url"
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
                    placeholder="https://discord.gg/..."
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Banner</label>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <label
                    style={{
                      ...inputStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: bannerUploading ? "not-allowed" : "pointer",
                      opacity: bannerUploading ? 0.7 : 1,
                      width: "auto",
                      maxWidth: "none",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      disabled={bannerUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f, "banner");
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                    {bannerUploading ? "Uploading…" : "Upload image"}
                  </label>
                  {bannerUrl && (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151" }}>
                      <img src={bannerUrl} alt="Banner preview" style={{ maxWidth: 200, maxHeight: 90, objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Wide image for your server tile. Supports animated GIFs. Max 5MB.
                </span>
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Video (optional)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or direct video URL"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    YouTube link or direct video URL. Shown in server preview.
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Gallery images (optional, max 10)</label>
                  <span style={{ fontSize: 12, opacity: 0.7 }}> Click + or drag and drop images. Drag the ⋮⋮ handle to reorder.</span>
                  <GallerySortable
                    items={galleryImages}
                    onReorder={setGalleryImages}
                    onRemove={(i) => setGalleryImages((p) => p.filter((_, j) => j !== i))}
                    dropActive={galleryDropActive}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!galleryUploading && galleryImages.length < 10) setGalleryDropActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setGalleryDropActive(false); }}
                    onDrop={handleGalleryDrop}
                    renderAddButton={galleryImages.length < 10 && (
                      <label
                        style={{
                          width: 80,
                          height: 60,
                          borderRadius: 8,
                          border: "2px dashed #4b5563",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: galleryUploading ? "not-allowed" : "pointer",
                          opacity: galleryUploading ? 0.7 : 1,
                          background: "rgba(31, 41, 55, 0.5)",
                          fontSize: 24,
                          color: "#9ca3af",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          disabled={galleryUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f, "gallery");
                            e.target.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                        {galleryUploading ? "…" : "+"}
                      </label>
                    )}
                  />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Logo</label>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <label
                      style={{
                        ...inputStyle,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: logoUploading ? "not-allowed" : "pointer",
                        opacity: logoUploading ? 0.7 : 1,
                        width: "auto",
                        maxWidth: "none",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        disabled={logoUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadImage(f, "logo");
                          e.target.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                      {logoUploading ? "Uploading…" : "Upload image"}
                    </label>
                    {logoUrl && (
                      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151" }}>
                        <img src={logoUrl} alt="Logo preview" style={{ width: 64, height: 64, objectFit: "cover", display: "block" }} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    Square icon/logo for your server. Supports animated GIFs. Max 5MB.
                  </span>
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell players what makes your server unique..."
                  rows={4}
                  required
                  style={{ ...inputStyle, maxWidth: "100%" }}
                />
              </div>
              <div className="servers-form-row" style={{ ...sectionBoxStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Any</option>
                    {REGIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>RP Type</label>
                  <select
                    value={rpType}
                    onChange={(e) => setRpType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Any</option>
                    {RP_TYPES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Economy</label>
                  <select
                    value={economyType}
                    onChange={(e) => setEconomyType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Any</option>
                    {ECONOMY_TYPES.map((e) => (
                      <option key={e.key} value={e.key}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Criminal content</label>
                <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
                  What crime RP does your server focus on?
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    padding: "12px 0",
                  }}
                >
                  {CRIMINAL_DEPTH.map((c) => (
                    <label
                      key={c.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={criminalTypes.includes(c.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCriminalTypes((prev) => [...prev, c.key]);
                          } else {
                            setCriminalTypes((prev) => prev.filter((k) => k !== c.key));
                          }
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={criminalOther}
                  onChange={(e) => setCriminalOther(e.target.value)}
                  placeholder="Other (e.g. smuggling, black market)"
                  style={{
                    ...inputStyle,
                    marginTop: 8,
                  }}
                />
                <span style={{ fontSize: 12, opacity: 0.75, marginTop: 4, display: "block" }}>
                  Pick all that apply, or add your own
                </span>
              </div>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Looking for</label>
                <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
                  Roles you&apos;re actively recruiting
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    padding: "12px 0",
                  }}
                >
                  {LOOKING_FOR_POSITIONS.map((p) => (
                    <label
                      key={p.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={lookingForTypes.includes(p.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLookingForTypes((prev) => [...prev, p.key]);
                          } else {
                            setLookingForTypes((prev) => prev.filter((k) => k !== p.key));
                          }
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={lookingForOther}
                  onChange={(e) => setLookingForOther(e.target.value)}
                  placeholder="Other (e.g. tow truck, taxi, trucking)"
                  style={{
                    ...inputStyle,
                    marginTop: 8,
                  }}
                />
                <span style={{ fontSize: 12, opacity: 0.75, marginTop: 4, display: "block" }}>
                  Pick all that apply, or add your own
                </span>
              </div>
              <div style={sectionBoxStyle}>
                <label style={labelStyle}>Who&apos;s MLOs are you using?</label>
                <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
                  Credit the builders
                </p>
                {creatorsList.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {creatorsList.map((c) => (
                      <label
                        key={c.key}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: creatorKeys.includes(c.key) ? "rgba(34, 197, 94, 0.15)" : "rgba(31, 41, 55, 0.6)",
                          border: `1px solid ${creatorKeys.includes(c.key) ? "rgba(34, 197, 94, 0.4)" : "rgba(55, 65, 81, 0.5)"}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={creatorKeys.includes(c.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreatorKeys((prev) => [...prev, c.key]);
                            } else {
                              setCreatorKeys((prev) => prev.filter((k) => k !== c.key));
                            }
                          }}
                          style={{ width: 16, height: 16, flexShrink: 0 }}
                        />
                        {c.logo_url && (
                          <img
                            src={c.logo_url}
                            alt=""
                            style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }}
                          />
                        )}
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 13, opacity: 0.7 }}>No creators listed yet. Check back later.</span>
                )}
                {creatorsList.length > 0 && (
                  <a
                    href="/creators"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#60a5fa", marginTop: 8, display: "inline-block" }}
                  >
                    Browse all creators →
                  </a>
                )}
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Additional editors (Discord usernames)</label>
                  <input
                    value={authorizedEditors}
                    onChange={(e) => setAuthorizedEditors(e.target.value)}
                    placeholder="johndoe, server_admin, coowner (comma-separated)"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 12, opacity: 0.7 }}>People who can also edit this server listing.</span>
                </div>
              </div>
              <div style={{ ...sectionBoxStyle, display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Server stats</label>
                <div className="servers-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Avg players</label>
                    <input
                      type="number"
                      min={0}
                      value={avgPlayers}
                      onChange={(e) => setAvgPlayers(e.target.value)}
                      placeholder="32"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Max slots</label>
                    <input
                      type="number"
                      min={0}
                      value={maxSlots}
                      onChange={(e) => setMaxSlots(e.target.value)}
                      placeholder="64"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="servers-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Custom MLO count</label>
                    <input
                      type="number"
                      min={0}
                      value={customMloCount}
                      onChange={(e) => setCustomMloCount(e.target.value)}
                      placeholder="50"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Custom script count</label>
                    <input
                      type="number"
                      min={0}
                      value={customScriptCount}
                      onChange={(e) => setCustomScriptCount(e.target.value)}
                      placeholder="100"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Civ jobs count</label>
                  <input
                    type="number"
                    min={0}
                    value={civJobsCount}
                    onChange={(e) => setCivJobsCount(e.target.value)}
                    placeholder="15"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Server features</label>
                <div
                  className="servers-features-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                    ...sectionBoxStyle,
                  }}
                >
                  {[
                    { checked: whitelisted, set: setWhitelisted, label: "Whitelisted" },
                    { checked: noPayToWin, set: setNoPayToWin, label: "No Pay-to-Win" },
                    { checked: pdActive, set: setPdActive, label: "PD active" },
                    { checked: emsActive, set: setEmsActive, label: "EMS active" },
                    { checked: controllerFriendly, set: setControllerFriendly, label: "Controller friendly" },
                    { checked: newPlayerFriendly, set: setNewPlayerFriendly, label: "New player friendly" },
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
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => set(e.target.checked)}
                        style={{ width: 18, height: 18, flexShrink: 0 }}
                      />
                      {label}
                    </label>
                    ))}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <input
                      type="text"
                      value={featuresOther}
                      onChange={(e) => setFeaturesOther(e.target.value)}
                      placeholder="Other features (e.g., Gang RP, Heists, etc.)"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
              {errorMessage && (
                <div
                  style={{
                    padding: 12,
                    background: "rgba(239, 68, 68, 0.2)",
                    borderRadius: 8,
                    color: "#ef4444",
                  }}
                >
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={state === "sending"}
                style={{
                  padding: "14px 24px",
                  borderRadius: 10,
                  background: "#22c55e",
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: state === "sending" ? "not-allowed" : "pointer",
                  opacity: state === "sending" ? 0.7 : 1,
                }}
              >
                {state === "sending" ? "Submitting..." : "Submit Server"}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
