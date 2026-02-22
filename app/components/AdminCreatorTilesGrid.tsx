"use client";

const TILE_DESIGN_W = 1000;
const TILE_DESIGN_H = 52;

function toSixDigitHex(s: string): string {
  const v = s.trim();
  if (!v) return "";
  const hex = v.startsWith("#") ? v.slice(1) : v;
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = hex[0] + hex[0], g = hex[1] + hex[1], b = hex[2] + hex[2];
    return `#${r}${g}${b}`.toLowerCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return `#${hex}`.toLowerCase();
  return "";
}

type TextureDraw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

type Props = {
  creatorTiles: any[];
  showReorderTiles: boolean;
  setShowReorderTiles: (v: boolean | ((prev: boolean) => boolean)) => void;
  tileCreatorKey: string;
  setTileCreatorKey: (v: string) => void;
  tileButtonLabel: string;
  setTileButtonLabel: (v: string) => void;
  tileButtonUrl: string;
  setTileButtonUrl: (v: string) => void;
  tileDiscordInvite: string;
  setTileDiscordInvite: (v: string) => void;
  tileDescription: string;
  setTileDescription: (v: string) => void;
  tileWebsiteUrl: string;
  setTileWebsiteUrl: (v: string) => void;
  tileDiscordSaving: boolean;
  setTileDiscordSaving: (v: boolean) => void;
  tileBorderGlow: boolean;
  setTileBorderGlow: (v: boolean) => void;
  tileBorderGlowColor: string;
  setTileBorderGlowColor: (v: string) => void;
  tileVerifiedCreator: boolean;
  setTileVerifiedCreator: (v: boolean) => void;
  tilePartnership: boolean;
  setTilePartnership: (v: boolean) => void;
  designTextureId: string;
  setDesignTextureId: (v: string) => void;
  designTextureColor: string;
  setDesignTextureColor: (v: string) => void;
  designLogoFile: File | null;
  setDesignLogoFile: (v: File | null) => void;
  designLogoPosition: "left" | "center" | "right";
  setDesignLogoPosition: (v: "left" | "center" | "right") => void;
  designLogoSize: number;
  setDesignLogoSize: (v: number) => void;
  designGenerating: boolean;
  setDesignGenerating: (v: boolean) => void;
  tileFitMode: "cover" | "contain";
  setTileFitMode: (v: "cover" | "contain") => void;
  tileZoom: number;
  setTileZoom: (v: number) => void;
  tilePosition: string;
  setTilePosition: (v: string) => void;
  tilePosX: number;
  setTilePosX: (v: number) => void;
  tilePosY: number;
  setTilePosY: (v: number) => void;
  tileDragging: boolean;
  setTileDragging: (v: boolean) => void;
  tileResizing: boolean;
  tileBannerUrl: string;
  setTileBannerUrl: (v: string) => void;
  tileLogoUrl: string;
  setTileLogoUrl: (v: string) => void;
  tileUploading: boolean;
  setTileUploading: (v: boolean) => void;
  tileSaving: boolean;
  setTileSaving: (v: boolean) => void;
  tileDeleting: boolean;
  setTileDeleting: (v: boolean) => void;
  tileStatus: string;
  setTileStatus: (v: string) => void;
  accessToken: string | null;
  adminDevSecret?: string;
  mlos: any[];
  loadCreatorTiles: () => Promise<void>;
  loadMlos: () => Promise<void>;
  drawTileDesignCanvas: (canvas: HTMLCanvasElement, opts: { textureId: string; textureColor: string; logoImage: HTMLImageElement | null; logoPosition: "left" | "center" | "right"; logoSize: number }) => void;
  designLogoImage: HTMLImageElement | null;
  TILE_TEXTURES: { id: string; name: string; draw: TextureDraw }[];
  tileDesignCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  tilePreviewRef: React.RefObject<HTMLDivElement | null>;
  tileDragStart: React.MutableRefObject<{ x: number; y: number } | null>;
  tilePosStart: React.MutableRefObject<{ x: number; y: number } | null>;
};

