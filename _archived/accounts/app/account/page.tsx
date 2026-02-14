"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import LanguageSelect from "../components/LanguageSelect";
import HeaderAuthLink from "../components/HeaderAuthLink";
import { useLanguage } from "../components/LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

type Profile = {
  display_name: string;
  bio: string;
  is_creator: boolean;
  email: string;
};

type Mlo = {
  id: string;
  name: string;
  creator?: string;
  image_url?: string;
  website_url?: string;
  x?: number | null;
  y?: number | null;
  view_count?: number;
};

type Review = {
  id: string;
  title: string;
  details?: string;
  created_at?: string;
};

export default function AccountPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [blocked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);
  const [savedMlos, setSavedMlos] = useState<Mlo[]>([]);
  const [allMlos, setAllMlos] = useState<Mlo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myMlos, setMyMlos] = useState<Mlo[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getSupabaseBrowser().auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || null);
    });
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);



  useEffect(() => {
    async function load() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [profileRes, savedRes, reviewsRes, mlosRes, myMlosRes] =
        await Promise.all([
          fetch("/api/account/profile", { headers }),
          fetch("/api/account/saved", { headers }),
          fetch("/api/account/reviews", { headers }),
          fetch("/api/mlo", { cache: "no-store" }),
          fetch("/api/account/my-mlos", { headers }),
        ]);

      if (profileRes.ok) {
        const json = await profileRes.json();
        setProfile(json.profile);
        setProfileDraft(json.profile);
      }

      if (savedRes.ok) {
        const json = await savedRes.json();
        setSavedMlos(json.mlos || []);
      }

      if (reviewsRes.ok) {
        const json = await reviewsRes.json();
        setReviews(json.reviews || []);
      }

      if (mlosRes.ok) {
        const json = await mlosRes.json();
        setAllMlos(json.mlos || []);
      }

      if (myMlosRes?.ok) {
        const json = await myMlosRes.json();
        setMyMlos(json.mlos || []);
        setTotalViews(json.totalViews ?? 0);
      }

      setLoading(false);
    }
    load();
  }, [session]);

  const filteredMlos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allMlos.slice(0, 8);
    return allMlos
      .filter(
        (mlo) =>
          mlo.name?.toLowerCase().includes(query) ||
          mlo.creator?.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allMlos, search]);

  async function saveProfile() {
    if (!session?.access_token || !profileDraft) return;
    setMessage("");
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileDraft),
    });
    if (res.ok) {
      setProfile(profileDraft);
      setMessage(t("account.saved"));
      return;
    }
    setMessage(t("account.saveError"));
  }

  async function saveMlo(mloId: string) {
    if (!session?.access_token) return;
    const res = await fetch("/api/account/saved", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mlo_id: mloId }),
    });
    if (res.ok) {
      const next = allMlos.find((mlo) => mlo.id === mloId);
      if (next && !savedMlos.find((mlo) => mlo.id === next.id)) {
        setSavedMlos((prev) => [next, ...prev]);
      }
    }
  }

  async function removeMlo(mloId: string) {
    if (!session?.access_token) return;
    const res = await fetch(`/api/account/saved?mlo_id=${mloId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (res.ok) {
      setSavedMlos((prev) => prev.filter((mlo) => mlo.id !== mloId));
    }
  }

  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    router.push("/");
  }

  if (blocked) {
    return null;
  }

  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        background:
          '#1a1f26 url("/api/home-bg") no-repeat center / cover',
        color: "white",
      }}
    >
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
          padding: "12px 16px",
          borderBottom: "1px solid #243046",
          background: "#10162b",
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
            <HeaderAuthLink />
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginTop: 10 }}>
              {profile
                ? profile.is_creator
                  ? t("account.myMLOs.title")
                  : t("account.myAccount.title")
                : t("account.myAccount.title")}
            </h1>
            <p style={{ color: "#cbd5f5" }}>
              {profile
                ? profile.is_creator
                  ? t("account.myMLOs.subtitle")
                  : t("account.myAccount.subtitle")
                : t("account.myAccount.subtitle")}
            </p>
          </div>
          {session && (
            <button type="button" onClick={signOut}>
              {t("auth.logout")}
            </button>
          )}
        </div>

        {session && loading && (
          <div style={{ marginTop: 20, opacity: 0.8 }}>
            {t("auth.loading")}
          </div>
        )}

        {!session && !loading && (
          <div
            style={{
              border: "1px solid #243046",
              background: "rgba(16, 22, 43, 0.9)",
              borderRadius: 16,
              padding: 20,
              maxWidth: 520,
            }}
          >
            <div style={{ fontWeight: 700 }}>{t("account.signInTitle")}</div>
            <p style={{ color: "#cbd5f5" }}>{t("account.signInBody")}</p>
            <a className="header-login" href="/login">
              {t("header.login")}
            </a>
          </div>
        )}

        {session && profile?.is_creator && (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              style={{
                border: "1px solid #243046",
                background: "rgba(16, 22, 43, 0.9)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {t("account.myMLOs.quickStats")}
                </div>
                <div style={{ fontSize: 14, color: "#9ca3af" }}>
                  {t("account.myMLOs.mloCount", {
                    count: myMlos.length,
                  })}{" "}
                  · {t("account.myMLOs.totalViews", { count: totalViews })}
                </div>
              </div>
              <a
                href="/submit"
                className="cta-submit"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {t("account.myMLOs.addAnother")}
              </a>
            </div>

            <div
              style={{
                border: "1px solid #243046",
                background: "rgba(16, 22, 43, 0.9)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ fontWeight: 700 }}>{t("account.myMLOs.myMlos")}</div>
              {myMlos.length === 0 ? (
                <div style={{ marginTop: 12, opacity: 0.7 }}>
                  {t("account.myMLOs.emptyMlos")}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    marginTop: 12,
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                  }}
                >
                  {myMlos.map((mlo) => (
                    <a
                      key={mlo.id}
                      href={`/map?mloId=${encodeURIComponent(mlo.id)}&highlight=1${
                        mlo.x != null && mlo.y != null
                          ? `&x=${encodeURIComponent(mlo.x)}&y=${encodeURIComponent(mlo.y)}`
                          : ""
                      }`}
                      style={{
                        border: "1px solid #243046",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#0f1528",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div
                        style={{
                          height: 80,
                          backgroundImage: `url(${
                            mlo.image_url || "/maps/gta-5-map-atlas-hd.jpg"
                          })`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div style={{ padding: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {mlo.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {(mlo.view_count ?? 0)} views
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {profileDraft && (
            <div
              style={{
                border: "1px solid #243046",
                background: "rgba(16, 22, 43, 0.9)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ fontWeight: 700 }}>{t("account.profile")}</div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                Set your display name to match the creator name on your MLOs exactly.
              </p>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("account.displayName")}
                </label>
                <input
                  value={profileDraft?.display_name || ""}
                  onChange={(e) =>
                    setProfileDraft((prev) =>
                      prev
                        ? { ...prev, display_name: e.target.value }
                        : prev
                    )
                  }
                  placeholder={t("account.displayName")}
                  style={{ marginTop: 6 }}
                />
              </div>
              {message && (
                <div style={{ marginTop: 10, color: "#86efac" }}>{message}</div>
              )}
              <button
                type="button"
                className="cta-submit"
                onClick={saveProfile}
                style={{ marginTop: 14 }}
              >
                {t("account.save")}
              </button>
            </div>
            )}
          </div>
        )}

        {session && profileDraft && !profile?.is_creator && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 18,
              marginTop: 20,
            }}
          >
            <div
              style={{
                border: "1px solid #243046",
                background: "rgba(16, 22, 43, 0.9)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ fontWeight: 700 }}>{t("account.profile")}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                {profile?.email}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("account.displayName")}
                </label>
                <input
                  value={profileDraft.display_name || ""}
                  onChange={(e) =>
                    setProfileDraft((prev) =>
                      prev
                        ? { ...prev, display_name: e.target.value }
                        : prev
                    )
                  }
                  placeholder={t("account.displayName")}
                  style={{ marginTop: 6 }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("account.bio")}
                </label>
                <textarea
                  value={profileDraft.bio || ""}
                  onChange={(e) =>
                    setProfileDraft((prev) =>
                      prev ? { ...prev, bio: e.target.value } : prev
                    )
                  }
                  placeholder={t("account.bioPlaceholder")}
                  rows={3}
                  style={{ marginTop: 6 }}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  fontSize: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={profileDraft.is_creator}
                  onChange={(e) =>
                    setProfileDraft((prev) =>
                      prev ? { ...prev, is_creator: e.target.checked } : prev
                    )
                  }
                />
                {t("account.creatorToggle")}
              </label>

              {message && (
                <div style={{ marginTop: 10, color: "#86efac" }}>{message}</div>
              )}

              <button
                type="button"
                className="cta-submit"
                onClick={saveProfile}
                style={{ marginTop: 14 }}
              >
                {t("account.save")}
              </button>
            </div>

            <div
              style={{
                border: "1px solid #243046",
                background: "rgba(16, 22, 43, 0.9)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ fontWeight: 700 }}>{t("account.savedMlos")}</div>
              {savedMlos.length === 0 ? (
                <div style={{ marginTop: 10, opacity: 0.7 }}>
                  {t("account.emptySaved")}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {savedMlos.map((mlo) => (
                    <div
                      key={mlo.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        border: "1px solid #243046",
                        borderRadius: 12,
                        padding: 10,
                        background: "#0f1528",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{mlo.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {mlo.creator || ""}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeMlo(mlo.id)}>
                        {t("account.remove")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600 }}>{t("account.addMlos")}</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("account.search")}
                  style={{ marginTop: 8 }}
                />
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {filteredMlos.map((mlo) => (
                    <div
                      key={mlo.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        border: "1px solid #243046",
                        borderRadius: 12,
                        padding: 10,
                        background: "#0f1528",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{mlo.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {mlo.creator || ""}
                        </div>
                      </div>
                      <button type="button" onClick={() => saveMlo(mlo.id)}>
                        {t("account.add")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {session && (
          <div
            style={{
              marginTop: 24,
              border: "1px solid #243046",
              background: "rgba(16, 22, 43, 0.9)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700 }}>{t("account.reviews")}</div>
            {reviews.length === 0 ? (
              <div style={{ marginTop: 10, opacity: 0.7 }}>
                {t("account.emptyReviews")}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      border: "1px solid #243046",
                      borderRadius: 12,
                      padding: 12,
                      background: "#0f1528",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{review.title}</div>
                    {review.details && (
                      <div style={{ marginTop: 6, opacity: 0.8 }}>
                        {review.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
