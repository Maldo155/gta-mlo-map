"use client";

import { LANGS, Lang } from "../lib/i18n";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSelect() {
  const { lang, setLang } = useLanguage();

  return (
    <span className="header-select-wrap">
      <select
        className="header-pill header-select"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label="Language"
      >
        {LANGS.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </span>
  );
}
