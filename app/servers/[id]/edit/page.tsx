"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import type { Server } from "@/app/lib/serverTags";
import AuthLink from "@/app/components/AuthLink";
import DiscordLink from "@/app/components/DiscordLink";
import LanguageSelect from "@/app/components/LanguageSelect";
import { useLanguage } from "@/app/components/LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";
import {
  REGIONS,
  ECONOMY_TYPES,
  RP_TYPES,
  CRIMINAL_DEPTH,
  LOOKING_FOR_POSITIONS,
} from "@/app/lib/serverTags";

type FormState = "idle" | "sending" | "sent" | "error";
type PageState = "loading" | "forbidden" | "notfound" | "ready";

export default function EditServerPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
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
  const [cfxId, setCfxId] = useState("");
  const [creatorsList, setCreatorsList] = useState<{ key: string; label: string; logo_url?: string | null }[]>([]);
  const [civJobsCount, setCivJobsCount] = useState("");
  const [customMloCount, setCustomMloCount] = useState("");
  const [customScriptCount, setCustomScriptCount] = useState("");
  const [noPayToWin, setNoPayToWin] = useState(false);
  const [controllerFriendly, setControllerFriendly] = useState(false);
  const [newPlayerFriendly, setNewPlayerFriendly] = useState(true);
  const [avgPlayers, setAvgPlayers] = useState("");
  const [maxSlots, setMaxSlots] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange((_, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/creators/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCreatorsList(d.creators || []))
      .catch(() => setCreatorsList([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setPageState("notfound");
      return;
    }
    fetch(`/api/servers/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s = d.server as Server | null;
        if (!s) {
          setPageState("notfound");
          return;
        }
        setServer(s);
        setServerName(s.server_name || "");
        setOwnerName(s.owner_name || "");
        setRegion(s.region || "");
        setCreateUrl(s.connect_url || "");
        setDiscordUrl(s.discord_url || "");
        setWebsiteUrl(s.website_url || "");
        setDescription(s.description || "");
        setEconomyType(s.economy_type || "");
        setRpType(s.rp_type || "");
        setWhitelisted(s.whitelisted ?? false);
        setPdActive(s.pd_active !== false);
        setEmsActive(s.ems_active !== false);
        setCriminalTypes(Array.isArray(s.criminal_types) ? s.criminal_types : []);
        setCriminalOther(s.criminal_other || "");
        setLookingForTypes(Array.isArray(s.looking_for_types) ? s.looking_for_types : []);
        setLookingForOther(s.looking_for_other || "");
        setCreatorKeys(Array.isArray(s.creator_keys) ? s.creator_keys : []);
        setCfxId(s.cfx_id || "");
        setCivJobsCount(s.civ_jobs_count != null ? String(s.civ_jobs_count) : "");
        setCustomMloCount(s.custom_mlo_count != null ? String(s.custom_mlo_count) : "");
        setCustomScriptCount(s.custom_script_count != null ? String(s.custom_script_count) : "");
        setNoPayToWin(s.no_pay_to_win ?? false);
        setControllerFriendly(s.controller_friendly ?? false);
        setNewPlayerFriendly(s.new_player_friendly !== false);
        setAvgPlayers(s.avg_player_count != null ? String(s.avg_player_count) : "");
        setMaxSlots(s.max_slots != null ? String(s.max_slots) : "");
        setBannerUrl(s.banner_url || "");
        setLogoUrl(s.logo_url || "");
        setPageState("ready");
      })
      .catch(() => setPageState("notfound"));
  }, [id]);

  useEffect(() => {
    if (pageState !== "ready" || !server) return;
    if (!session) return; // still loading session
    if (server.user_id !== session.user.id) {
      setPageState("forbidden");
    }
  }, [pageState, session, server]);

  async function uploadImage(file: File, type: "banner" | "logo"): Promise<string | null> {
    if (!session?.access_token) return null;
    const setUploading = type === "banner" ? setBannerUploading : setLogoUploading;
    const setUrl = type === "banner" ? setBannerUrl : setLogoUrl;
    setUploading(true);
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
        setUrl(json.publicUrl);
        return json.publicUrl;
      }
      setErrorMessage(json.error || "Upload failed.");
      return null;
    } catch {
      setErrorMessage("Upload failed. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
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
      cfx_id: cfxId.trim() || null,
      civ_jobs_count: civJobsCount ? parseInt(civJobsCount, 10) : null,
      custom_mlo_count: customMloCount ? parseInt(customMloCount, 10) : null,
      custom_script_count: customScriptCount ? parseInt(customScriptCount, 10) : null,
      no_pay_to_win: noPayToWin,
      controller_friendly: controllerFriendly,
      new_player_friendly: newPlayerFriendly,
      avg_player_count: avgPlayers ? parseInt(avgPlayers, 10) : null,
      max_slots: maxSlots ? parseInt(maxSlots, 10) : null,
      banner_url: bannerUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
    };

    const res = await fetch(`/api/servers/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      setState("sent");
      setTimeout(() => router.push(`/servers/${id}`), 1000);
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

  function PageLayout({ children }: { children: React.ReactNode }) {
    return (
      <main className="home-root" style={{ minHeight: "100vh", color: "white", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(8, 10, 15, 0.92) 0%, rgba(8, 10, 15, 0.94) 100%), #0d1117 url(\"/api/home-bg\") no-repeat center top / cover", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="header-logo-float">
            <img src="/mlomesh-logo.png" alt="MLOMesh" className="header-logo" />
          </div>
          <header className="site-header" style={{ padding: "12px 16px", backgroundColor: "#10162b", backgroundImage: "url('/header-bg.png')", backgroundSize: "cover", color: "white" }}>
            <div className="header-top">
              <div className="header-brand" />
              <div className="header-actions">
                <LanguageSelect />
                <AuthLink />
                <DiscordLink />
              </div>
            </div>
            <nav className="header-nav">
              <a href="/" className="header-link">{t("nav.home")}</a>
              <a href="/map" className="header-link">{t("nav.map")}</a>
              <a href="/about" className="header-link">{t("nav.about")}</a>
              <a href="/creators" className="header-link">{t("nav.creators")}</a>
              <a href="/servers" className="header-link">{t("nav.servers")}</a>
              <a href="/submit" className="header-link">{t("nav.submit")}</a>
            </nav>
          </header>
          {children}
        </div>
      </main>
    );
  }

  if (pageState === "loading" || (pageState === "ready" && !session)) {
    return <PageLayout><div style={{ padding: 80, textAlign: "center" }}><p>Loading…</p></div></PageLayout>;
  }

  if (!session) {
    router.replace(`/?signin=1&next=${encodeURIComponent(`/servers/${id}/edit`)}`);
    return null;
  }

  if (pageState === "notfound") {
    return (
      <PageLayout>
        <div style={{ padding: 80, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Server not found</h1>
          <a href="/servers" style={{ color: "#60a5fa" }}>← Back to Servers</a>
        </div>
      </PageLayout>
    );
  }

  if (pageState === "forbidden") {
    return (
      <PageLayout>
        <div style={{ padding: 80, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>You can only edit servers you added</h1>
          <a href={`/servers/${id}`} style={{ color: "#60a5fa" }}>← Back to Server</a>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="servers-submit-form" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px 64px" }}>
          <div style={{ background: "rgba(15, 17, 22, 0.96)", borderRadius: 16, padding: "32px 28px 48px", border: "1px solid rgba(45, 55, 72, 0.8)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <a href={`/servers/${id}`} style={{ color: "#9ca3af", textDecoration: "none", fontSize: 14 }}>← Back to Server</a>
              <button
                type="button"
                onClick={() => getSupabaseBrowser().auth.signOut().then(() => router.push("/servers"))}
                style={{ padding: "8px 14px", fontSize: 13, background: "transparent", border: "1px solid #4b5563", color: "#9ca3af", borderRadius: 8, cursor: "pointer" }}
              >
                Sign out
              </button>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Edit your server</h1>
            <p style={{ opacity: 0.9, marginBottom: 28, lineHeight: 1.5, fontSize: 15 }}>Update the information for your FiveM server.</p>

            {state === "sent" ? (
              <div style={{ padding: 24, background: "rgba(34, 197, 94, 0.2)", borderRadius: 12, color: "#22c55e" }}>Changes saved! Redirecting…</div>
            ) : (
              <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Server name *</label>
                  <input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="My Awesome RP" required style={inputStyle} />
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Connect URL</label>
                    <input value={createUrl} onChange={(e) => setCreateUrl(e.target.value)} placeholder="cfx.re/join/xxxxx or direct IP" style={inputStyle} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Cfx.re code</label>
                    <input value={cfxId} onChange={(e) => setCfxId(e.target.value)} placeholder="Auto-detected from cfx.re URLs" style={inputStyle} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Owner name</label>
                    <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your name or team" style={inputStyle} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Discord URL *</label>
                    <input type="url" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." required style={inputStyle} />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Website URL</label>
                    <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                  </div>
                </div>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Banner</label>
                  <label style={{ ...inputStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: bannerUploading ? "not-allowed" : "pointer", opacity: bannerUploading ? 0.7 : 1, width: "auto" }}>
                    <input type="file" accept="image/*" disabled={bannerUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "banner"); e.target.value = ""; }} style={{ display: "none" }} />
                    {bannerUploading ? "Uploading…" : "Upload image"}
                  </label>
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Logo</label>
                    <label style={{ ...inputStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: logoUploading ? "not-allowed" : "pointer", opacity: logoUploading ? 0.7 : 1, width: "auto" }}>
                      <input type="file" accept="image/*" disabled={logoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo"); e.target.value = ""; }} style={{ display: "none" }} />
                      {logoUploading ? "Uploading…" : "Upload image"}
                    </label>
                  </div>
                </div>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Description *</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell players what makes your server unique..." rows={4} required style={{ ...inputStyle, maxWidth: "100%" }} />
                </div>
                <div style={{ ...sectionBoxStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Region</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} style={inputStyle}>
                      <option value="">Any</option>
                      {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>RP Type</label>
                    <select value={rpType} onChange={(e) => setRpType(e.target.value)} style={inputStyle}>
                      <option value="">Any</option>
                      {RP_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Economy</label>
                    <select value={economyType} onChange={(e) => setEconomyType(e.target.value)} style={inputStyle}>
                      <option value="">Any</option>
                      {ECONOMY_TYPES.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Criminal content</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 0" }}>
                    {CRIMINAL_DEPTH.map((c) => (
                      <label key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                        <input type="checkbox" checked={criminalTypes.includes(c.key)} onChange={(e) => { if (e.target.checked) setCriminalTypes((p) => [...p, c.key]); else setCriminalTypes((p) => p.filter((k) => k !== c.key)); }} style={{ width: 18, height: 18 }} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                  <input type="text" value={criminalOther} onChange={(e) => setCriminalOther(e.target.value)} placeholder="Other" style={{ ...inputStyle, marginTop: 8 }} />
                </div>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Looking for</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 0" }}>
                    {LOOKING_FOR_POSITIONS.map((p) => (
                      <label key={p.key} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                        <input type="checkbox" checked={lookingForTypes.includes(p.key)} onChange={(e) => { if (e.target.checked) setLookingForTypes((p2) => [...p2, p.key]); else setLookingForTypes((p2) => p2.filter((k) => k !== p.key)); }} style={{ width: 18, height: 18 }} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                  <input type="text" value={lookingForOther} onChange={(e) => setLookingForOther(e.target.value)} placeholder="Other" style={{ ...inputStyle, marginTop: 8 }} />
                </div>
                <div style={sectionBoxStyle}>
                  <label style={labelStyle}>Who&apos;s MLOs are you using?</label>
                  {creatorsList.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {creatorsList.map((c) => (
                        <label key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, padding: "8px 12px", borderRadius: 8, background: creatorKeys.includes(c.key) ? "rgba(34, 197, 94, 0.15)" : "rgba(31, 41, 55, 0.6)", border: `1px solid ${creatorKeys.includes(c.key) ? "rgba(34, 197, 94, 0.4)" : "rgba(55, 65, 81, 0.5)"}` }}>
                          <input type="checkbox" checked={creatorKeys.includes(c.key)} onChange={(e) => { if (e.target.checked) setCreatorKeys((p) => [...p, c.key]); else setCreatorKeys((p) => p.filter((k) => k !== c.key)); }} style={{ width: 16, height: 16 }} />
                          {c.logo_url && <img src={c.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />}
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, opacity: 0.7 }}>No creators listed yet.</span>
                  )}
                </div>
                <div style={{ ...sectionBoxStyle, display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={labelStyle}>Server stats</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Avg players</label>
                      <input type="number" min={0} value={avgPlayers} onChange={(e) => setAvgPlayers(e.target.value)} placeholder="32" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Max slots</label>
                      <input type="number" min={0} value={maxSlots} onChange={(e) => setMaxSlots(e.target.value)} placeholder="64" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Custom MLO count</label>
                      <input type="number" min={0} value={customMloCount} onChange={(e) => setCustomMloCount(e.target.value)} placeholder="50" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Custom script count</label>
                      <input type="number" min={0} value={customScriptCount} onChange={(e) => setCustomScriptCount(e.target.value)} placeholder="100" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Civ jobs count</label>
                    <input type="number" min={0} value={civJobsCount} onChange={(e) => setCivJobsCount(e.target.value)} placeholder="15" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Server features</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, ...sectionBoxStyle }}>
                    {[
                      { checked: whitelisted, set: setWhitelisted, label: "Whitelisted" },
                      { checked: noPayToWin, set: setNoPayToWin, label: "No Pay-to-Win" },
                      { checked: pdActive, set: setPdActive, label: "PD active" },
                      { checked: emsActive, set: setEmsActive, label: "EMS active" },
                      { checked: controllerFriendly, set: setControllerFriendly, label: "Controller friendly" },
                      { checked: newPlayerFriendly, set: setNewPlayerFriendly, label: "New player friendly" },
                    ].map(({ checked, set, label }) => (
                      <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 40, whiteSpace: "nowrap" }}>
                        <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} style={{ width: 18, height: 18 }} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                {errorMessage && <div style={{ padding: 12, background: "rgba(239, 68, 68, 0.2)", borderRadius: 8, color: "#ef4444" }}>{errorMessage}</div>}
                <button type="submit" disabled={state === "sending"} style={{ padding: "14px 24px", borderRadius: 10, background: "#22c55e", color: "#0f172a", fontWeight: 700, fontSize: 16, cursor: state === "sending" ? "not-allowed" : "pointer", opacity: state === "sending" ? 0.7 : 1 }}>
                  {state === "sending" ? "Saving…" : "Save changes"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
