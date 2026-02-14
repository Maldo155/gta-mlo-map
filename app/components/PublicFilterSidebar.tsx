"use client";

import { useEffect, useState } from "react";
import CoordinateSearch from "./CoordinateSearch";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import { useLanguage } from "./LanguageProvider";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  activeCategories?: CategoryKey[];
  toggleCategory?: (c: CategoryKey) => void;
  onSearch?: (pt: { x: number; y: number }) => void;
  categoryCounts?: Record<string, number>;
  totalMlos?: number;
  selectedCreator?: string;
  onCreatorChange?: (creatorKey: string) => void;
  creatorOptions?: { key: string; label: string; count: number }[];
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
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            {t("filters.creator")}
          </div>
          <select
            value={selectedCreator}
            onChange={(e) => onCreatorChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #2c3752",
              background: "#0f1528",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <option value="">{t("filters.allCreators")}</option>
            {creatorOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.count})
              </option>
            ))}
          </select>
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
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span>{t("filters.categories")}</span>
            <span style={{ fontWeight: 600, opacity: 1 }}>({totalMlos})</span>
          </div>
          <div className="map-categories-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategories.includes(cat.key);

              return (
                <div
                  key={cat.key}
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
                    {cat.icon} {t(`categories.${cat.key}`)}
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
