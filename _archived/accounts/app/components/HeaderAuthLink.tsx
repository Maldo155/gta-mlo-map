"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useLanguage } from "./LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function HeaderAuthLink() {
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [isCreator, setIsCreator] = useState(false);

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
    if (!session?.access_token) {
      setIsCreator(false);
      return;
    }
    let active = true;
    fetch("/api/account/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (active && d?.profile?.is_creator) setIsCreator(true);
        else if (active) setIsCreator(false);
      })
      .catch(() => {
        if (active) setIsCreator(false);
      });
    return () => { active = false; };
  }, [session?.access_token]);

  if (session) {
    return (
      <a className="header-login" href="/account">
        {isCreator ? t("nav.myMLOs") : t("nav.myAccount")}
      </a>
    );
  }

  return (
    <a className="header-login" href="/login">
      {t("nav.myMLOs")}
    </a>
  );
}
