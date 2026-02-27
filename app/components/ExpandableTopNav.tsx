"use client";

import { useLanguage } from "@/app/components/LanguageProvider";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home" as const, extraClass: "" },
  { href: "/map", labelKey: "nav.map" as const, extraClass: "" },
  { href: "/about", labelKey: "nav.about" as const, extraClass: "" },
  { href: "/creators", labelKey: "nav.creators" as const, extraClass: "header-link-creators" },
  { href: "/servers", labelKey: "nav.servers" as const, extraClass: "header-link-servers" },
  { href: "/submit", labelKey: "nav.submit" as const, extraClass: "" },
];

export default function ExpandableTopNav() {
  const { t } = useLanguage();

  return (
    <nav className="expandable-top-nav" aria-label="Main navigation">
      <div className="expandable-nav-inner">
        <div className="expandable-nav-trigger" aria-hidden="true">
          <span className="expandable-nav-trigger-icon">≡</span>
          <span className="expandable-nav-trigger-label">Menu</span>
        </div>
        <div className="expandable-nav-links">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`expandable-nav-link ${item.extraClass}`}
            >
              {t(item.labelKey)}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
