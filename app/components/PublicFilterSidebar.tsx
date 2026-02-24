"use client";

import { useEffect, useRef, useState } from "react";
import CategoryIcon from "./CategoryIcon";
import CoordinateSearch from "./CoordinateSearch";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import { useLanguage } from "./LanguageProvider";

const GOLD_STAR = "#fde68a";

function CreatorSelect({
  selectedCreator,
  onCreatorChange,
  creatorOptions,
  allCreatorsLabel,
}: {
  selectedCreator: string;
  onCreatorChange: (key: string) => void;
  creatorOptions: { key: string; label: string; count: number; partnership?: boolean }[];
  allCreatorsLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = selectedCreator
    ? creatorOptions.find((o) => o.key === selectedCreator)
    : null;
  const displayText = selected
    ? `${selected.partnership ? "★ " : ""}${selected.label} (${selected.count})`
    : allCreatorsLabel;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "9px 11px",
          borderRadius: 6,
          border: "1px solid #2c3752",
          background: "#0f1528",
          color: "#e5e7eb",
          fontSize: 14,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected && selected.partnership ? (
            <>
              <span style={{ color: GOLD_STAR }}>★</span> {selected.label} ({selected.count})
            </>
          ) : (
            displayText
          )}
        </span>
        <span style={{ opacity: 0.7, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          className="creator-select-dropdown"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            marginTop: 4,
            maxHeight: 240,
            overflowY: "auto",
            background: "#0f1528",
            border: "1px solid #2c3752",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 100,
          }}
        >
          <button
            type="button"
            className="creator-select-option"
            onClick={() => {
              onCreatorChange("");
              setOpen(false);
            }}
            style={{
              width: "100%",
              padding: "9px 11px",
              background: !selectedCreator ? "#1e3a5f" : "transparent",
              border: "none",
              color: "#e5e7eb",
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {allCreatorsLabel}
          </button>
          {creatorOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="creator-select-option"
              onClick={() => {
                onCreatorChange(opt.key);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "9px 11px",
                background: selectedCreator === opt.key ? "#1e3a5f" : "transparent",
                border: "none",
                color: "#e5e7eb",
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {opt.partnership && (
                <span style={{ color: GOLD_STAR, flexShrink: 0 }}>★</span>
              )}
              <span>{opt.label}</span>
              <span style={{ opacity: 0.7, marginLeft: "auto" }}>({opt.count})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  search: string;
  setSearch: (v: string) => void;
  activeCategories?: CategoryKey[];
  toggleCategory?: (c: CategoryKey) => void;
  onSearch?: (pt: { x: number; y: number }) => void;
  categoryCounts?: Record<string, number>;
  totalMlos?: number;
  filteredCount?: number;
  selectedCreator?: string;
  onCreatorChange?: (creatorKey: string) => void;
  creatorOptions?: { key: string; label: string; count: number; partnership?: boolean }[];
  /** When true, highlight the creator search box (e.g. during welcome popup) */
  highlightCreatorSearch?: boolean;
};

export default function PublicFilterSidebar({
  search,
  setSearch,
  activeCategories = [],
  toggleCategory,
  onSearch,
  categoryCounts = {},
  totalMlos = 0,
  selectedCreator = "",
  onCreatorChange,
  creatorOptions = [],
  highlightCreatorSearch = false,
}: Props) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, []);

  const sidebarWidth = collapsed ? 56 : 320;

  return (
    <>
      {!collapsed && (
        <div
          className="map-filter-backdrop"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`map-filter-sidebar ${collapsed ? "filter-collapsed" : ""}`}
      style={{
        width: sidebarWidth,
        padding: collapsed ? 8 : 14,
        borderRight: "1px solid #243046",
        background: "#0b0f1a",
        color: "white",
        overflow: "hidden",
        flexShrink: 0,
        height: "100%",
        transition: "width 160ms ease, padding 160ms ease",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {t("filters.title")}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {t("filters.subtitle")}
            </div>
          </div>
        )}
      </div>
      <button
        className="filter-toggle-float"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? t("filters.expand") : t("filters.collapse")}
        title={collapsed ? t("filters.expand") : t("filters.collapse")}
      >
        {collapsed ? "›" : "‹"}
      </button>
      {!collapsed && (
        <div style={{ flexShrink: 0 }}>
      {/* X / Y SEARCH */}
      {onSearch && <CoordinateSearch onSearch={onSearch} />}

      {/* CREATOR FILTER */}
      {creatorOptions.length > 0 && onCreatorChange && (
        <div
          id="map-creator-search-highlight"
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            border: highlightCreatorSearch ? "3px solid #ef4444" : "2px solid rgba(30,58,138,0.7)",
            background: highlightCreatorSearch ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)",
            boxShadow: highlightCreatorSearch ? "0 0 12px rgba(239,68,68,0.4)" : undefined,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
            <strong>{t("filters.searchByCreator")}</strong> ({creatorOptions.length})
          </div>
          <CreatorSelect
            selectedCreator={selectedCreator}
            onCreatorChange={onCreatorChange!}
            creatorOptions={creatorOptions}
            allCreatorsLabel={t("filters.allCreators")}
          />
        </div>
      )}

      {/* TEXT SEARCH */}
      {!collapsed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0, padding: "6px 8px", fontSize: 12 }}
          />
          <button
            onClick={() => setSearch(search)}
            style={{ whiteSpace: "nowrap", padding: "6px 10px", fontSize: 12 }}
          >
            {t("filters.go")}
          </button>
        </div>
      )}

      </div>
      )}

      {/* CATEGORY FILTERS */}
      {!collapsed && (
          <div className="map-categories" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6, flexShrink: 0 }}>
            <span>{t("filters.categories")}</span>
          </div>
          <div className="map-categories-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategories.includes(cat.key);

              return (
                <div
                  key={cat.key}
                  className={`map-category-item${active ? " map-category-item-active" : ""}`}
                  onClick={() => toggleCategory?.(cat.key)}
                  style={{
                    cursor: toggleCategory ? "pointer" : "default",
                    padding: "6px 10px",
                    marginBottom: 4,
                    borderRadius: 4,
                    background: active ? "#3b82f6" : "#111827",
                    color: active ? "#fff" : "#e5e7eb",
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>
                    <CategoryIcon cat={cat} size={18} /> {t(`categories.${cat.key}`)}
                  </span>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>
                    {categoryCounts[cat.key] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
