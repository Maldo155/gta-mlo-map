"use client";

import { siteConfig } from "@/app/lib/siteConfig";
import AuthLink from "./AuthLink";
import DiscordLink from "./DiscordLink";
import LanguageSelect from "./LanguageSelect";
import ClassicNav from "./ClassicNav";
import MegaNav from "./MegaNav";
import { useLanguage } from "./LanguageProvider";

type SiteHeaderProps = {
  /** Show Contact button (used on home page) */
  showContact?: boolean;
  /** Contact click handler */
  onContactClick?: () => void;
  /** "map" = compact padding, MLOMESH brand text; "default" = standard */
  variant?: "default" | "map";
  /** Extra inline styles for header */
  style?: React.CSSProperties;
};

export default function SiteHeader({
  showContact = false,
  onContactClick,
  variant = "default",
  style = {},
}: SiteHeaderProps) {
  const { t } = useLanguage();
  const isMap = variant === "map";
  const headerStyle: React.CSSProperties = {
    padding: isMap ? "6px 12px" : "16px 24px",
    backgroundColor: "#10162b",
    backgroundImage: "url('/header-bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    backdropFilter: "blur(8px)",
    color: "white",
    ...style,
  };

  return (
    <header className="site-header" style={headerStyle}>
      <div className="header-top">
        <div className="header-brand">
          {isMap && (
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
              MLOMESH
            </div>
          )}
        </div>
        <div className="header-actions">
          <LanguageSelect />
          <AuthLink />
          <DiscordLink />
          {showContact && (
            <button
              type="button"
              className="header-contact"
              onClick={() => {
                onContactClick?.();
              }}
            >
              {t("contact.button")}
            </button>
          )}
        </div>
      </div>
      {siteConfig.useMegaNav ? <MegaNav /> : <ClassicNav />}
    </header>
  );
}
