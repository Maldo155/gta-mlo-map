"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, Lang, translations } from "../lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "siteLanguage";

function interpolate(
  text: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return text;
  return Object.keys(vars).reduce((acc, key) => {
    const value = String(vars[key]);
    return acc.replaceAll(`{{${key}}}`, value);
  }, text);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in translations) {
      setLangState(stored as Lang);
      document.documentElement.lang = stored;
      return;
    }
    document.documentElement.lang = DEFAULT_LANG;
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const base =
        translations[lang]?.[key] ?? translations[DEFAULT_LANG]?.[key] ?? key;
      return interpolate(base, vars);
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
