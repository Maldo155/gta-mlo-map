"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AuthLink() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_e, next) => setSession(next)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseBrowser().auth.signOut();
    window.location.reload();
  }, []);

  if (session) {
    return (
      <button
        type="button"
        onClick={signOut}
        className="header-pill"
        style={{
          cursor: "pointer",
          border: "none",
          font: "inherit",
          background: "#dc2626",
          color: "white",
        }}
      >
        {t("auth.logout")}
      </button>
    );
  }

  // Stay on current page after sign in. Only the "Add Your City" button on /servers sends next=/servers/submit.
  const next = pathname || "/";
  const signInUrl = `/auth/start?next=${encodeURIComponent(next)}`;
  return (
    <a
      href={signInUrl}
      className="header-pill"
      style={{
        background: "#5865f2",
        color: "white",
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      Sign in
    </a>
  );
}
