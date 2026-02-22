"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import CategorySelect from "./CategorySelect";
import { useLanguage } from "./LanguageProvider";

type Slot = {
  name: string;
  creator: string;
  websiteUrl: string;
  category: CategoryKey;
  tag: string;
  x: string;
  y: string;
  image: File | null;
};

const emptySlot = (): Slot => ({
  name: "",
  creator: "",
  websiteUrl: "",
  category: "police",
  tag: "",
  x: "",
  y: "",
  image: null,
});

type Props = {
  onCreated: () => void;
  adminToken: string;
  adminDevSecret?: string;
  coords: { x: number; y: number } | null;
  mlos: Array<{
    id: string;
    name?: string | null;
    creator?: string | null;
    website_url?: string | null;
    category?: string | null;
    tag?: string | null;
    x?: number | null;
    y?: number | null;
  }>;
};

export default function MloFormMulti({
  onCreated,
  adminToken,
  adminDevSecret,
  coords,
  mlos,
}: Props) {
  const { t } = useLanguage();
  const [slots, setSlots] = useState<Slot[]>([emptySlot()]);
  const [loading, setLoading] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalToSubmit, setTotalToSubmit] = useState(0);
  const [cascadeFromFirst, setCascadeFromFirst] = useState({
    name: false,
    creator: false,
    websiteUrl: false,
    category: false,
  });

  const uniqueCreators = useMemo(() => {
    const set = new Set<string>();
    for (const m of mlos) {
      const c = (m.creator ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mlos]);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    for (const m of mlos) {
      const raw = (m.tag ?? "").trim();
      if (raw) {
        raw.split(/[,\s]+/).forEach((tagVal) => {
          const v = tagVal.trim();
          if (v) set.add(v);
        });
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mlos]);

  useEffect(() => {
    if (coords) {
      setSlots((prev) =>
        prev.map((s, i) =>
          i === 0
            ? {
                ...s,
                x: String(coords.x.toFixed(2)),
                y: String(coords.y.toFixed(2)),
              }
            : s
        )
      );
    }
  }, [coords]);

  function updateSlot(index: number, updates: Partial<Slot>) {
    setSlots((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...updates } : s));
      if (index === 0) {
        const first = next[0];
        for (const key of ["name", "creator", "websiteUrl", "category"] as const) {
          if (key in updates && cascadeFromFirst[key]) {
            for (let j = 1; j < next.length; j++) {
              (next[j] as Record<string, unknown>)[key] = first[key];
            }
          }
        }
      }
      return next;
    });
  }

  function toggleCascade(field: keyof typeof cascadeFromFirst) {
    setCascadeFromFirst((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      if (next[field]) {
        setSlots((s) =>
          s.map((slot, i) =>
            i === 0 ? slot : { ...slot, [field]: s[0][field] }
          )
        );
      }
      return next;
    });
  }

  function addSlot() {
    setSlots((prev) => {
      const first = prev[0];
      const newSlot = { ...emptySlot() };
      if (cascadeFromFirst.name) newSlot.name = first.name;
      if (cascadeFromFirst.creator) newSlot.creator = first.creator;
      if (cascadeFromFirst.websiteUrl) newSlot.websiteUrl = first.websiteUrl;
      if (cascadeFromFirst.category) newSlot.category = first.category;
      return [...prev, newSlot];
    });
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function applyCoordsToSlot(index: number) {
    if (!coords) return;
    updateSlot(index, {
      x: String(coords.x.toFixed(2)),
      y: String(coords.y.toFixed(2)),
    });
  }

  function parseCoord(val: string): number {
    const s = val.trim();
    if (!s) return NaN;
    // Accept "123", "123.45", "-1910, 73" (take first number)
    const first = s.split(/[,\s]+/)[0]?.trim();
    const n = first ? Number(first) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }

  function isSlotComplete(slot: Slot) {
    const xNum = parseCoord(slot.x);
    const yNum = parseCoord(slot.y);
    return (
      Boolean(slot.name.trim()) &&
      Boolean(slot.creator.trim()) &&
      Boolean(slot.image) &&
      !Number.isNaN(xNum) &&
      Number.isFinite(xNum) &&
      !Number.isNaN(yNum) &&
      Number.isFinite(yNum)
    );
  }

  const completeSlots = slots.filter(isSlotComplete);
  const hasAuth = Boolean(adminToken) || Boolean(adminDevSecret);
  const canSubmit = hasAuth && completeSlots.length > 0;

  async function submitAll() {
    if (!canSubmit) return;

    setLoading(true);
    const toSubmit = slots.filter((s) => isSlotComplete(s) && s.image);
    setTotalToSubmit(toSubmit.length);
    setSubmittedCount(0);

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!isSlotComplete(slot) || !slot.image) continue;

      const xNum = parseCoord(slot.x);
      const yNum = parseCoord(slot.y);

      const form = new FormData();
      form.append("name", slot.name);
      form.append("creator", slot.creator);
      form.append("website_url", slot.websiteUrl);
      form.append("category", slot.category);
      form.append("tag", slot.tag);
      form.append("x", String(xNum));
      form.append("y", String(yNum));
      form.append("image", slot.image);

      const headers: Record<string, string> = {};
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      } else if (adminDevSecret) {
        headers["X-Admin-Dev-Secret"] = adminDevSecret;
      }
      const res = await fetch("/api/mlo", {
        method: "POST",
        headers,
        body: form,
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }
      setSubmittedCount((c) => c + 1);
    }

    setLoading(false);
    setSlots([emptySlot()]);
    onCreated();
  }

  function clearAll() {
    setSlots([emptySlot()]);
    setCascadeFromFirst({
      name: false,
      creator: false,
      websiteUrl: false,
      category: false,
    });
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>{t("mloForm.title")}</h3>

      {slots.map((slot, index) => (
        <div
          key={index}
          style={{
            marginBottom: 16,
            padding: 14,
            border: "1px solid #243046",
            borderRadius: 10,
            background: "#0d1321",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            <span>
              {t("mloForm.slotNumber", { n: index + 1 })}
              {isSlotComplete(slot) && " ✓"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {coords && (
                <button
                  type="button"
                  onClick={() => applyCoordsToSlot(index)}
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    color: "#94a3b8",
                  }}
                >
                  {t("mloForm.useMapPoint")}
                </button>
              )}
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    background: "rgba(220,38,38,0.2)",
                    border: "1px solid #dc2626",
                    borderRadius: 6,
                    color: "#f87171",
                  }}
                >
                  {t("mloForm.removeSlot")}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {index === 0 && (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                    <input
                      type="checkbox"
                      checked={cascadeFromFirst.name}
                      onChange={() => toggleCascade("name")}
                      style={{ width: 14, height: 14 }}
                    />
                    {t("mloForm.cascadeToAll")}
                  </label>
                  <span style={{ color: "#475569" }}>|</span>
                </>
              )}
              <input
                placeholder={t("mloForm.name")}
                value={slot.name}
                onChange={(e) => updateSlot(index, { name: e.target.value })}
                readOnly={index > 0 && cascadeFromFirst.name}
                style={
                  index > 0 && cascadeFromFirst.name
                    ? { flex: 1, opacity: 0.9, background: "#1e293b" }
                    : { flex: 1 }
                }
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: 11, color: "#94a3b8" }}>
                  {t("mloForm.creator")}
                </label>
                {index === 0 && (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                    <input
                      type="checkbox"
                      checked={cascadeFromFirst.creator}
                      onChange={() => toggleCascade("creator")}
                      style={{ width: 14, height: 14 }}
                    />
                    {t("mloForm.cascadeToAll")}
                  </label>
                )}
              </div>
              <input
                placeholder={t("mloForm.creatorPlaceholder")}
                value={slot.creator}
                onChange={(e) => updateSlot(index, { creator: e.target.value })}
                list={`mlo-form-multi-creator-${index}`}
                autoComplete="off"
                readOnly={index > 0 && cascadeFromFirst.creator}
                style={
                  index > 0 && cascadeFromFirst.creator
                    ? { opacity: 0.9, background: "#1e293b" }
                    : undefined
                }
              />
              <datalist id={`mlo-form-multi-creator-${index}`}>
                {uniqueCreators.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {index === 0 && (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                    <input
                      type="checkbox"
                      checked={cascadeFromFirst.websiteUrl}
                      onChange={() => toggleCascade("websiteUrl")}
                      style={{ width: 14, height: 14 }}
                    />
                    {t("mloForm.cascadeToAll")} Website
                  </label>
                  <span style={{ color: "#475569" }}>|</span>
                </>
              )}
              <input
                placeholder={t("mloForm.website")}
                value={slot.websiteUrl}
                onChange={(e) =>
                  updateSlot(index, { websiteUrl: e.target.value })
                }
                readOnly={index > 0 && cascadeFromFirst.websiteUrl}
                style={
                  index > 0 && cascadeFromFirst.websiteUrl
                    ? { flex: 1, opacity: 0.9, background: "#1e293b" }
                    : { flex: 1 }
                }
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 11, color: "#94a3b8" }}>
                {t("mloForm.tag")}
              </label>
              <input
                placeholder={t("mloForm.tagPlaceholder")}
                value={slot.tag}
                onChange={(e) => updateSlot(index, { tag: e.target.value })}
                list={`mlo-form-multi-tag-${index}`}
                autoComplete="off"
              />
              <datalist id={`mlo-form-multi-tag-${index}`}>
                {uniqueTags.map((tagVal) => (
                  <option key={tagVal} value={tagVal} />
                ))}
              </datalist>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {index === 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                  <input
                    type="checkbox"
                    checked={cascadeFromFirst.category}
                    onChange={() => toggleCascade("category")}
                    style={{ width: 14, height: 14 }}
                  />
                  {t("mloForm.cascadeToAll")} {t("mloForm.category")}
                </label>
              )}
              <CategorySelect
                value={slot.category}
                onChange={(v) => updateSlot(index, { category: v })}
                disabled={index > 0 && cascadeFromFirst.category}
                style={
                  index > 0 && cascadeFromFirst.category ? { opacity: 0.9 } : undefined
                }
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder={t("mloForm.x")}
                value={slot.x}
                onChange={(e) => updateSlot(index, { x: e.target.value })}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder={t("mloForm.y")}
                value={slot.y}
                onChange={(e) => updateSlot(index, { y: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateSlot(index, {
                  image: e.target.files?.[0] ?? null,
                })
              }
            />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={addSlot}
          style={{
            padding: "8px 14px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#e2e8f0",
            fontSize: 13,
          }}
        >
          + {t("mloForm.addAnother")}
        </button>
        <button
          onClick={submitAll}
          disabled={loading || !canSubmit}
          style={{
            padding: "8px 14px",
            background: canSubmit ? "#c7ff4a" : "#334155",
            border: "1px solid " + (canSubmit ? "#a3e635" : "#475569"),
            borderRadius: 8,
            color: canSubmit ? "#0d1321" : "#64748b",
            fontSize: 13,
          }}
        >
          {loading
            ? t("mloForm.submittingCount", {
                done: submittedCount,
                total: totalToSubmit,
              })
            : t("mloForm.submitAll", { count: completeSlots.length })}
        </button>
        <button type="button" onClick={clearAll}>
          {t("mloForm.clear")}
        </button>
      </div>

      {completeSlots.length === 0 && slots.some((s) => s.name || s.creator) && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          {t("mloForm.required")}
        </div>
      )}

      {completeSlots.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          {t("mloForm.readyCount", { count: completeSlots.length })}
        </div>
      )}
    </div>
  );
}
