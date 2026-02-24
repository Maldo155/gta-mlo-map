"use client";

import { useRef, useEffect, useState } from "react";
import CategoryIcon from "./CategoryIcon";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import { useLanguage } from "./LanguageProvider";

type Props = {
  value: CategoryKey;
  onChange: (v: CategoryKey) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Use translated labels (default true). Set false for admin to use raw label. */
  useTranslation?: boolean;
};

export default function CategorySelect({
  value,
  onChange,
  disabled = false,
  style,
  useTranslation = true,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = CATEGORIES.find((c) => c.key === value) ?? CATEGORIES[0];
  const getLabel = (c: (typeof CATEGORIES)[number]) =>
    useTranslation ? t(`categories.${c.key}`) : c.label;

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "6px 10px",
          fontSize: 12,
          background: disabled ? "#1e293b" : "#1e293b",
          border: "1px solid #334155",
          borderRadius: 6,
          color: "#e5e7eb",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.9 : 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "left",
        }}
      >
        <CategoryIcon cat={selected} size={16} />
        <span style={{ flex: 1 }}>{getLabel(selected)}</span>
        <span style={{ opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          className="category-select-dropdown"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            marginTop: 4,
            zIndex: 1000,
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 6,
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              className="category-select-option"
              onClick={() => {
                onChange(c.key);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 12,
                background: c.key === value ? "#334155" : "transparent",
                border: "none",
                color: "#e5e7eb",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
              }}
            >
              <CategoryIcon cat={c} size={16} />
              {getLabel(c)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
