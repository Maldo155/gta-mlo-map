"use client";

import { useLanguage } from "./LanguageProvider";
import { useState, useRef, useEffect } from "react";

type NavItem = {
  href: string;
  labelKey: string;
  extraClass?: string;
  desc?: string;
};

export default function MegaNav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mouseIn, setMouseIn] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: NavItem[] = [
    { href: "/", labelKey: "nav.home" },
    { href: "/map", labelKey: "nav.map", desc: "Interactive MLO map" },
    { href: "/about", labelKey: "nav.about" },
    {
      href: "/creators",
      labelKey: "nav.creators",
      extraClass: "header-link-creators",
      desc: "Creator spotlight",
    },
    {
      href: "/servers",
      labelKey: "nav.servers",
      extraClass: "header-link-servers",
      desc: "FiveM cities",
    },
    { href: "/submit", labelKey: "nav.submit", desc: "Submit MLOs & Cities" },
  ];

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 150);
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    setMouseIn(true);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setMouseIn(false);
    scheduleClose();
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <nav className="mega-nav" aria-label="Main navigation">
      <div
        className="mega-nav-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          className="mega-nav-trigger-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="mega-nav-trigger-icon">☰</span>
          <span className="mega-nav-trigger-label">Menu</span>
        </button>

        {open && (
          <div
            className="mega-nav-dropdown"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="mega-nav-dropdown-inner">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`mega-nav-item ${item.extraClass || ""}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="mega-nav-item-label">
                    {t(item.labelKey as "nav.home")}
                  </span>
                  {item.desc && (
                    <span className="mega-nav-item-desc">{item.desc}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