const TILE_TEXTURES_FALLBACK: { id: string; name: string; draw: TextureDraw }[] = [
  { id: "dark", name: "Dark gradient", draw: (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#0f1115"); g.addColorStop(0.5, "#1a1f26"); g.addColorStop(1, "#0f1115");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }},
  { id: "blue", name: "Blue mesh", draw: (ctx, w, h) => {
    ctx.fillStyle = "#0c1222"; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(30,58,138,0.25)"); g.addColorStop(0.5, "rgba(59,130,246,0.15)"); g.addColorStop(1, "rgba(30,58,138,0.25)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }},
  { id: "carbon", name: "Carbon", draw: (ctx, w, h) => {
    ctx.fillStyle = "#111318"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }},
  { id: "warm", name: "Warm gradient", draw: (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#1c1917"); g.addColorStop(0.5, "#292524"); g.addColorStop(1, "#1c1917");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }},
  { id: "solid", name: "Solid dark", draw: (ctx, w, h) => { ctx.fillStyle = "#0f1115"; ctx.fillRect(0, 0, w, h); }},
  { id: "solid_plain", name: "Solid", draw: (ctx, w, h) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }},
];

function authHeaders(props: { accessToken: string | null; adminDevSecret?: string }): Record<string, string> {
  if (props.accessToken) return { Authorization: `Bearer ${props.accessToken}` };
  if (props.adminDevSecret) return { "X-Admin-Dev-Secret": props.adminDevSecret };
  return {};
}

export default function AdminCreatorTilesGrid(props: Props) {
  const hasAuth = Boolean(props.accessToken) || Boolean(props.adminDevSecret);
  const tex = props.TILE_TEXTURES?.length ? props.TILE_TEXTURES : TILE_TEXTURES_FALLBACK;
  const norm = (s: string) =>
    String(s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {(props.creatorTiles?.length ?? 0) > 0 && (
        <div style={{ padding: 12, border: "1px solid #1f2937", borderRadius: 8, backgroundColor: "#0b0f1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: props.showReorderTiles ? 10 : 0 }}>
            <div style={{ fontWeight: 600 }}>Reorder &amp; delete tiles</div>
            <button type="button" onClick={() => props.setShowReorderTiles((v) => !v)}>
              {props.showReorderTiles ? "Hide ▲" : "Show ▼"}
            </button>
          </div>
          {props.showReorderTiles && (
            <>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                Change display order with the Position dropdown. Red × deletes the tile and all its MLOs.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(props.creatorTiles || []).map((t: { creator_key?: string }, i: number) => (
                  <div key={t.creator_key || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#10162b", borderRadius: 6, border: "1px solid #243046" }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{t.creator_key}</span>
                    <button type="button" title="Delete tile" onClick={async () => {
                      const key = String(t.creator_key || "").trim().toLowerCase();
                      if (!key || !hasAuth) return;
                      const normalizedKey = norm(key);
                      const mloCount = (props.mlos || []).filter((m: { creator?: string }) => norm(String(m.creator || "")) === normalizedKey).length;
                      const mloMsg = mloCount > 0 ? ` and ${mloCount} MLO(s)` : "";
                      if (!confirm(`Delete tile "${t.creator_key}"? This removes the tile${mloMsg} from Supabase. This cannot be undone.`)) return;
                      try {
                        const res = await fetch(`/api/creator-tiles?creator_key=${encodeURIComponent(key)}`, { method: "DELETE", headers: authHeaders(props) });
                        const json = await res.json().catch(() => ({}));
                        if (res.ok) {
                          const n = json.deletedMlos ?? 0;
                          props.setTileStatus(n > 0 ? `Deleted tile and ${n} MLO(s).` : `Deleted "${t.creator_key}".`);
                          props.loadCreatorTiles();
                          props.loadMlos();
                        } else props.setTileStatus(json.error || "Delete failed.");
                      } catch { props.setTileStatus("Delete failed."); }
                    }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, padding: 0, border: "1px solid #991b1b", borderRadius: 6, background: "#7f1d1d", color: "#fca5a5", fontWeight: 700, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                      ×
                    </button>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <span style={{ opacity: 0.7 }}>Position:</span>
                      <select value={i + 1} onChange={async (e) => {
                        const n = parseInt(e.target.value, 10);
                        const total = props.creatorTiles?.length ?? 1;
                        if (!Number.isFinite(n) || n < 1 || n > total || n === i + 1 || !hasAuth) return;
                        const keys = (props.creatorTiles || []).map((x: { creator_key?: string }) => String(x.creator_key || "").trim()).filter(Boolean);
                        const moved = keys.splice(i, 1)[0];
                        keys.splice(n - 1, 0, moved);
                        try {
                          const res = await fetch("/api/creator-tiles/reorder", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(props) }, body: JSON.stringify({ creator_keys: keys }) });
                          const json = await res.json().catch(() => ({}));
                          if (res.ok) {
                            props.setTileStatus("Order saved.");
                            await props.loadCreatorTiles();
                          } else {
                            props.setTileStatus(json?.error || "Reorder failed.");
                          }
                        } catch (err) {
                          props.setTileStatus("Reorder failed. Check network.");
                        }
                      }} style={{ minWidth: 64, padding: "4px 6px", fontSize: 12 }}>
                        {Array.from({ length: props.creatorTiles?.length ?? 1 }, (_, j) => (
                          <option key={j} value={j + 1}>{j + 1}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>1. Select creator to edit</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={props.tileCreatorKey} onChange={(e) => props.setTileCreatorKey(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">Select creator key</option>
            {Array.from(new Set((props.mlos || []).map((m: any) => String(m.creator || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((creator) => {
              const key = creator.toLowerCase();
              return <option key={key} value={key}>{creator}</option>;
            })}
          </select>
          <select value="cover" onChange={() => null} disabled><option value="cover">cover (crop)</option></select>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>2. Button (shows on tile)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Button label (optional)" value={props.tileButtonLabel} onChange={(e) => props.setTileButtonLabel(e.target.value)} style={{ minWidth: 260 }} />
          <input placeholder="Button URL (optional)" value={props.tileButtonUrl} onChange={(e) => props.setTileButtonUrl(e.target.value)} style={{ minWidth: 320 }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, marginBottom: 12 }}>
          Button label + URL appear on this creator&apos;s tile on the <a href="/creators" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>/creators</a> page (e.g. &quot;Visit Store&quot; &rarr; store link). Both must be set for the button to show. Click &quot;Save tile&quot; below to save.
        </div>
      </div>

      <div style={{ marginTop: 16, marginBottom: 16, padding: 14, borderRadius: 10, border: "2px solid rgba(88,166,255,0.4)", background: "linear-gradient(135deg, rgba(30,58,138,0.15) 0%, rgba(15,23,42,0.9) 100%)" }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: "#93c5fd", fontSize: 14 }}>3. Discord post info (optional)</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>These appear in your Discord #your-creators forum. The bot auto-posts when you save. Leave blank if you prefer.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Creator logo (appears in Discord post, like B3ast)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
              {props.tileLogoUrl ? (
                <img src={props.tileLogoUrl} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #374151" }} />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={!hasAuth || !props.tileCreatorKey.trim()}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !hasAuth || !props.tileCreatorKey.trim()) return;
                  props.setTileUploading(true);
                  props.setTileStatus("Uploading logo...");
                  try {
                    const form = new FormData();
                    form.append("file", file);
                    form.append("creator_key", props.tileCreatorKey);
                    const res = await fetch("/api/creator-tiles/upload-logo", { method: "POST", headers: authHeaders(props), body: form });
                    const json = await res.json();
                    const url = json?.publicUrl ? String(json.publicUrl).trim() : null;
                    if (res.ok && url) {
                      const patchRes = await fetch("/api/creator-tiles", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(props) }, body: JSON.stringify({ creator_key: props.tileCreatorKey, logo_url: url }) });
                      if (patchRes.ok) {
                        props.setTileLogoUrl(url);
                        props.setTileStatus("Logo saved. Discord post will update.");
                        await props.loadCreatorTiles();
                      } else props.setTileStatus("Save failed.");
                    } else props.setTileStatus(json?.error || "Upload failed.");
                  } catch { props.setTileStatus("Upload failed."); }
                  finally { props.setTileUploading(false); e.target.value = ""; }
                }}
                style={{ fontSize: 12 }}
              />
              {props.tileUploading && <span style={{ fontSize: 11, opacity: 0.8 }}>Uploading…</span>}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Discord invite (e.g. discord.gg/xxxxx)</label>
            <input placeholder="https://discord.gg/..." value={props.tileDiscordInvite} onChange={(e) => props.setTileDiscordInvite(e.target.value)} style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 420, padding: "8px 10px", borderRadius: 6, border: "1px solid #374151", background: "#111827", color: "#e5e7eb" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Short description</label>
            <textarea placeholder="Brief description for Discord post (e.g. creator bio, specialty)..." value={props.tileDescription} onChange={(e) => props.setTileDescription(e.target.value)} rows={3} style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 420, padding: "8px 10px", borderRadius: 6, border: "1px solid #374151", background: "#111827", color: "#e5e7eb", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Website URL</label>
            <input type="url" placeholder="https://..." value={props.tileWebsiteUrl} onChange={(e) => props.setTileWebsiteUrl(e.target.value)} style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 420, padding: "8px 10px", borderRadius: 6, border: "1px solid #374151", background: "#111827", color: "#e5e7eb" }} />
          </div>
          <button onClick={async () => {
            if (!hasAuth || !props.tileCreatorKey.trim()) return;
            props.setTileDiscordSaving(true);
            props.setTileStatus("Saving Discord & description...");
            try {
              const res = await fetch("/api/creator-tiles", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(props) }, body: JSON.stringify({ creator_key: props.tileCreatorKey, creator_discord_invite: props.tileDiscordInvite.trim() || null, creator_description: props.tileDescription.trim() || null, creator_website_url: props.tileWebsiteUrl.trim() || null }) });
              const json = await res.json();
              if (!res.ok) props.setTileStatus(json.error || "Save failed.");
              else { props.setTileStatus("Discord & description saved."); props.loadCreatorTiles(); }
            } catch { props.setTileStatus("Save failed."); }
            finally { props.setTileDiscordSaving(false); }
          }} disabled={props.tileDiscordSaving} style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: 6, border: "1px solid #3b82f6", background: "#1e40af", color: "white", fontWeight: 600, cursor: props.tileDiscordSaving ? "not-allowed" : "pointer" }}>
            {props.tileDiscordSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>4. Options &amp; badges</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={props.tileVerifiedCreator} onChange={(e) => props.setTileVerifiedCreator(e.target.checked)} />
            <span>Verified MLO Creator</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={props.tilePartnership} onChange={(e) => props.setTilePartnership(e.target.checked)} />
            <span>Partner</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={props.tileBorderGlow} onChange={(e) => props.setTileBorderGlow(e.target.checked)} />
            <span>Tile border glow (outline the card, not the image)</span>
          </label>
          {props.tileBorderGlow && (
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.9 }}>Glow color:</span>
              <input type="color" value={props.tileBorderGlowColor} onChange={(e) => props.setTileBorderGlowColor(e.target.value)} style={{ width: 32, height: 28, padding: 0, border: "1px solid #333", borderRadius: 4, cursor: "pointer" }} />
              <input type="text" value={props.tileBorderGlowColor} onChange={(e) => props.setTileBorderGlowColor(e.target.value)} style={{ width: 90, fontSize: 12 }} placeholder="#c7ff4a" />
            </label>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #1f2937", borderRadius: 10, backgroundColor: "#0b0b0b" }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>5. Design tile banner</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>Pick a texture and logo to generate a 1000×52 banner. Click &quot;Generate &amp; set as banner&quot; to apply.</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Background texture</label>
            <select value={props.designTextureId} onChange={(e) => props.setDesignTextureId(e.target.value)} style={{ display: "block", marginTop: 4, minWidth: 140 }}>
              {tex.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Texture color (tint)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <input type="color" value={toSixDigitHex(props.designTextureColor) || "#888888"} onChange={(e) => props.setDesignTextureColor(e.target.value)} style={{ width: 28, height: 28, padding: 0, border: "1px solid #333", borderRadius: 4, cursor: "pointer" }} />
              <input type="text" value={props.designTextureColor} onChange={(e) => { const raw = e.target.value.trim(); if (!raw) { props.setDesignTextureColor(""); return; } const n = toSixDigitHex(raw); props.setDesignTextureColor(n || raw); }} placeholder="#888888" style={{ width: 82, fontSize: 12 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Logo (image)</label>
            <input type="file" accept="image/*" onChange={(e) => props.setDesignLogoFile(e.target.files?.[0] ?? null)} style={{ display: "block", marginTop: 4, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Logo position</label>
            <select value={props.designLogoPosition} onChange={(e) => props.setDesignLogoPosition(e.target.value as "left" | "center" | "right")} style={{ display: "block", marginTop: 4, minWidth: 100 }}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          {props.designLogoFile && (
            <div>
              <label style={{ fontSize: 12, opacity: 0.9 }}>Logo size (height): {props.designLogoSize}px</label>
              <input type="range" min={8} max={52} value={props.designLogoSize} onChange={(e) => props.setDesignLogoSize(Number(e.target.value))} style={{ display: "block", marginTop: 4, width: 120 }} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <canvas ref={props.tileDesignCanvasRef} width={TILE_DESIGN_W} height={TILE_DESIGN_H} style={{ display: "block", maxWidth: "100%", width: 400, height: (400 / TILE_DESIGN_W) * TILE_DESIGN_H, border: "1px solid #333", borderRadius: 8, background: "#0f1115" }} />
        </div>
        <button type="button" disabled={!hasAuth || !props.tileCreatorKey.trim() || props.designGenerating} onClick={async () => {
          const canvas = props.tileDesignCanvasRef.current;
          if (!canvas || !hasAuth || !props.tileCreatorKey.trim()) return;
          props.setDesignGenerating(true);
          props.setTileStatus("Generating and uploading...");
          try {
          const drawFn = props.drawTileDesignCanvas;
          if (typeof drawFn !== "function") return;
          drawFn(canvas, { textureId: props.designTextureId, textureColor: props.designTextureColor, logoImage: props.designLogoImage, logoPosition: props.designLogoPosition, logoSize: props.designLogoSize });
          const blob = await new Promise<Blob | null>((resolve) => { canvas.toBlob((b) => resolve(b), "image/png", 1); });
          if (!blob) { props.setTileStatus("Failed to generate image."); return; }
          const form = new FormData();
          form.set("file", blob, "tile.png");
          form.set("fit_mode", "cover");
          form.set("creator_key", props.tileCreatorKey);
          const res = await fetch("/api/creator-tiles/upload", { method: "POST", headers: authHeaders(props), body: form });
          const json = await res.json();
          if (!res.ok) { props.setTileStatus(json.error || "Upload failed."); return; }
          props.setTileBannerUrl(json.publicUrl || "");
          if (props.designLogoFile) {
            props.setTileStatus("Uploading logo...");
            const logoForm = new FormData();
            logoForm.set("file", props.designLogoFile);
            logoForm.set("creator_key", props.tileCreatorKey);
            const logoRes = await fetch("/api/creator-tiles/upload-logo", { method: "POST", headers: authHeaders(props), body: logoForm });
            const logoJson = await logoRes.json();
            if (logoRes.ok && logoJson.publicUrl) props.setTileLogoUrl(logoJson.publicUrl);
          }
          props.setTileStatus("Tile design set as banner. Click \"Save tile\" to persist.");
        } catch { props.setTileStatus("Upload failed."); }
        finally { props.setDesignGenerating(false); }
        }} style={{ marginTop: 10, padding: "8px 14px", borderRadius: 6, border: "1px solid #333", background: "#1f2937", color: "white", fontWeight: 600, cursor: "pointer" }}>
          {props.designGenerating ? "Generating..." : "Generate &amp; set as banner"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Zoom
          <input type="range" min="80" max="140" value={props.tileZoom} onChange={(e) => props.setTileZoom(Number(e.target.value))} />
          <span style={{ opacity: 0.7 }}>{props.tileZoom}%</span>
        </label>
        <select value={props.tilePosition} onChange={(e) => props.setTilePosition(e.target.value)}>
          <option value="left top">left top</option>
          <option value="left center">left center</option>
          <option value="left bottom">left bottom</option>
          <option value="center top">center top</option>
          <option value="center center">center center</option>
          <option value="center bottom">center bottom</option>
          <option value="right top">right top</option>
          <option value="right center">right center</option>
          <option value="right bottom">right bottom</option>
        </select>
        <span style={{ opacity: 0.7, fontSize: 12 }}>Drag the preview to crop</span>
        <span style={{ opacity: 0.7, fontSize: 12 }}>Tile size: 1000×52 (auto-format)</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !hasAuth || !props.tileCreatorKey.trim()) return;
          props.setTileUploading(true);
          props.setTileStatus("Uploading and formatting image...");
          const form = new FormData();
          form.set("file", file);
          form.set("fit_mode", props.tileFitMode);
          form.set("creator_key", props.tileCreatorKey);
          try {
            const res = await fetch("/api/creator-tiles/upload", { method: "POST", headers: authHeaders(props), body: form });
            const json = await res.json();
            if (!res.ok) props.setTileStatus(json.error || "Upload failed.");
            else { props.setTileBannerUrl(json.publicUrl || ""); props.setTileStatus("Image uploaded."); }
          } catch { props.setTileStatus("Upload failed."); }
          finally { props.setTileUploading(false); }
        }} />
        {props.tileUploading && <div>Uploading...</div>}
      </div>

      <div style={{ border: "1px solid #1f2937", borderRadius: 12, padding: 14, backgroundColor: "#0f1115", backgroundImage: props.tileBannerUrl ? `url("${props.tileBannerUrl}")` : "", backgroundRepeat: props.tileBannerUrl ? "no-repeat" : undefined, backgroundPosition: props.tileBannerUrl ? props.tilePosition : undefined, backgroundSize: props.tileZoom === 100 ? (props.tileFitMode === "contain" ? "contain" : "cover") : `${props.tileZoom}% auto`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div
          ref={props.tilePreviewRef}
          onMouseDown={(e) => {
            if (!props.tileBannerUrl) return;
            if (props.tileResizing) return;
            props.setTileDragging(true);
            props.tileDragStart.current = { x: e.clientX, y: e.clientY };
            props.tilePosStart.current = { x: props.tilePosX, y: props.tilePosY };
          }}
          onMouseLeave={() => {
            if (props.tileDragging) {
              props.setTileDragging(false);
              props.tileDragStart.current = null;
              props.tilePosStart.current = null;
            }
          }}
          style={{ flex: 1, height: 52, minHeight: 52, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.35)", backgroundColor: "transparent", position: "relative", cursor: props.tileBannerUrl ? "grab" : "default", overflow: "visible" }}
        />
        {props.tileButtonLabel && props.tileButtonUrl && (
          <div style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,200,160,0.7)", color: "#fff", fontWeight: 700, fontSize: 12, background: "linear-gradient(90deg, rgba(255,130,60,0.9), rgba(255,175,70,0.9))", boxShadow: "0 0 10px rgba(255,140,80,0.45), 0 0 0 1px rgba(255,200,160,0.4) inset" }}>
            {props.tileButtonLabel}
          </div>
        )}
        <span style={{ opacity: 0.7, fontSize: 12 }}>28 MLOs</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={async () => {
          if (!hasAuth || !props.tileCreatorKey.trim()) return;
          props.setTileSaving(true);
          props.setTileStatus("Saving...");
          try {
            const res = await fetch("/api/creator-tiles", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(props) }, body: JSON.stringify({ creator_key: props.tileCreatorKey, banner_url: props.tileBannerUrl || null, logo_url: props.tileLogoUrl || null, fit_mode: props.tileFitMode, zoom: props.tileZoom, position: props.tilePosition, button_label: props.tileButtonLabel || null, button_url: props.tileButtonUrl || null, tile_border_glow: props.tileBorderGlow, tile_border_glow_color: props.tileBorderGlow ? props.tileBorderGlowColor : null, verified_creator: props.tileVerifiedCreator, partnership: props.tilePartnership, creator_discord_invite: props.tileDiscordInvite.trim() || null, creator_description: props.tileDescription.trim() || null, creator_website_url: props.tileWebsiteUrl.trim() || null }) });
            const json = await res.json();
            if (!res.ok) props.setTileStatus(json.error || "Save failed.");
            else { props.setTileStatus("Saved."); props.loadCreatorTiles(); }
          } catch { props.setTileStatus("Save failed."); }
          finally { props.setTileSaving(false); }
        }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #333", background: "#1f2937", color: "white", fontWeight: 600, cursor: "pointer" }}>
          {props.tileSaving ? "Saving..." : "Save tile"}
        </button>
        <button onClick={async () => {
          if (!hasAuth || !props.tileCreatorKey.trim()) return;
          if (!confirm("Delete this creator tile?")) return;
          props.setTileDeleting(true);
          props.setTileStatus("Deleting...");
          try {
            const res = await fetch(`/api/creator-tiles?creator_key=${encodeURIComponent(props.tileCreatorKey)}`, { method: "DELETE", headers: authHeaders(props) });
            const json = await res.json();
            if (!res.ok) props.setTileStatus(json.error || "Delete failed.");
            else { props.setTileStatus("Deleted."); props.loadCreatorTiles(); }
          } catch { props.setTileStatus("Delete failed."); }
          finally { props.setTileDeleting(false); }
        }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #7f1d1d", background: "#7f1d1d", color: "white", fontWeight: 600, cursor: "pointer" }}>
          {props.tileDeleting ? "Deleting..." : "Delete tile"}
        </button>
        {props.tileStatus && (
          <div style={{ opacity: 0.7, alignSelf: "center" }}>{props.tileStatus}</div>
        )}
      </div>
    </div>
  );
}
