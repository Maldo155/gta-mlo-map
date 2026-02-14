"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, CategoryKey } from "@/app/lib/categories";
import { useLanguage } from "./LanguageProvider";

type Props = {
  onCreated: () => void;
  adminToken: string;
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

export default function MloForm({ onCreated, adminToken, coords, mlos }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [creator, setCreator] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState<CategoryKey>("police");
  const [tag, setTag] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [loading, setLoading] = useState(false);
  const xNum = x.trim() === "" ? NaN : Number(x);
  const yNum = y.trim() === "" ? NaN : Number(y);
  const canSubmit =
    Boolean(adminToken) &&
    Boolean(name.trim()) &&
    Boolean(creator.trim()) &&
    Boolean(image) &&
    !Number.isNaN(xNum) &&
    Number.isFinite(xNum) &&
    !Number.isNaN(yNum) &&
    Number.isFinite(yNum);

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
        raw.split(/[,\s]+/).forEach((t) => {
          const v = t.trim();
          if (v) set.add(v);
        });
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mlos]);

  useEffect(() => {
    if (coords) {
      setX(String(coords.x.toFixed(2)));
      setY(String(coords.y.toFixed(2)));
    }
  }, [coords]);

  function getDuplicateHints() {
    if (!mlos.length) return [];
    const normalizedName = name.trim().toLowerCase();
    const normalizedWebsite = websiteUrl.trim().toLowerCase();
    return mlos
      .map((mlo) => {
        const matches: string[] = [];
        if (normalizedName && mlo.name?.toLowerCase() === normalizedName) {
          matches.push("Name");
        }
        if (
          normalizedWebsite &&
          mlo.website_url?.toLowerCase() === normalizedWebsite
        ) {
          matches.push("Website");
        }
        return matches.length >= 2
          ? {
              id: mlo.id,
              name: mlo.name || "Unnamed MLO",
              matches,
            }
          : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; matches: string[] }>;
  }

  const duplicateHints = getDuplicateHints();

  async function submit() {
    if (!canSubmit) return;

    setLoading(true);

    const form = new FormData();
    form.append("name", name);
    form.append("creator", creator);
    form.append("website_url", websiteUrl);
    form.append("category", category);
    form.append("tag", tag);
    form.append("x", String(xNum));
    form.append("y", String(yNum));
    form.append("image", image as File);

    const res = await fetch("/api/mlo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: form,
    });

    setLoading(false);

    if (res.ok) {
      setName("");
      setCreator("");
      setWebsiteUrl("");
      setTag("");
      setImage(null);
      onCreated();
    }
  }

  function clearForm() {
    setName("");
    setCreator("");
    setWebsiteUrl("");
    setTag("");
    setImage(null);
    setX("");
    setY("");
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>{t("mloForm.title")}</h3>

      <input
        placeholder={t("mloForm.name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ fontSize: 11, color: "#94a3b8" }}>{t("mloForm.creator")}</label>
        <input
          placeholder={t("mloForm.creatorPlaceholder")}
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          list="mlo-form-creator-list"
          autoComplete="off"
        />
        <datalist id="mlo-form-creator-list">
          {uniqueCreators.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <input
        placeholder={t("mloForm.website")}
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ fontSize: 11, color: "#94a3b8" }}>{t("mloForm.tag")}</label>
        <input
          placeholder={t("mloForm.tagPlaceholder")}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          list="mlo-form-tag-list"
          autoComplete="off"
        />
        <datalist id="mlo-form-tag-list">
          {uniqueTags.map((tagVal) => (
            <option key={tagVal} value={tagVal} />
          ))}
        </datalist>
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as CategoryKey)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.icon} {t(`categories.${c.key}`)}
          </option>
        ))}
      </select>

     <input
        type="text"
        inputMode="decimal"
        placeholder={t("mloForm.x")}
        value={x}
        onChange={(e) => setX(e.target.value)}
      />
     <input
        type="text"
        inputMode="decimal"
        placeholder={t("mloForm.y")}
        value={y}
        onChange={(e) => setY(e.target.value)}
      />


      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={submit} disabled={loading || !canSubmit}>
        {loading ? t("mloForm.adding") : t("mloForm.add")}
        </button>
        <button type="button" onClick={clearForm}>
          {t("mloForm.clear")}
        </button>
      </div>

      {!canSubmit && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          {t("mloForm.required")}
        </div>
      )}

      {duplicateHints.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #c7ff4a",
            background: "rgba(199,255,74,0.08)",
            fontSize: 12,
          }}
        >
          Potential duplicate(s) detected:
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {duplicateHints.slice(0, 5).map((hint) => (
              <li key={hint.id}>
                {hint.name} — matches: {hint.matches.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
