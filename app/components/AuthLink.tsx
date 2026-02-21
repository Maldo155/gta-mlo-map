"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function AuthLink() {
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

  if (session) {
    return (
      <a href="/servers/submit" className="header-pill">
        Add Server
      </a>
    );
  }

  // Always start OAuth from homepage - works first try (cookie timing)
  const signInUrl = "/?signin=1&next=%2Fservers%2Fsubmit";
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
