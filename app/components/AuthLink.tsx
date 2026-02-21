"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function AuthLink() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_e, next) => setSession(next)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (loading) return;
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/servers/submit")}`;
    const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
    if (error) {
      alert(error.message);
    }
    setLoading(false);
  }

  if (session) {
    return (
      <a href="/servers/submit" className="header-pill">
        Add Server
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="header-pill"
      style={{
        background: "#5865f2",
        color: "white",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading ? "Redirecting…" : "Sign in"}
    </button>
  );
}
