"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import MloFormMulti from "../components/MloFormMulti";
import CoordinateSearch from "../components/CoordinateSearch";
import EmojiPickerDropdown from "../components/EmojiPickerDropdown";
import { CATEGORIES } from "../lib/categories";
import { BANNER_FONTS } from "../lib/bannerFonts";
import Sidebar from "../components/Sidebar";
import AdminLogin from "../components/AdminLogin";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

const TILE_DESIGN_W = 1000;
const TILE_DESIGN_H = 52;

/** Normalize to #rrggbb for color input (only accepts 7-char hex). */
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
const TILE_TEXTURES: { id: string; name: string; draw: TextureDraw }[] = [
  {
    id: "dark",
    name: "Dark gradient",
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#0f1115");
      g.addColorStop(0.5, "#1a1f26");
      g.addColorStop(1, "#0f1115");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "blue",
    name: "Blue mesh",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0c1222";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(30,58,138,0.25)");
      g.addColorStop(0.5, "rgba(59,130,246,0.15)");
      g.addColorStop(1, "rgba(30,58,138,0.25)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#111318";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
  {
    id: "warm",
    name: "Warm gradient",
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#1c1917");
      g.addColorStop(0.5, "#292524");
      g.addColorStop(1, "#1c1917");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "solid",
    name: "Solid dark",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0f1115";
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "solid_plain",
    name: "Solid",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "diagonal",
    name: "Diagonal stripes",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(99,102,241,0.12)";
      ctx.lineWidth = 2;
      for (let i = -h * 2; i <= w + h * 2; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, -10);
        ctx.lineTo(i + h * 2, h + 10);
        ctx.stroke();
      }
    },
  },
  {
    id: "dots",
    name: "Dot grid",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0d0d12";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(148,163,184,0.15)";
      const step = 18;
      for (let x = step; x < w; x += step) {
        for (let y = step; y < h; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    id: "vignette",
    name: "Vignette",
    draw: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, "#1e293b");
      g.addColorStop(0.5, "#0f172a");
      g.addColorStop(1, "#020617");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "neon",
    name: "Neon edge",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(34,211,238,0.2)");
      g.addColorStop(0.15, "transparent");
      g.addColorStop(0.85, "transparent");
      g.addColorStop(1, "rgba(34,211,238,0.2)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createLinearGradient(0, 0, w, 0);
      g2.addColorStop(0, "rgba(34,211,238,0.25)");
      g2.addColorStop(0.02, "transparent");
      g2.addColorStop(0.98, "transparent");
      g2.addColorStop(1, "rgba(34,211,238,0.25)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#061006";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(34,197,94,0.2)";
      ctx.lineWidth = 1;
      const grid = 40;
      for (let x = 0; x <= w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(34,197,94,0.35)";
      for (let x = grid; x < w; x += grid * 2) {
        for (let y = grid; y < h; y += grid * 2) {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1c1917");
      g.addColorStop(0.3, "#451a03");
      g.addColorStop(0.6, "#7c2d12");
      g.addColorStop(1, "#0c0a09");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "noir",
    name: "Noir (grain)",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);
      const step = 8;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const n = (x * 7 + y * 13) % 31;
          if (n < 3) {
            ctx.fillStyle = `rgba(255,255,255,${0.02 + (n / 31) * 0.05})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    },
  },
  {
    id: "waves",
    name: "Waves",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0c0e14";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(100,116,139,0.18)";
      ctx.lineWidth = 1;
      for (let y = 0; y <= h + 20; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * 4) * 4);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "hex",
    name: "Hexagons",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(71,85,105,0.25)";
      ctx.lineWidth = 1;
      const r = 14;
      const dx = r * Math.sqrt(3);
      for (let row = 0; row < 4; row++) {
        for (let col = -1; col < w / dx + 2; col++) {
          const cx = col * dx + (row % 2) * (dx / 2);
          const cy = row * (r * 1.5) + r;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    },
  },
  {
    id: "radar",
    name: "Radar",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = "rgba(34,211,238,0.15)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 8; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (Math.min(w, h) / 2) * (i / 8), 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 400, cy + Math.sin(a) * 25);
        ctx.stroke();
      }
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#021a0d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(34,197,94,0.12)";
      ctx.font = "10px monospace";
      const cols = Math.floor(w / 14);
      for (let c = 0; c < cols; c++) {
        const n = (c * 17) % 10;
        const x = c * 14 + 4;
        const y = (n / 10) * h + 8;
        ctx.fillText("1", x, y);
        ctx.fillText("0", x, y + 18);
        ctx.globalAlpha = 0.5;
        ctx.fillText(String(n), x, y + 36);
        ctx.globalAlpha = 1;
      }
    },
  },
  {
    id: "marble",
    name: "Marble",
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1c1917");
      g.addColorStop(0.2, "#292524");
      g.addColorStop(0.4, "#3f3f46");
      g.addColorStop(0.6, "#27272a");
      g.addColorStop(0.8, "#18181b");
      g.addColorStop(1, "#0c0a09");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const y = (i / 30) * h + ((i * 7) % 5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (i % 3) * 2);
        ctx.stroke();
      }
    },
  },
  {
    id: "rust",
    name: "Rust",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(120,53,15,0.4)";
      ctx.fillRect(0, 0, w * 0.4, h);
      ctx.fillStyle = "rgba(68,36,14,0.35)";
      ctx.fillRect(w * 0.5, 0, w * 0.5, h);
      ctx.strokeStyle = "rgba(180,83,9,0.2)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 15; i++) {
        const x = (i / 15) * w + (i * 11) % 20;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 30, h);
        ctx.stroke();
      }
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.2, "rgba(34,197,94,0.2)");
      g.addColorStop(0.4, "rgba(6,182,212,0.25)");
      g.addColorStop(0.6, "rgba(34,197,94,0.2)");
      g.addColorStop(0.8, "rgba(16,185,129,0.15)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createLinearGradient(0, h, 0, 0);
      g2.addColorStop(0, "rgba(6,182,212,0.15)");
      g2.addColorStop(0.5, "transparent");
      g2.addColorStop(1, "rgba(34,211,238,0.1)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "stars",
    name: "Stars",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 60; i++) {
        const x = (i * 137) % w;
        const y = (i * 89) % h;
        const r = (i % 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 25; i++) {
        const x = (i * 211) % w;
        const y = (i * 163) % h;
        ctx.beginPath();
        ctx.arc(x, y, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "topo",
    name: "Topographic",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0f1419";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(100,116,139,0.2)";
      ctx.lineWidth = 1;
      for (let level = 0; level < 12; level++) {
        const baseY = (level / 12) * h * 1.2 - 5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = baseY + Math.sin((x / w) * Math.PI * 3) * 6 + (level % 2) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
];

export default function AdminPage() {
  const { t } = useLanguage();
  // ----------------------------
  // STATE
  // ----------------------------
  const [mlos, setMlos] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [searchPoint, setSearchPoint] =
    useState<{ x: number; y: number } | null>(null);

  const [selectedMloId, setSelectedMloId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [creatorTiles, setCreatorTiles] = useState<any[]>([]);
  const [tileCreatorKey, setTileCreatorKey] = useState("");
  const [tileBannerUrl, setTileBannerUrl] = useState("");
  const [tileLogoUrl, setTileLogoUrl] = useState("");
  const [tileFitMode, setTileFitMode] = useState<"cover" | "contain">("cover");
  const [tileButtonLabel, setTileButtonLabel] = useState("");
  const [tileButtonUrl, setTileButtonUrl] = useState("");
  const [tileBorderGlow, setTileBorderGlow] = useState(false);
  const [tileBorderGlowColor, setTileBorderGlowColor] = useState("#c7ff4a");
  const [tileZoom, setTileZoom] = useState(100);
  const [tilePosition, setTilePosition] = useState("left center");
  const [tilePosX, setTilePosX] = useState(50);
  const [tilePosY, setTilePosY] = useState(50);
  const [tileDragging, setTileDragging] = useState(false);
  const [tileResizing, setTileResizing] = useState(false);
  const tileDragStart = useRef<{ x: number; y: number } | null>(null);
  const tilePosStart = useRef<{ x: number; y: number } | null>(null);
  const tileResizeStart = useRef<{ x: number; y: number; zoom: number } | null>(
    null
  );
  const tilePreviewRef = useRef<HTMLDivElement | null>(null);
  const [tileStatus, setTileStatus] = useState("");
  const [tileUploading, setTileUploading] = useState(false);
  const [tileSaving, setTileSaving] = useState(false);
  const [tileDeleting, setTileDeleting] = useState(false);
  const [showCreatorTiles, setShowCreatorTiles] = useState(false);
  const [showEditMlos, setShowEditMlos] = useState(false);
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerFontFamily, setBannerFontFamily] = useState("");
  const [bannerTitleFontSize, setBannerTitleFontSize] = useState("");
  const [bannerSubtitleFontSize, setBannerSubtitleFontSize] = useState("");
  const [bannerTitleFontWeight, setBannerTitleFontWeight] = useState("");
  const [bannerLetterSpacing, setBannerLetterSpacing] = useState("");
  const [bannerSubtitleColor, setBannerSubtitleColor] = useState("");
  const [bannerTitleFontColor, setBannerTitleFontColor] = useState("");
  const [bannerBackgroundColor, setBannerBackgroundColor] = useState("");
  const [bannerBorderColor, setBannerBorderColor] = useState("");
  const [bannerAnimation, setBannerAnimation] = useState("");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [editMloSearch, setEditMloSearch] = useState("");
  const [editMloSelectedIds, setEditMloSelectedIds] = useState<Set<string>>(new Set());
  const [editingMloId, setEditingMloId] = useState<string | null>(null);
  const [editMloForm, setEditMloForm] = useState<{
    name: string;
    creator: string;
    website_url: string;
    category: string;
    tag: string;
    x: string;
    y: string;
  } | null>(null);
  const [editMloSaving, setEditMloSaving] = useState(false);
  const [showCreatorSpotlight, setShowCreatorSpotlight] = useState(false);
  const [spotlightLogoSize, setSpotlightLogoSize] = useState<Record<string, number>>({});
  const [spotlightSaving, setSpotlightSaving] = useState<string | null>(null);
  const [spotlightUploading, setSpotlightUploading] = useState<string | null>(null);
  const [spotlightLogoUrlOverride, setSpotlightLogoUrlOverride] = useState<Record<string, string>>({});

  const [showLiveChats, setShowLiveChats] = useState(false);
  const [chatThreads, setChatThreads] = useState<Array<{ id: string; name: string; email: string; created_at: string }>>([]);
  const [selectedChatThreadId, setSelectedChatThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; content: string; from_visitor: boolean; created_at: string }>>([]);
  const [chatReplyInput, setChatReplyInput] = useState("");
  const [chatReplySending, setChatReplySending] = useState(false);

  const [designTextureId, setDesignTextureId] = useState("dark");
  const [designTextureColor, setDesignTextureColor] = useState("");
  const [designLogoFile, setDesignLogoFile] = useState<File | null>(null);
  const [designLogoObjectUrl, setDesignLogoObjectUrl] = useState<string | null>(null);
  const [designLogoImage, setDesignLogoImage] = useState<HTMLImageElement | null>(null);
  const [designLogoPosition, setDesignLogoPosition] = useState<"left" | "center" | "right">("left");
  const [designLogoSize, setDesignLogoSize] = useState(40);
  const [designGenerating, setDesignGenerating] = useState(false);
  const tileDesignCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ----------------------------
  // CHECK ADMIN LOGIN (SUPABASE AUTH)
  // ----------------------------
  useEffect(() => {
    let active = true;
    getSupabaseBrowser().auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || null);
      setAccessToken(data.session?.access_token ?? null);
    });
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAccessToken(nextSession?.access_token ?? null);
      }
    );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setIsAdmin(false);
      setAuthError("");
      setCheckingAuth(false);
      return;
    }

    setCheckingAuth(true);
    fetch("/api/admin/me", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const message =
            payload?.error ||
            "Not authorized. Check ADMIN_EMAILS in .env.local.";
          setAuthError(message);
          setIsAdmin(false);
          return;
        }
        setAuthError("");
        setIsAdmin(true);
      })
      .catch(() => {
        setAuthError("Unable to verify admin access.");
        setIsAdmin(false);
      })
      .finally(() => setCheckingAuth(false));
  }, [session]);

  // ----------------------------
  // LOAD MLOS FROM API
  // ----------------------------
  async function loadMlos() {
    const res = await fetch("/api/mlo", { cache: "no-store" });
    const json = await res.json();
    setMlos(json.mlos || []);
  }

  async function loadRequests() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    const json = await res.json();
    setRequests(json.requests || []);
  }

  async function loadCreatorTiles() {
    const res = await fetch("/api/creator-tiles", { cache: "no-store" });
    const json = await res.json();
    setCreatorTiles(json.tiles || []);
  }

  async function loadBanner() {
    const res = await fetch("/api/site-banner", { cache: "no-store" });
    const json = await res.json();
    setBannerTitle(json.title ?? "");
    setBannerSubtitle(json.subtitle ?? "");
    setBannerFontFamily(json.font_family ?? "");
    setBannerTitleFontSize(json.title_font_size != null ? String(json.title_font_size) : "");
    setBannerSubtitleFontSize(json.subtitle_font_size != null ? String(json.subtitle_font_size) : "");
    setBannerTitleFontWeight(json.title_font_weight ?? "");
    setBannerLetterSpacing(json.letter_spacing ?? "");
    setBannerSubtitleColor(json.subtitle_color ?? "");
    setBannerTitleFontColor(json.title_font_color ?? "");
    setBannerBackgroundColor(json.background_color ?? "");
    setBannerBorderColor(json.border_color ?? "");
    setBannerAnimation(json.animation ?? "");
  }

  async function loadChatThreads() {
    if (!accessToken) return;
    const res = await fetch("/api/chat/threads", { headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json();
    setChatThreads(json.threads || []);
  }

  async function loadChatMessages(threadId: string) {
    const res = await fetch(`/api/chat?threadId=${threadId}`);
    const json = await res.json();
    setChatMessages(json.messages || []);
  }

  async function sendChatReply() {
    if (!selectedChatThreadId || !chatReplyInput.trim() || !accessToken) return;
    setChatReplySending(true);
    const res = await fetch("/api/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ threadId: selectedChatThreadId, message: chatReplyInput.trim() }),
    });
    setChatReplySending(false);
    if (res.ok) {
      setChatReplyInput("");
      loadChatMessages(selectedChatThreadId);
    }
  }

  async function refreshAll() {
    await Promise.all([loadMlos(), loadRequests(), loadCreatorTiles(), loadBanner(), loadChatThreads()]);
    setLastRefreshAt(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (selectedChatThreadId) loadChatMessages(selectedChatThreadId);
  }, [selectedChatThreadId]);

  useEffect(() => {
    const key = tileCreatorKey.trim().toLowerCase();
    if (!key) {
      setTileBannerUrl("");
      setTileLogoUrl("");
      setTileFitMode("cover");
      setTileButtonLabel("");
      setTileButtonUrl("");
      setTileBorderGlow(false);
      setTileBorderGlowColor("#c7ff4a");
      setTileZoom(100);
      setTilePosition("left center");
      setTilePosX(50);
      setTilePosY(50);
      setTileStatus("");
      return;
    }
    const existing = creatorTiles.find(
      (tile) => String(tile.creator_key || "").toLowerCase() === key
    );
    if (existing) {
      setTileBannerUrl(existing.banner_url || "");
      setTileLogoUrl(existing.logo_url || "");
      setTileFitMode("cover");
      setTileButtonLabel(existing.button_label || "");
      setTileButtonUrl(existing.button_url || "");
      setTileBorderGlow(Boolean(existing.tile_border_glow));
      setTileBorderGlowColor(
        existing.tile_border_glow_color && /^#[0-9A-Fa-f]{3,8}$/.test(String(existing.tile_border_glow_color))
          ? String(existing.tile_border_glow_color)
          : "#c7ff4a"
      );
      setTileZoom(
        Number.isFinite(Number(existing.zoom)) ? Number(existing.zoom) : 100
      );
      const positionText = String(existing.position || "50% 50%");
      const [posXRaw, posYRaw] = positionText.split(" ");
      const parsedX = Number(String(posXRaw || "").replace("%", ""));
      const parsedY = Number(String(posYRaw || "").replace("%", ""));
      const nextX = Number.isFinite(parsedX) ? parsedX : 50;
      const nextY = Number.isFinite(parsedY) ? parsedY : 50;
      setTilePosX(Math.min(Math.max(nextX, 0), 100));
      setTilePosY(Math.min(Math.max(nextY, 0), 100));
      setTilePosition(`${nextX}% ${nextY}%`);
      setTileStatus("Loaded existing tile settings.");
    } else {
      setTileBannerUrl("");
      setTileLogoUrl("");
      setTileFitMode("cover");
      setTileButtonLabel("");
      setTileButtonUrl("");
      setTileBorderGlow(false);
      setTileBorderGlowColor("#c7ff4a");
      setTileZoom(100);
      setTilePosition("left center");
      setTilePosX(50);
      setTilePosY(50);
      setTileStatus("No tile found for this creator.");
    }
  }, [tileCreatorKey, creatorTiles]);

  useEffect(() => {
    if (!designLogoFile) {
      setDesignLogoObjectUrl(null);
      setDesignLogoImage(null);
      return;
    }
    const url = URL.createObjectURL(designLogoFile);
    setDesignLogoObjectUrl(url);
    const img = new Image();
    img.onload = () => {
      setDesignLogoImage(img);
    };
    img.onerror = () => {
      setDesignLogoImage(null);
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [designLogoFile]);

  function drawTileDesignCanvas(
    canvas: HTMLCanvasElement,
    opts: {
      textureId: string;
      textureColor: string;
      logoImage: HTMLImageElement | null;
      logoPosition: "left" | "center" | "right";
      logoSize: number;
    }
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = TILE_DESIGN_W;
    const h = TILE_DESIGN_H;
    const texture = TILE_TEXTURES.find((t) => t.id === opts.textureId) ?? TILE_TEXTURES[0];
    const tintHex = toSixDigitHex(opts.textureColor);
    const isSolidColor = opts.textureId === "solid" || opts.textureId === "solid_plain";

    if (isSolidColor) {
      ctx.fillStyle = tintHex || (opts.textureId === "solid" ? "#0f1115" : "#ffffff");
      ctx.fillRect(0, 0, w, h);
    } else {
      texture.draw(ctx, w, h);
      if (tintHex) {
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = tintHex;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }
    if (opts.logoImage && opts.logoImage.complete && opts.logoImage.naturalWidth) {
      const maxH = Math.min(52, Math.max(8, opts.logoSize));
      const maxW = w - 48;
      const scale = Math.min(maxH / opts.logoImage.height, maxW / opts.logoImage.width);
      const actualW = opts.logoImage.width * scale;
      const actualH = opts.logoImage.height * scale;
      const y = (h - actualH) / 2;
      let x = 24;
      if (opts.logoPosition === "center") x = (w - actualW) / 2;
      else if (opts.logoPosition === "right") x = w - 24 - actualW;
      ctx.drawImage(opts.logoImage, x, y, actualW, actualH);
    }
  }

  useEffect(() => {
    const canvas = tileDesignCanvasRef.current;
    if (!canvas) return;
    drawTileDesignCanvas(canvas, {
      textureId: designTextureId,
      textureColor: designTextureColor,
      logoImage: designLogoImage,
      logoPosition: designLogoPosition,
      logoSize: designLogoSize,
    });
  }, [designTextureId, designTextureColor, designLogoImage, designLogoPosition, designLogoSize]);

  useEffect(() => {
    if (!tileDragging && !tileResizing) return;
    function onMove(event: MouseEvent) {
      const preview = tilePreviewRef.current;
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      if (tileResizing) {
        if (!tileResizeStart.current) return;
        const deltaX = event.clientX - tileResizeStart.current.x;
        const deltaY = event.clientY - tileResizeStart.current.y;
        const scaleDelta =
          Math.max(deltaX / rect.width, deltaY / rect.height) * 100;
        const nextZoom = Math.min(
          Math.max(tileResizeStart.current.zoom + scaleDelta, 80),
          140
        );
        setTileZoom(Math.round(nextZoom));
        return;
      }
      if (!tileDragStart.current || !tilePosStart.current) return;
      const deltaX = event.clientX - tileDragStart.current.x;
      const deltaY = event.clientY - tileDragStart.current.y;
      const nextX = tilePosStart.current.x + (deltaX / rect.width) * 100;
      const nextY = tilePosStart.current.y + (deltaY / rect.height) * 100;
      const clampedX = Math.min(Math.max(nextX, 0), 100);
      const clampedY = Math.min(Math.max(nextY, 0), 100);
      setTilePosX(clampedX);
      setTilePosY(clampedY);
      setTilePosition(`${clampedX.toFixed(2)}% ${clampedY.toFixed(2)}%`);
    }
    function onUp() {
      setTileDragging(false);
      setTileResizing(false);
      tileDragStart.current = null;
      tilePosStart.current = null;
      tileResizeStart.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [tileDragging]);

  // ----------------------------
  // LOGOUT
  // ----------------------------
  function logout() {
    getSupabaseBrowser().auth.signOut();
    setIsAdmin(false);
    setAuthError("");
  }

  async function deleteAllMlos() {
    if (!confirm("Delete ALL MLOs? This cannot be undone.")) return;
    const res = await fetch("/api/mlo?all=true", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      loadMlos();
      setSelectedMloId(null);
      setIsSidebarOpen(false);
      const json = await res.json();
      alert(`Deleted ${json.count ?? 0} MLO(s).`);
    } else {
      const text = await res.text();
      alert(`Delete failed: ${text}`);
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm("Delete this request?")) return;
    const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      loadRequests();
    }
  }



  // ----------------------------
  // BLOCK RENDER WHILE CHECKING AUTH
  // ----------------------------
  if (checkingAuth) {
    return (
      <main
        className="home-root"
        style={{
          minHeight: "100vh",
          color: "white",
          position: "relative",
          overflow: "hidden",
          padding: 40,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background:
              '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div className="header-logo-float">
          <img src="/mlomesh-logo.png" alt="MLOMesh logo" className="header-logo" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>Loading…</div>
      </main>
    );
  }

  // ----------------------------
  // LOGIN GATE
  // ----------------------------
  if (!isAdmin) {
    return (
      <main
        className="home-root"
        style={{
          minHeight: "100vh",
          color: "white",
          position: "relative",
          overflow: "hidden",
          padding: 40,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background:
              '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div className="header-logo-float">
          <img src="/mlomesh-logo.png" alt="MLOMesh logo" className="header-logo" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <AdminLogin onLogin={() => setCheckingAuth(true)} />
          {authError && (
            <div style={{ marginTop: 10, color: "#ef4444" }}>{authError}</div>
          )}
        </div>
      </main>
    );
  }

  // ----------------------------
  // ADMIN PAGE
  // ----------------------------
  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
      <div className="header-logo-float">
        <img src="/mlomesh-logo.png" alt="MLOMesh logo" className="header-logo" />
      </div>
      <header
        className="site-header"
        style={{
          padding: "12px 16px",
          backgroundColor: "#10162b",
          backgroundImage: 'url("/header-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          color: "white",
        }}
      >
        <div className="header-top">
          <div className="header-brand">
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
              MLOMESH
            </div>
          </div>
          <div className="header-actions">
            <span className="header-pill">
              Discord
            </span>
            <LanguageSelect />
            
          </div>
        </div>
        <nav className="header-nav">
          <a href="/" className="header-link">
            {t("nav.home")}
          </a>
          <a href="/map" className="header-link">
            {t("nav.map")}
          </a>
          <a href="/about" className="header-link">
            {t("nav.about")}
          </a>
          <a href="/creators" className="header-link">
            {t("nav.creators")}
          </a>
          <a href="/requests" className="header-link">
            {t("nav.requests")}
          </a>
          <a href="/submit" className="header-link">
            {t("nav.submit")}
          </a>
        </nav>
      </header>
      <div style={{ padding: 20 }}>
        <h1>{t("admin.title")}</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button
          onClick={refreshAll}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1f2937",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("admin.refreshAll")}
        </button>
        <button
          onClick={() => {
            setSelectedMloId(null);
            setIsSidebarOpen(false);
          }}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #333",
            background: "#0b0b0b",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("admin.clearSelection")}
        </button>
        {lastRefreshAt && (
          <div style={{ opacity: 0.65, fontSize: 12, alignSelf: "center" }}>
            {t("admin.lastRefresh", { time: lastRefreshAt })}
          </div>
        )}
      </div>

      <button
        onClick={logout}
        style={{
          marginBottom: 12,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #333",
          background: "#ef4444",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t("admin.logout")}
      </button>
      <button
        onClick={deleteAllMlos}
        style={{
          marginBottom: 12,
          marginLeft: 8,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #333",
          background: "#7f1d1d",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t("admin.deleteAll")}
      </button>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showControls ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>{t("admin.controls")}</div>
          <button onClick={() => setShowControls((v) => !v)}>
            {showControls
              ? `${t("admin.hide")} ▲`
              : `${t("admin.show")} ▼`}
          </button>
        </div>

        {showControls && (
          <>
            <div style={{ marginBottom: 8 }}>
              {coords
                ? t("admin.coords.display", {
                    x: coords.x,
                    y: coords.y,
                  })
                : t("admin.coords.placeholder")}
            </div>

            <CoordinateSearch onSearch={setSearchPoint} />

            <MloFormMulti
              coords={coords}
              onCreated={loadMlos}
              adminToken={accessToken || ""}
              mlos={mlos}
            />

          </>
        )}
      </div>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showStatusBanner ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>{t("admin.editStatusBanner")}</div>
          <button onClick={() => setShowStatusBanner((v) => !v)}>
            {showStatusBanner ? `${t("admin.hide")} ▲` : `${t("admin.show")} ▼`}
          </button>
        </div>
        {showStatusBanner && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.titleLabel")}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  placeholder={t("admin.banner.titlePlaceholder")}
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: "100%", maxWidth: 340, flex: 1, minWidth: 200 }}
                />
                <EmojiPickerDropdown onEmojiSelect={(emoji) => setBannerTitle((v) => v + emoji)} label="😀" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.subtitleLabel")}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  placeholder={t("admin.banner.subtitlePlaceholder")}
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: "100%", maxWidth: 340, flex: 1, minWidth: 200 }}
                />
                <EmojiPickerDropdown onEmojiSelect={(emoji) => setBannerSubtitle((v) => v + emoji)} label="😀" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.fontFamily")}</div>
                <select
                  value={bannerFontFamily}
                  onChange={(e) => setBannerFontFamily(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, minWidth: 160 }}
                >
                  {BANNER_FONTS.map((f) => (
                    <option key={f.value || "default"} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.titleFontSize")}</div>
                <input
                  type="number"
                  placeholder="32"
                  value={bannerTitleFontSize}
                  onChange={(e) => setBannerTitleFontSize(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: 72 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.subtitleFontSize")}</div>
                <input
                  type="number"
                  placeholder="20"
                  value={bannerSubtitleFontSize}
                  onChange={(e) => setBannerSubtitleFontSize(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: 72 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.fontWeight")}</div>
                <input
                  placeholder="900"
                  value={bannerTitleFontWeight}
                  onChange={(e) => setBannerTitleFontWeight(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: 72 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.letterSpacing")}</div>
                <input
                  placeholder="0.8px"
                  value={bannerLetterSpacing}
                  onChange={(e) => setBannerLetterSpacing(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13, width: 90 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.titleColor")}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="color"
                    value={bannerTitleFontColor || "#ffffff"}
                    onChange={(e) => setBannerTitleFontColor(e.target.value)}
                    style={{ width: 36, height: 28, padding: 0, cursor: "pointer" }}
                  />
                  <input
                    value={bannerTitleFontColor}
                    onChange={(e) => setBannerTitleFontColor(e.target.value)}
                    placeholder="#ffffff"
                    style={{ padding: "6px 8px", fontSize: 12, width: 90 }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.subtitleColor")}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="color"
                    value={bannerSubtitleColor || "#fde68a"}
                    onChange={(e) => setBannerSubtitleColor(e.target.value)}
                    style={{ width: 36, height: 28, padding: 0, cursor: "pointer" }}
                  />
                  <input
                    value={bannerSubtitleColor}
                    onChange={(e) => setBannerSubtitleColor(e.target.value)}
                    placeholder="#fde68a"
                    style={{ padding: "6px 8px", fontSize: 12, width: 90 }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.backgroundColor")}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="color"
                    value={bannerBackgroundColor || "#1e293b"}
                    onChange={(e) => setBannerBackgroundColor(e.target.value)}
                    style={{ width: 36, height: 28, padding: 0, cursor: "pointer" }}
                  />
                  <input
                    value={bannerBackgroundColor}
                    onChange={(e) => setBannerBackgroundColor(e.target.value)}
                    placeholder={t("admin.banner.backgroundColorPlaceholder")}
                    style={{ padding: "6px 8px", fontSize: 12, width: 110 }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.borderColor")}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="color"
                    value={bannerBorderColor || "#fbbf24"}
                    onChange={(e) => setBannerBorderColor(e.target.value)}
                    style={{ width: 36, height: 28, padding: 0, cursor: "pointer" }}
                  />
                  <input
                    value={bannerBorderColor}
                    onChange={(e) => setBannerBorderColor(e.target.value)}
                    placeholder="#fbbf24"
                    style={{ padding: "6px 8px", fontSize: 12, width: 90 }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{t("admin.banner.animation")}</div>
                <select
                  value={bannerAnimation || "flash"}
                  onChange={(e) => setBannerAnimation(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: 12, minWidth: 100 }}
                >
                  <option value="none">{t("admin.banner.animationNone")}</option>
                  <option value="flash">{t("admin.banner.animationFlash")}</option>
                  <option value="pulse">{t("admin.banner.animationPulse")}</option>
                  <option value="fade">{t("admin.banner.animationFade")}</option>
                </select>
              </div>
            </div>
            <button
              disabled={bannerSaving}
              onClick={async () => {
                if (!accessToken) return;
                setBannerSaving(true);
                const titleSize = bannerTitleFontSize.trim() ? Number(bannerTitleFontSize) : null;
                const subtitleSize = bannerSubtitleFontSize.trim() ? Number(bannerSubtitleFontSize) : null;
                const res = await fetch("/api/site-banner", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    title: bannerTitle.trim() || null,
                    subtitle: bannerSubtitle.trim() || null,
                    font_family: bannerFontFamily.trim() || null,
                    title_font_size: titleSize,
                    subtitle_font_size: subtitleSize,
                    title_font_weight: bannerTitleFontWeight.trim() || null,
                    letter_spacing: bannerLetterSpacing.trim() || null,
                    subtitle_color: bannerSubtitleColor.trim() || null,
                    title_font_color: bannerTitleFontColor.trim() || null,
                    background_color: bannerBackgroundColor.trim() || null,
                    border_color: bannerBorderColor.trim() || null,
                    animation: bannerAnimation.trim() || null,
                  }),
                });
                setBannerSaving(false);
                if (res.ok) loadBanner();
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              {bannerSaving ? "..." : t("admin.saveBanner")}
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showLiveChats ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>Live Chats</div>
          <button onClick={() => setShowLiveChats((v) => !v)}>
            {showLiveChats ? `${t("admin.hide")} ▲` : `${t("admin.show")} ▼`}
          </button>
        </div>
        {showLiveChats && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 200, maxWidth: 320 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Threads</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
                {chatThreads.length === 0 && (
                  <div style={{ opacity: 0.7, fontSize: 13 }}>No live chats yet.</div>
                )}
                {chatThreads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedChatThreadId(t.id)}
                    style={{
                      padding: 10,
                      textAlign: "left",
                      background: selectedChatThreadId === t.id ? "#1e293b" : "#0f172a",
                      border: `1px solid ${selectedChatThreadId === t.id ? "#334155" : "#243046"}`,
                      borderRadius: 8,
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{t.email}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              {selectedChatThreadId ? (
                <>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Messages</div>
                  <div
                    style={{
                      border: "1px solid #243046",
                      borderRadius: 10,
                      padding: 12,
                      background: "#0f172a",
                      maxHeight: 240,
                      overflowY: "auto",
                      marginBottom: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {chatMessages.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: m.from_visitor ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          padding: "8px 12px",
                          borderRadius: m.from_visitor ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                          background: m.from_visitor ? "rgba(34, 211, 238, 0.15)" : "#1e293b",
                          fontSize: 13,
                          color: "#e5e7eb",
                        }}
                      >
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="Type your reply..."
                      value={chatReplyInput}
                      onChange={(e) => setChatReplyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChatReply())}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: 13,
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#e5e7eb",
                      }}
                    />
                    <button
                      onClick={sendChatReply}
                      disabled={chatReplySending || !chatReplyInput.trim()}
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        background: "#22d3ee",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {chatReplySending ? "..." : "Reply"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ opacity: 0.7, fontSize: 13 }}>Select a thread to view and reply.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showEditMlos ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>{t("admin.editMlos")}</div>
          <button onClick={() => setShowEditMlos((v) => !v)}>
            {showEditMlos ? `${t("admin.hide")} ▲` : `${t("admin.show")} ▼`}
          </button>
        </div>
        {showEditMlos && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder={t("admin.searchMlos")}
              value={editMloSearch}
              onChange={(e) => setEditMloSearch(e.target.value)}
              style={{ padding: "8px 10px", fontSize: 13, maxWidth: 280 }}
            />
            {(() => {
              const filtered = (mlos || []).filter((m) => {
                const q = editMloSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  (m.name || "").toLowerCase().includes(q) ||
                  (m.creator || "").toLowerCase().includes(q) ||
                  (m.category || "").toLowerCase().includes(q)
                );
              });
              const allSelected = filtered.length > 0 && filtered.every((m) => editMloSelectedIds.has(m.id));
              const someSelected = filtered.some((m) => editMloSelectedIds.has(m.id));
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() =>
                      setEditMloSelectedIds(allSelected ? new Set() : new Set(filtered.map((m) => m.id)))
                    }
                    style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {allSelected ? t("admin.deselectAll") : t("admin.selectAll")}
                  </button>
                  {someSelected && (
                    <button
                      onClick={async () => {
                        const ids = Array.from(editMloSelectedIds);
                        if (!ids.length || !confirm(t("admin.deleteSelected") + ` (${ids.length})?`)) return;
                        if (!accessToken) return;
                        await fetch(`/api/mlo?ids=${encodeURIComponent(ids.join(","))}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        setEditMloSelectedIds(new Set());
                        setEditingMloId(null);
                        setEditMloForm(null);
                        loadMlos();
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        background: "#7f1d1d",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      {t("admin.deleteSelected")} ({editMloSelectedIds.size})
                    </button>
                  )}
                </div>
              );
            })()}
            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 6,
              }}
            >
              {(mlos || [])
                .filter((m) => {
                  const q = editMloSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (m.name || "").toLowerCase().includes(q) ||
                    (m.creator || "").toLowerCase().includes(q) ||
                    (m.category || "").toLowerCase().includes(q)
                  );
                })
                .map((mlo) => (
                  <div
                    key={mlo.id}
                    style={{
                      padding: "8px 10px",
                      marginBottom: 4,
                      borderRadius: 6,
                      background: editingMloId === mlo.id ? "#1e293b" : "#111827",
                      border: editingMloId === mlo.id ? "1px solid #3b82f6" : "1px solid transparent",
                    }}
                  >
                    {editingMloId === mlo.id && editMloForm ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          placeholder="Name"
                          value={editMloForm.name}
                          onChange={(e) =>
                            setEditMloForm((f) => f ? { ...f, name: e.target.value } : f)
                          }
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        />
                        <input
                          placeholder="Creator"
                          value={editMloForm.creator}
                          onChange={(e) =>
                            setEditMloForm((f) => f ? { ...f, creator: e.target.value } : f)
                          }
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        />
                        <input
                          placeholder="Website URL"
                          value={editMloForm.website_url}
                          onChange={(e) =>
                            setEditMloForm((f) => f ? { ...f, website_url: e.target.value } : f)
                          }
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        />
                        <select
                          value={editMloForm.category}
                          onChange={(e) =>
                            setEditMloForm((f) => f ? { ...f, category: e.target.value } : f)
                          }
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.icon} {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Tag"
                          value={editMloForm.tag}
                          onChange={(e) =>
                            setEditMloForm((f) => f ? { ...f, tag: e.target.value } : f)
                          }
                          style={{ padding: "6px 8px", fontSize: 12 }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            placeholder="X"
                            value={editMloForm.x}
                            onChange={(e) =>
                              setEditMloForm((f) => f ? { ...f, x: e.target.value } : f)
                            }
                            style={{ padding: "6px 8px", fontSize: 12, width: 70 }}
                          />
                          <input
                            placeholder="Y"
                            value={editMloForm.y}
                            onChange={(e) =>
                              setEditMloForm((f) => f ? { ...f, y: e.target.value } : f)
                            }
                            style={{ padding: "6px 8px", fontSize: 12, width: 70 }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            disabled={editMloSaving}
                            onClick={async () => {
                              if (!editMloForm || !editingMloId || !accessToken) return;
                              const xNum = Number(editMloForm.x);
                              const yNum = Number(editMloForm.y);
                              if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) return;
                              setEditMloSaving(true);
                              const res = await fetch("/api/mlo", {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${accessToken}`,
                                },
                                body: JSON.stringify({
                                  id: editingMloId,
                                  name: editMloForm.name.trim(),
                                  creator: editMloForm.creator.trim(),
                                  website_url: editMloForm.website_url.trim() || null,
                                  category: editMloForm.category,
                                  tag: editMloForm.tag.trim() || null,
                                  x: xNum,
                                  y: yNum,
                                }),
                              });
                              setEditMloSaving(false);
                              if (res.ok) {
                                setEditingMloId(null);
                                setEditMloForm(null);
                                loadMlos();
                              }
                            }}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            {editMloSaving ? "..." : t("admin.saveMlo")}
                          </button>
                          <button
                            onClick={() => {
                              setEditingMloId(null);
                              setEditMloForm(null);
                            }}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              background: "#374151",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            {t("admin.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editMloSelectedIds.has(mlo.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditMloSelectedIds((s) => new Set([...s, mlo.id]));
                            } else {
                              setEditMloSelectedIds((s) => {
                                const next = new Set(s);
                                next.delete(mlo.id);
                                return next;
                              });
                            }
                          }}
                          style={{ cursor: "pointer", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {mlo.name || "Unnamed"}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>
                            {mlo.creator} · {mlo.category}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => {
                              setEditingMloId(mlo.id);
                              setEditMloForm({
                                name: mlo.name || "",
                                creator: mlo.creator || "",
                                website_url: mlo.website_url || "",
                                category: mlo.category || "police",
                                tag: mlo.tag || "",
                                x: Number.isFinite(Number(mlo.x)) ? String(mlo.x) : "",
                                y: Number.isFinite(Number(mlo.y)) ? String(mlo.y) : "",
                              });
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              background: "#1e3a5f",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            {t("admin.editMlo")}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete "${mlo.name || "this MLO"}"?`)) return;
                              if (!accessToken) return;
                              await fetch(`/api/mlo?id=${encodeURIComponent(mlo.id)}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${accessToken}` },
                              });
                              setEditingMloId(null);
                              setEditMloForm(null);
                              loadMlos();
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              background: "#7f1d1d",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            {t("admin.deleteMlo")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              {(mlos || []).filter((m) => {
                const q = editMloSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  (m.name || "").toLowerCase().includes(q) ||
                  (m.creator || "").toLowerCase().includes(q) ||
                  (m.category || "").toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div style={{ padding: 16, opacity: 0.7, fontSize: 13 }}>
                  {t("admin.noMlos")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showCreatorTiles ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>Creator Tiles</div>
          <button onClick={() => setShowCreatorTiles((v) => !v)}>
            {showCreatorTiles ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        {showCreatorTiles && <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={tileCreatorKey}
              onChange={(e) => setTileCreatorKey(e.target.value)}
              style={{ minWidth: 260 }}
            >
              <option value="">Select creator key</option>
              {Array.from(
                new Set(
                  mlos
                    .map((m) => String(m.creator || "").trim())
                    .filter(Boolean)
                )
              )
                .sort((a, b) => a.localeCompare(b))
                .map((creator) => {
                  const key = creator.toLowerCase();
                  return (
                    <option key={key} value={key}>
                      {creator}
                    </option>
                  );
                })}
            </select>
            <select value="cover" onChange={() => null} disabled>
              <option value="cover">cover (crop)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Button label (optional)"
              value={tileButtonLabel}
              onChange={(e) => setTileButtonLabel(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <input
              placeholder="Button URL (optional)"
              value={tileButtonUrl}
              onChange={(e) => setTileButtonUrl(e.target.value)}
              style={{ minWidth: 320 }}
            />
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: -4, marginBottom: 4 }}>
            Button label + URL appear on this creator’s tile on the <a href="/creators" target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>/creators</a> page (e.g. “Visit Store” → store link). Both must be set for the button to show. Click “Save tile” below to save.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={tileBorderGlow}
                onChange={(e) => setTileBorderGlow(e.target.checked)}
              />
              <span>Tile border glow (outline the card, not the image)</span>
            </label>
            {tileBorderGlow && (
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.9 }}>Glow color:</span>
                <input
                  type="color"
                  value={tileBorderGlowColor}
                  onChange={(e) => setTileBorderGlowColor(e.target.value)}
                  style={{ width: 32, height: 28, padding: 0, border: "1px solid #333", borderRadius: 4, cursor: "pointer" }}
                />
                <input
                  type="text"
                  value={tileBorderGlowColor}
                  onChange={(e) => setTileBorderGlowColor(e.target.value)}
                  style={{ width: 90, fontSize: 12 }}
                  placeholder="#c7ff4a"
                />
              </label>
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #1f2937",
              borderRadius: 10,
              backgroundColor: "#0b0b0b",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              Design tile (1000×52) — texture + logo → set as banner
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <label style={{ fontSize: 12, opacity: 0.9 }}>Background texture</label>
                <select
                  value={designTextureId}
                  onChange={(e) => setDesignTextureId(e.target.value)}
                  style={{ display: "block", marginTop: 4, minWidth: 140 }}
                >
                  {TILE_TEXTURES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.9 }}>Texture color (tint)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <input
                    type="color"
                    value={toSixDigitHex(designTextureColor) || "#888888"}
                    onChange={(e) => setDesignTextureColor(e.target.value)}
                    onInput={(e) => setDesignTextureColor((e.target as HTMLInputElement).value)}
                    style={{ width: 28, height: 28, padding: 0, border: "1px solid #333", borderRadius: 4, cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={designTextureColor}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        setDesignTextureColor("");
                        return;
                      }
                      const normalized = toSixDigitHex(raw);
                      setDesignTextureColor(normalized || raw);
                    }}
                    placeholder="#888888"
                    style={{ width: 82, fontSize: 12 }}
                  />
                  {designTextureColor && (
                    <button
                      type="button"
                      onClick={() => setDesignTextureColor("")}
                      style={{ fontSize: 11, padding: "2px 6px" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.9 }}>Logo (image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDesignLogoFile(e.target.files?.[0] ?? null)}
                  style={{ display: "block", marginTop: 4, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.9 }}>Logo position</label>
                <select
                  value={designLogoPosition}
                  onChange={(e) =>
                    setDesignLogoPosition(e.target.value as "left" | "center" | "right")
                  }
                  style={{ display: "block", marginTop: 4, minWidth: 100 }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              {designLogoFile && (
                <div>
                  <label style={{ fontSize: 12, opacity: 0.9 }}>
                    Logo size (height): {designLogoSize}px
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={52}
                    value={designLogoSize}
                    onChange={(e) => setDesignLogoSize(Number(e.target.value))}
                    style={{ display: "block", marginTop: 4, width: 120 }}
                  />
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <canvas
                ref={tileDesignCanvasRef}
                width={TILE_DESIGN_W}
                height={TILE_DESIGN_H}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  width: 400,
                  height: (400 / TILE_DESIGN_W) * TILE_DESIGN_H,
                  border: "1px solid #333",
                  borderRadius: 8,
                  background: "#0f1115",
                }}
              />
            </div>
            <button
              type="button"
              disabled={
                !accessToken ||
                !tileCreatorKey.trim() ||
                designGenerating
              }
              onClick={async () => {
                const canvas = tileDesignCanvasRef.current;
                if (!canvas || !accessToken || !tileCreatorKey.trim()) return;
                setDesignGenerating(true);
                setTileStatus("Generating and uploading...");
                try {
                  drawTileDesignCanvas(canvas, {
                    textureId: designTextureId,
                    textureColor: designTextureColor,
                    logoImage: designLogoImage,
                    logoPosition: designLogoPosition,
                    logoSize: designLogoSize,
                  });
                  const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob((b) => resolve(b), "image/png", 1);
                  });
                  if (!blob) {
                    setTileStatus("Failed to generate image.");
                    return;
                  }
                  const form = new FormData();
                  form.set("file", blob, "tile.png");
                  form.set("fit_mode", "cover");
                  form.set("creator_key", tileCreatorKey);
                  const res = await fetch("/api/creator-tiles/upload", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: form,
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setTileStatus(json.error || "Upload failed.");
                    return;
                  }
                  setTileBannerUrl(json.publicUrl || "");
                  if (designLogoFile) {
                    setTileStatus("Uploading logo...");
                    const logoForm = new FormData();
                    logoForm.set("file", designLogoFile);
                    logoForm.set("creator_key", tileCreatorKey);
                    const logoRes = await fetch("/api/creator-tiles/upload-logo", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${accessToken}` },
                      body: logoForm,
                    });
                    const logoJson = await logoRes.json();
                    if (logoRes.ok && logoJson.publicUrl) {
                      setTileLogoUrl(logoJson.publicUrl);
                    }
                  }
                  setTileStatus("Tile design set as banner. Click “Save tile” to persist.");
                } catch (err) {
                  setTileStatus("Upload failed.");
                } finally {
                  setDesignGenerating(false);
                }
              }}
              style={{
                marginTop: 10,
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid #333",
                background: "#1f2937",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {designGenerating ? "Generating…" : "Generate & set as banner"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Zoom
              <input
                type="range"
                min="80"
                max="140"
                value={tileZoom}
                onChange={(e) => setTileZoom(Number(e.target.value))}
              />
              <span style={{ opacity: 0.7 }}>{tileZoom}%</span>
            </label>
            <select
              value={tilePosition}
              onChange={(e) => setTilePosition(e.target.value)}
            >
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
            <span style={{ opacity: 0.7, fontSize: 12 }}>
              Drag the preview to crop
            </span>
            <span style={{ opacity: 0.7, fontSize: 12 }}>
              Tile size: 1000×52 (auto-format)
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !accessToken || !tileCreatorKey.trim()) return;
                setTileUploading(true);
                setTileStatus("Uploading and formatting image...");
                const form = new FormData();
                form.set("file", file);
                form.set("fit_mode", tileFitMode);
                form.set("creator_key", tileCreatorKey);
                try {
                  const res = await fetch("/api/creator-tiles/upload", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: form,
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setTileStatus(json.error || "Upload failed.");
                  } else {
                    setTileBannerUrl(json.publicUrl || "");
                    setTileStatus("Image uploaded.");
                  }
                } catch (err) {
                  setTileStatus("Upload failed.");
                } finally {
                  setTileUploading(false);
                }
              }}
            />
            {tileUploading && <div>Uploading...</div>}
          </div>

          <div
            style={{
              border: "1px solid #1f2937",
              borderRadius: 12,
              padding: 14,
              backgroundColor: "#0f1115",
              backgroundImage: tileBannerUrl ? `url("${tileBannerUrl}")` : "",
              backgroundRepeat: tileBannerUrl ? "no-repeat" : undefined,
              backgroundPosition: tileBannerUrl ? tilePosition : undefined,
              backgroundSize:
                tileZoom === 100
                  ? tileFitMode === "contain"
                    ? "contain"
                    : "cover"
                  : `${tileZoom}% auto`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 52,
                minHeight: 52,
                borderRadius: 8,
                border: "1px dashed rgba(255,255,255,0.35)",
                backgroundColor: "transparent",
                position: "relative",
                cursor: tileBannerUrl ? "grab" : "default",
                overflow: "visible",
              }}
              ref={tilePreviewRef}
              onMouseDown={(event) => {
                if (!tileBannerUrl) return;
                if (tileResizing) return;
                setTileDragging(true);
                tileDragStart.current = {
                  x: event.clientX,
                  y: event.clientY,
                };
                tilePosStart.current = { x: tilePosX, y: tilePosY };
              }}
              onMouseLeave={() => {
                if (tileDragging) {
                  setTileDragging(false);
                  tileDragStart.current = null;
                  tilePosStart.current = null;
                }
              }}
            >
            </div>
            {tileButtonLabel && tileButtonUrl && (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,200,160,0.7)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  background:
                    "linear-gradient(90deg, rgba(255,130,60,0.9), rgba(255,175,70,0.9))",
                  boxShadow:
                    "0 0 10px rgba(255,140,80,0.45), 0 0 0 1px rgba(255,200,160,0.4) inset",
                }}
              >
                {tileButtonLabel}
              </div>
            )}
            <span style={{ opacity: 0.7, fontSize: 12 }}>28 MLOs</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                if (!accessToken || !tileCreatorKey.trim()) return;
                setTileSaving(true);
                setTileStatus("Saving...");
                try {
                  const res = await fetch("/api/creator-tiles", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                      creator_key: tileCreatorKey,
                      banner_url: tileBannerUrl || null,
                      logo_url: tileLogoUrl || null,
                      fit_mode: tileFitMode,
                      zoom: tileZoom,
                      position: tilePosition,
                      button_label: tileButtonLabel || null,
                      button_url: tileButtonUrl || null,
                      tile_border_glow: tileBorderGlow,
                      tile_border_glow_color: tileBorderGlow ? tileBorderGlowColor : null,
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setTileStatus(json.error || "Save failed.");
                  } else {
                    setTileStatus("Saved.");
                    loadCreatorTiles();
                  }
                } catch (err) {
                  setTileStatus("Save failed.");
                } finally {
                  setTileSaving(false);
                }
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #333",
                background: "#1f2937",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tileSaving ? "Saving..." : "Save tile"}
            </button>
            <button
              onClick={async () => {
                if (!accessToken || !tileCreatorKey.trim()) return;
                if (!confirm("Delete this creator tile?")) return;
                setTileDeleting(true);
                setTileStatus("Deleting...");
                try {
                  const res = await fetch(
                    `/api/creator-tiles?creator_key=${encodeURIComponent(
                      tileCreatorKey
                    )}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );
                  const json = await res.json();
                  if (!res.ok) {
                    setTileStatus(json.error || "Delete failed.");
                  } else {
                    setTileStatus("Deleted.");
                    loadCreatorTiles();
                  }
                } catch (err) {
                  setTileStatus("Delete failed.");
                } finally {
                  setTileDeleting(false);
                }
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #7f1d1d",
                background: "#7f1d1d",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tileDeleting ? "Deleting..." : "Delete tile"}
            </button>
            {tileStatus && (
              <div style={{ opacity: 0.7, alignSelf: "center" }}>
                {tileStatus}
              </div>
            )}
          </div>
        </div>}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #243046",
          borderRadius: 10,
          padding: 12,
          background: "#10162b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showCreatorSpotlight ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>Creator Spotlight (homepage)</div>
          <button type="button" onClick={() => setShowCreatorSpotlight((v) => !v)}>
            {showCreatorSpotlight ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        {showCreatorSpotlight && (
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
            These are the creators shown in the spotlight on the homepage (same order: by MLO count). Add a logo and adjust size; the card shows logo + MLO count only (no border on logo).
            <div style={{ marginTop: 6, padding: "6px 8px", background: "#0f1528", borderRadius: 6, border: "1px solid #1f2937" }}>
              <strong>Recommended logo size:</strong> 400×400 px (square). Logos are scaled automatically; you can adjust display size with the slider below.
            </div>
          </div>
        )}
        {showCreatorSpotlight && (() => {
          const countByKey: Record<string, number> = {};
          const nameByKey: Record<string, string> = {};
          const mlosList = Array.isArray(mlos) ? mlos : [];
          for (const mlo of mlosList) {
            const key = (mlo.creator || "").trim().toLowerCase();
            if (!key) continue;
            countByKey[key] = (countByKey[key] || 0) + 1;
            if (!(key in nameByKey)) nameByKey[key] = (mlo.creator || "").trim();
          }
          const tilesByKey: Record<string, { logo_url?: string | null; spotlight_logo_size?: number | null }> = {};
          for (const t of creatorTiles || []) {
            if (!t.creator_key) continue;
            const k = String(t.creator_key).trim().toLowerCase();
            tilesByKey[k] = {
              logo_url: (t as { logo_url?: string | null }).logo_url ?? null,
              spotlight_logo_size: (t as { spotlight_logo_size?: number | null }).spotlight_logo_size,
            };
          }
          const list = Object.keys(countByKey)
            .map((creator_key) => {
              const tile = tilesByKey[creator_key];
              const size =
                tile?.spotlight_logo_size != null && Number.isFinite(Number(tile.spotlight_logo_size))
                  ? Number(tile.spotlight_logo_size)
                  : 60;
              return {
                creator_key,
                logo_url: tile?.logo_url || null,
                spotlight_logo_size: Math.min(100, Math.max(15, size)),
                displayName: nameByKey[creator_key] || creator_key,
                count: countByKey[creator_key] || 0,
              };
            })
            .sort((a, b) => b.count - a.count);
          return (
            <div
              style={{
                display: "grid",
                gap: 12,
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: 8,
                scrollbarWidth: "thin",
              }}
            >
              {list.length === 0 && <div style={{ opacity: 0.7 }}>No creators with MLOs yet. Add MLOs first, then add logos here to feature them on the homepage.</div>}
              {list.map((creator: { creator_key: string; logo_url: string | null; spotlight_logo_size: number; displayName: string; count: number }) => {
                const size = spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size;
                const displayLogoUrl = spotlightLogoUrlOverride[creator.creator_key] || creator.logo_url;
                return (
                  <div
                    key={creator.creator_key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: 10,
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      background: "#0f1528",
                    }}
                  >
                    <div style={{ minWidth: 120, fontWeight: 600 }}>{creator.displayName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {displayLogoUrl ? (
                        <img
                          key={displayLogoUrl}
                          src={displayLogoUrl}
                          alt=""
                          style={{
                            maxHeight: 36,
                            maxWidth: 80,
                            width: "auto",
                            height: "auto",
                            minWidth: 32,
                            minHeight: 24,
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>No logo</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ fontSize: 11 }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !accessToken) return;
                          setSpotlightUploading(creator.creator_key);
                          try {
                            const form = new FormData();
                            form.set("file", file);
                            form.set("creator_key", creator.creator_key);
                            const res = await fetch("/api/creator-tiles/upload-logo", {
                              method: "POST",
                              headers: { Authorization: `Bearer ${accessToken}` },
                              body: form,
                            });
                            const json = await res.json();
                            const publicUrl = json?.publicUrl ? String(json.publicUrl).trim() : null;
                            if (res.ok && publicUrl) {
                              setSpotlightLogoUrlOverride((prev) => ({ ...prev, [creator.creator_key]: publicUrl }));
                              const defaultSize = 65;
                              const patchRes = await fetch("/api/creator-tiles", {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${accessToken}`,
                                },
                                body: JSON.stringify({
                                  creator_key: creator.creator_key,
                                  logo_url: publicUrl,
                                  spotlight_logo_size: defaultSize,
                                }),
                              });
                              if (patchRes.ok) {
                                setSpotlightLogoSize((s) => ({ ...s, [creator.creator_key]: defaultSize }));
                                await loadCreatorTiles();
                              }
                            }
                          } finally {
                            setSpotlightUploading(null);
                            e.target.value = "";
                          }
                        }}
                      />
                      {spotlightUploading === creator.creator_key && <span style={{ fontSize: 11 }}>Uploading…</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <label style={{ fontSize: 12 }}>Logo size:</label>
                      <input
                        type="range"
                        min={15}
                        max={100}
                        value={size}
                        onChange={(e) =>
                          setSpotlightLogoSize((prev) => ({ ...prev, [creator.creator_key]: Number(e.target.value) }))
                        }
                        style={{ width: 80 }}
                      />
                      <span style={{ fontSize: 12, opacity: 0.8 }}>{size}%</span>
                    </div>
                    <button
                      type="button"
                      disabled={spotlightSaving === creator.creator_key}
                      onClick={async () => {
                        if (!accessToken) return;
                        setSpotlightSaving(creator.creator_key);
                        try {
                          const res = await fetch("/api/creator-tiles", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${accessToken}`,
                            },
                            body: JSON.stringify({
                              creator_key: creator.creator_key,
                              logo_url: displayLogoUrl || undefined,
                              spotlight_logo_size: spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size,
                            }),
                          });
                          if (res.ok) {
                            await loadCreatorTiles();
                          }
                        } finally {
                          setSpotlightSaving(null);
                        }
                      }}
                      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #333", background: "#1e3a5f", color: "white", fontWeight: 600 }}
                    >
                      {spotlightSaving === creator.creator_key ? "Saving…" : "Save to spotlight"}
                    </button>
                    <button
                      type="button"
                      disabled={spotlightSaving === creator.creator_key}
                      onClick={async () => {
                        if (!accessToken) return;
                        setSpotlightSaving(creator.creator_key);
                        try {
                          const res = await fetch("/api/creator-tiles", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${accessToken}`,
                            },
                            body: JSON.stringify({
                              creator_key: creator.creator_key,
                              spotlight_logo_size: spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size,
                            }),
                          });
                          if (res.ok) loadCreatorTiles();
                        } finally {
                          setSpotlightSaving(null);
                        }
                      }}
                      style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #333", background: "#1f2937", color: "white" }}
                    >
                      Save size only
                    </button>
                    <div
                      style={{
                        marginLeft: "auto",
                        flexShrink: 0,
                        width: 140,
                        padding: 8,
                        border: "1px solid #333",
                        borderRadius: 8,
                        background: "#0f1528",
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>Preview</div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          minHeight: 52,
                          padding: 6,
                          borderRadius: 6,
                          background: "#0f1528",
                          boxSizing: "border-box",
                        }}
                      >
                        {displayLogoUrl ? (
                          <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 40 }}>
                            <img
                              key={displayLogoUrl}
                              src={displayLogoUrl}
                              alt=""
                              style={{
                                maxWidth: `${size}%`,
                                maxHeight: 40,
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, opacity: 0.8 }}>{creator.displayName}</span>
                        )}
                        <div style={{ fontSize: 10, opacity: 0.85, marginTop: 4 }}>
                          {creator.count} MLOs
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showReview ? 8 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>{t("admin.requests.title")}</div>
          <button onClick={() => setShowReview((v) => !v)}>
            {showReview ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        {showReview && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder={t("admin.requests.search")}
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                style={{ maxWidth: 260 }}
              />
              <button onClick={() => setShowRequests((v) => !v)}>
                {showRequests ? t("admin.hide") : t("admin.show")}
              </button>
            </div>
            {showRequests && (
              <div
                style={{
                  border: "1px solid #243046",
                  borderRadius: 10,
                  padding: 12,
                  background: "#10162b",
                  maxHeight: 420,
                  overflowY: "scroll",
                  overflowX: "hidden",
                }}
              >
                {requests.length === 0 && (
                  <div style={{ opacity: 0.7 }}>{t("admin.requests.empty")}</div>
                )}
                {requests
                  .filter((req: any) => {
                    if (!requestSearch.trim()) return true;
                    const query = requestSearch.toLowerCase();
                    return (
                      req.title?.toLowerCase().includes(query) ||
                      req.details?.toLowerCase().includes(query)
                    );
                  })
                  .slice(0, 200)
                  .map((req: any, idx: number, arr: any[]) => (
                    <div
                      key={req.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 0",
                        borderBottom:
                          idx === arr.length - 1 ? "none" : "1px solid #243046",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {req.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#cbd5e1",
                            marginTop: 4,
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {req.details
                            ? req.details
                            : t("admin.requests.noComment")}
                        </div>
                        {(req.x != null || req.y != null) && (
                          <div
                            style={{
                              opacity: 0.8,
                              fontSize: 11,
                              marginTop: 4,
                              color: "#94a3b8",
                            }}
                          >
                            {req.x != null ? `X: ${req.x}` : ""}{" "}
                            {req.y != null ? `Y: ${req.y}` : ""}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteRequest(req.id)}
                        style={{
                          background: "#7f1d1d",
                          border: "1px solid #7f1d1d",
                          color: "white",
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          padding: 0,
                          flexShrink: 0,
                        }}
                        aria-label={t("admin.requests.delete")}
                        title={t("admin.requests.delete")}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>


      <div style={{ height: "70vh", marginTop: 12 }}>
        <Map
          mlos={mlos}
          searchPoint={searchPoint}
          onMapClick={(pt) => {
            setCoords(pt);
            setSearchPoint(pt);
          }}
          onMloClick={(id) => {
            setSelectedMloId(id);
            setIsSidebarOpen(true);
          }}
        />
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        mlos={mlos.filter((m) => m.id === selectedMloId)}
        onRefresh={loadMlos}
        adminToken={accessToken || ""}
        selectedId={selectedMloId}
      />

      </div>
      </div>
    </main>
  );
}
