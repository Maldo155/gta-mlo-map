"use client";

import { useLanguage } from "./LanguageProvider";

export default function ClassicNav() {
  const { t } = useLanguage();

  return (
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
      <a href="/creators" className="header-link header-link-creators">
        {t("nav.creators")}
      </a>
      <a href="/servers" className="header-link header-link-servers">
        {t("nav.servers")}
      </a>
      <a href="/submit" className="header-link">
        {t("nav.submit")}
      </a>
    </nav>
  );
}
