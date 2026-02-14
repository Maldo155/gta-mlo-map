"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { CATEGORIES } from "@/app/lib/categories";

type MLO = {
  id: string;
  name: string;
  creator: string;
  website_url: string;
  image_url: string;
  category: string;
  tag?: string;
  x: number;
  y: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mlos: MLO[];
  onRefresh: () => void;
  adminToken?: string;
  selectedId?: string | null;
  viewCounts?: Record<string, number>;
};

export default function Sidebar({
  isOpen,
  onClose,
  mlos,
  onRefresh,
  adminToken,
  selectedId,
  viewCounts = {},
}: Props) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MLO | null>(null);

  async function saveEdits() {
    if (!draft || !adminToken) return;
    const res = await fetch("/api/mlo", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: draft.id,
        name: draft.name,
        creator: draft.creator,
        website_url: draft.website_url,
        category: draft.category,
        tag: draft.tag || null,
        x: Number(draft.x),
        y: Number(draft.y),
        image_url: draft.image_url,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      setDraft(null);
      onRefresh();
    }
  }

  async function deleteMlo(id: string) {
    if (!adminToken) return;
    if (!confirm("Delete this MLO?")) return;
    const res = await fetch(`/api/mlo?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (res.ok) {
      onRefresh();
    }
  }

  function startEdit(mlo: MLO) {
    setEditingId(mlo.id);
    setDraft({ ...mlo });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function handleCreatorClick(mlo: MLO) {
    if (!mlo.website_url) return;
    fetch("/api/mlo/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mlo_id: mlo.id }),
    }).catch(() => null);
    window.open(mlo.website_url, "_blank", "noopener,noreferrer");
  }
  if (!isOpen) return null;

  return (
    <div
      className="map-sidebar"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 360,
        background: "#0b0b0b",
        borderLeft: "1px solid #333",
        padding: 14,
        overflowY: "auto",
        zIndex: 1000,
        color: "white",
      }}
    >
      <button onClick={onClose} style={{ marginBottom: 12 }}>
        {t("sidebar.close")}
      </button>

      {mlos.length > 1 && (
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
          {t("sidebar.nearbyCount", { count: mlos.length })}
        </div>
      )}

      {mlos.length === 0 && <div>{t("sidebar.empty")}</div>}

      {mlos.map((mlo) => {
        const isActive = selectedId && mlo.id === selectedId;
        const showHighlight = isActive && mlos.length > 1;
        return (
        <div
          key={mlo.id}
          style={{
            marginBottom: 20,
            padding: showHighlight ? 10 : 0,
            borderRadius: 10,
            border: showHighlight ? "1px solid #c7ff4a" : "1px solid transparent",
            background: showHighlight ? "rgba(199,255,74,0.08)" : "transparent",
            boxShadow: showHighlight
              ? "0 0 0 1px rgba(199,255,74,0.25), 0 8px 20px rgba(0,0,0,0.35)"
              : "none",
          }}
        >
          {editingId === mlo.id && draft ? (
            <>
              <input
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value })
                }
                placeholder={t("sidebar.name")}
              />
              <input
                value={draft.creator}
                onChange={(e) =>
                  setDraft({ ...draft, creator: e.target.value })
                }
                placeholder={t("sidebar.creator")}
              />
              <input
                value={draft.website_url}
                onChange={(e) =>
                  setDraft({ ...draft, website_url: e.target.value })
                }
                placeholder={t("sidebar.website")}
              />
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {t(`categories.${c.key}`)}
                  </option>
                ))}
              </select>
              <input
                value={draft.tag ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, tag: e.target.value })
                }
                placeholder={t("sidebar.tag")}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={String(draft.x)}
                  onChange={(e) =>
                    setDraft({ ...draft, x: Number(e.target.value) })
                  }
                  placeholder="X"
                />
                <input
                  value={String(draft.y)}
                  onChange={(e) =>
                    setDraft({ ...draft, y: Number(e.target.value) })
                  }
                  placeholder="Y"
                />
              </div>
              <input
                value={draft.image_url}
                onChange={(e) =>
                  setDraft({ ...draft, image_url: e.target.value })
                }
                placeholder={t("sidebar.image")}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={saveEdits}>{t("sidebar.save")}</button>
                <button onClick={cancelEdit}>{t("sidebar.cancel")}</button>
              </div>
            </>
          ) : (
            <>
              <h3>{mlo.name}</h3>
              <div style={{ opacity: 0.7 }}>{mlo.creator}</div>
              {mlo.tag && (
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  {t("sidebar.tagLabel", { tag: mlo.tag })}
                </div>
              )}

              {mlo.image_url && (
                <a href={mlo.website_url} target="_blank" rel="noreferrer">
                  <img
                    src={mlo.image_url}
                    alt={mlo.name}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      marginTop: 8,
                      ...(showHighlight
                        ? {
                            border: "3px solid #eab308",
                            boxSizing: "border-box",
                            boxShadow: "0 0 12px rgba(234, 179, 8, 0.4)",
                          }
                        : {}),
                    }}
                  />
                </a>
              )}
              {!mlo.image_url && showHighlight && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    border: "2px solid #eab308",
                    background: "rgba(234, 179, 8, 0.08)",
                    fontSize: 12,
                    color: "#eab308",
                  }}
                >
                  {t("sidebar.selectedMarker")}
                </div>
              )}

              {mlo.website_url && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleCreatorClick(mlo)}
                    style={{ background: "transparent", border: "none", color: "#93c5fd", padding: 0 }}
                  >
                    {t("sidebar.visitCreator")}
                  </button>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("views.label")}: {viewCounts[mlo.id] ?? 0}
                  </div>
                </div>
              )}

              {adminToken && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => startEdit(mlo)}>
                    {t("sidebar.edit")}
                  </button>
                  <button onClick={() => deleteMlo(mlo.id)}>
                    {t("sidebar.delete")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      );
      })}
    </div>
  );
}
