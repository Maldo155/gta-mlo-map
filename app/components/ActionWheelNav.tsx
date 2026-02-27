"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "./LanguageProvider";

/** Close when tapping outside (e.g. on mobile) - only active when open */
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, onOutside, enabled]);
}

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home" as const, icon: "/icons/home.svg" },
  { href: "/mlo", labelKey: "nav.mloHub" as const, icon: "/icons/mlo-hub.svg" },
  { href: "/creators", labelKey: "nav.creators" as const, icon: "/icons/users.svg" },
  { href: "/map", labelKey: "nav.map" as const, icon: "/icons/map.svg" },
  { href: "/about", labelKey: "nav.about" as const, icon: "/icons/info.svg" },
  { href: "/cities", labelKey: "nav.fivemCities" as const, icon: "/icons/cities.svg" },
  { href: "/servers", labelKey: "nav.fivemServers" as const, icon: "/icons/server.svg" },
];

export default function ActionWheelNav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<(typeof NAV_ITEMS)[number] | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  useClickOutside(navRef, () => setOpen(false), open);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, [clearCloseTimer]);

  const handleEnter = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const handleLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const handleTriggerClick = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <div
      ref={navRef}
      className="action-wheel-nav"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className="action-wheel-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        tabIndex={0}
        onClick={handleTriggerClick}
      >
        <span className="action-wheel-trigger-icon">≡</span>
        <span className="action-wheel-trigger-label">Menu</span>
      </button>

      {open && (
        <div
          className="action-wheel-dropdown"
          role="menu"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="action-wheel-dropdown-center">
            {hoveredItem ? t(hoveredItem.labelKey) : "Menu"}
          </div>
          <div className="action-wheel-dropdown-row">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="action-wheel-dropdown-item"
                role="menuitem"
                onClick={() => setOpen(false)}
                onMouseEnter={() => setHoveredItem(item)}
              >
                <span className="action-wheel-dropdown-icon">
                  <Image
                    src={item.icon}
                    alt=""
                    width={32}
                    height={32}
                    style={{ filter: "brightness(1.2)" }}
                  />
                </span>
                <span className="action-wheel-dropdown-label">{t(item.labelKey)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
