"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import MloFormMulti from "../components/MloFormMulti";
import CoordinateSearch from "../components/CoordinateSearch";
import EmojiPickerDropdown from "../components/EmojiPickerDropdown";
import CategorySelect from "../components/CategorySelect";
import { CATEGORIES, type CategoryKey } from "../lib/categories";
import { BANNER_FONTS } from "../lib/bannerFonts";
import Sidebar from "../components/Sidebar";
import AdminLogin from "../components/AdminLogin";
import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import AdminCreatorTilesGrid from "../components/AdminCreatorTilesGrid";
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
  {
    id: "crosshatch",
    name: "Crosshatch",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#08090c";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      for (let i = -h; i <= w + h; i += 14) {
        ctx.beginPath();
        ctx.moveTo(i, -5);
        ctx.lineTo(i + h, h + 5);
        ctx.stroke();
      }
      for (let i = -w; i <= h + w; i += 14) {
        ctx.beginPath();
        ctx.moveTo(-5, i);
        ctx.lineTo(w + 5, i + w);
        ctx.stroke();
      }
    },
  },
  {
    id: "bricks",
    name: "Bricks",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0b0f";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      const bw = 80;
      const bh = 14;
      for (let row = 0; row < Math.ceil(h / bh) + 1; row++) {
        for (let col = 0; col < Math.ceil(w / bw) + 1; col++) {
          const x = col * bw + (row % 2) * (bw / 2);
          ctx.strokeRect(x, row * bh, bw, bh);
        }
      }
    },
  },
  {
    id: "noise_grid",
    name: "Noise grid",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0a0d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      const step = 12;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          if ((x + y) % (step * 2) === 0) ctx.fillRect(x, y, step / 2, step / 2);
          else if ((x * 3 + y) % (step * 3) === 0) ctx.fillRect(x + step / 4, y, step / 3, step / 3);
        }
      }
    },
  },
  {
    id: "chevron",
    name: "Chevron",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#090a0e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      const seg = 24;
      for (let row = -1; row < h / seg + 2; row++) {
        for (let col = -1; col < w / seg + 2; col++) {
          const x = col * seg + (row % 2) * (seg / 2);
          ctx.beginPath();
          ctx.moveTo(x, row * seg);
          ctx.lineTo(x + seg / 2, row * seg + seg / 2);
          ctx.lineTo(x + seg, row * seg);
          ctx.lineTo(x + seg / 2, row * seg - seg / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
  },
  {
    id: "scanlines",
    name: "Scanlines",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0c0d10";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,255,255,0.06)");
      g.addColorStop(0.5, "transparent");
      g.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "concentric",
    name: "Concentric circles",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      for (let r = 8; r < Math.max(w, h); r += 16) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  },
  {
    id: "honeycomb",
    name: "Honeycomb fill",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#070809";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      const r = 10;
      const dx = r * 1.732;
      for (let row = 0; row < 8; row++) {
        for (let col = -1; col < w / (dx / 2) + 2; col++) {
          const cx = col * (dx / 2) + (row % 2) * (dx / 4);
          const cy = row * r * 1.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            const x = cx + r * 0.8 * Math.cos(a);
            const y = cy + r * 0.8 * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    },
  },
  {
    id: "stripe_diag",
    name: "Diagonal stripes",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#08090d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.11)";
      const step = 20;
      for (let i = -w - h; i <= w + h; i += step * 2) {
        ctx.beginPath();
        ctx.moveTo(i, -5);
        ctx.lineTo(i + step, h + 5);
        ctx.lineTo(i + step * 2, h + 5);
        ctx.lineTo(i + step * 3, -5);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
  {
    id: "subtle_mesh",
    name: "Subtle mesh",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0b0f";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let x = step; x < w; x += step * 2) {
        for (let y = step; y < h; y += step * 2) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    id: "lightning",
    name: "Lightning streaks",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#040507";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const seed = i * 97;
        ctx.beginPath();
        let x = (seed % w);
        let y = 0;
        ctx.moveTo(x, y);
        for (let step = 0; step < 15; step++) {
          x += ((seed + step * 7) % 17) - 8;
          y += 4;
          ctx.lineTo(Math.max(0, Math.min(w, x)), Math.min(h, y));
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "plaid",
    name: "Plaid",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0b0c10";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      const bw = 40;
      const bh = 16;
      for (let x = 0; x <= w; x += bw) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += bh) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      for (let x = bw / 2; x <= w; x += bw) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = bh / 2; y <= h; y += bh) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
  {
    id: "wave_grid",
    name: "Wave grid",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#08090c";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const baseY = (i / 8) * h * 1.2 - 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = baseY + Math.sin((x / w) * Math.PI * 6) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let x = 0; x <= w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y <= h; y += 6) {
          ctx.lineTo(x + Math.sin((y / h) * Math.PI * 4) * 4, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "scatter",
    name: "Scatter dots",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#07080a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      const coords: [number, number][] = [];
      for (let i = 0; i < 120; i++) {
        coords.push([(i * 73) % w, (i * 127) % h]);
      }
      coords.sort((a, b) => a[0] - b[0]);
      for (const [x, y] of coords) {
        const r = 0.8 + (x + y) % 3 * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "shimmer",
    name: "Shimmer",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#060709";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.2, "rgba(255,255,255,0.08)");
      g.addColorStop(0.4, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.12)");
      g.addColorStop(0.6, "rgba(255,255,255,0)");
      g.addColorStop(0.8, "rgba(255,255,255,0.06)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "squares_fade",
    name: "Fading squares",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, w, h);
      const size = 28;
      for (let x = 0; x < w; x += size) {
        for (let y = 0; y < h; y += size) {
          const d = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
          const alpha = Math.max(0, 0.15 - (d / Math.max(w, h)) * 0.12);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        }
      }
    },
  },
  {
    id: "triangle",
    name: "Triangles",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#08090d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      const s = 22;
      for (let row = -1; row < h / (s * 0.866) + 2; row++) {
        for (let col = -1; col < w / s + 2; col++) {
          const x = col * s + (row % 2) * (s / 2);
          const y = row * s * 0.866;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + s / 2, y + s * 0.866);
          ctx.lineTo(x + s, y);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
  },
  {
    id: "gradient_blend",
    name: "Blended gradient",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#0a0b0f";
      ctx.fillRect(0, 0, w, h);
      const g1 = ctx.createLinearGradient(0, 0, w, 0);
      g1.addColorStop(0, "rgba(255,255,255,0)");
      g1.addColorStop(0.3, "rgba(255,255,255,0.1)");
      g1.addColorStop(0.7, "rgba(255,255,255,0.08)");
      g1.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createLinearGradient(0, 0, 0, h);
      g2.addColorStop(0, "rgba(255,255,255,0.05)");
      g2.addColorStop(0.5, "transparent");
      g2.addColorStop(1, "rgba(255,255,255,0.06)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "sparkle",
    name: "Sparkle",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#060708";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 35; i++) {
        const x = (i * 157) % w;
        const y = (i * 89) % h;
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x + 2, y);
        ctx.lineTo(x, y + 2);
        ctx.lineTo(x - 2, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 50; i++) {
        const x = (i * 97) % w;
        const y = (i * 131) % h;
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "zigzag",
    name: "Zigzag",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#07080b";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      const amp = 8;
      const freq = 16;
      for (let row = 0; row < 6; row++) {
        const baseY = (row / 6) * h;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= w; x += freq) {
          const y = baseY + (Math.floor(x / freq) % 2 ? amp : -amp);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: "panel_lines",
    name: "Panel lines",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#08090c";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.11)";
      ctx.lineWidth = 1;
      const pw = w / 5;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pw, 0);
        ctx.lineTo(i * pw, h);
        ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (h / 4));
        ctx.lineTo(w, i * (h / 4));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 4; row++) {
          ctx.fillRect(col * pw + 2, row * (h / 4) + 2, pw - 4, h / 4 - 4);
        }
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
  const [servers, setServers] = useState<any[]>([]);
  const [showServers, setShowServers] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [serverSyncDiscordLoading, setServerSyncDiscordLoading] = useState(false);
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
  const [tileDiscordInvite, setTileDiscordInvite] = useState("");
  const [tileDescription, setTileDescription] = useState("");
  const [tileWebsiteUrl, setTileWebsiteUrl] = useState("");
  const [tileDiscordSaving, setTileDiscordSaving] = useState(false);
  const [tileBorderGlow, setTileBorderGlow] = useState(false);
  const [tileBorderGlowColor, setTileBorderGlowColor] = useState("#c7ff4a");
  const [tileVerifiedCreator, setTileVerifiedCreator] = useState(false);
  const [tilePartnership, setTilePartnership] = useState(false);
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
  const [showReorderTiles, setShowReorderTiles] = useState(true);
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
  const [spotlightVerifiedCreator, setSpotlightVerifiedCreator] = useState<Record<string, boolean>>({});
  const [spotlightPartnership, setSpotlightPartnership] = useState<Record<string, boolean>>({});

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

  const adminDevSecret =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? sessionStorage.getItem("adminDevSecret") || undefined
      : undefined;
  const hasAuth = Boolean(accessToken) || Boolean(adminDevSecret);
  function authHeaders(): Record<string, string> {
    if (accessToken) return { Authorization: `Bearer ${accessToken}` };
    if (adminDevSecret) return { "X-Admin-Dev-Secret": adminDevSecret };
    return {};
  }

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
    const devSecret =
      typeof window !== "undefined"
        ? sessionStorage.getItem("adminDevSecret")
        : null;
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // Dev bypass: try dev secret first when on localhost
    if (isLocalhost && devSecret) {
      setCheckingAuth(true);
      fetch("/api/admin/me", {
        headers: { "X-Admin-Dev-Secret": devSecret },
      })
        .then(async (res) => {
          if (res.ok) {
            setAuthError("");
            setIsAdmin(true);
          } else {
            sessionStorage.removeItem("adminDevSecret");
            setIsAdmin(false);
          }
        })
        .catch(() => setIsAdmin(false))
        .finally(() => setCheckingAuth(false));
      return;
    }

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

  async function loadServers() {
    try {
      const res = await fetch("/api/servers", { cache: "no-store" });
      const json = await res.json();
      setServers(json.servers || []);
    } catch {
      setServers([]);
    }
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
    if (!hasAuth) return;
    const res = await fetch("/api/chat/threads", { headers: authHeaders() });
    const json = await res.json();
    setChatThreads(json.threads || []);
  }

  async function loadChatMessages(threadId: string) {
    const res = await fetch(`/api/chat?threadId=${threadId}`);
    const json = await res.json();
    setChatMessages(json.messages || []);
  }

  async function sendChatReply() {
    if (!selectedChatThreadId || !chatReplyInput.trim() || !hasAuth) return;
    setChatReplySending(true);
    const res = await fetch("/api/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ threadId: selectedChatThreadId, message: chatReplyInput.trim() }),
    });
    setChatReplySending(false);
    if (res.ok) {
      setChatReplyInput("");
      loadChatMessages(selectedChatThreadId);
    }
  }

  async function refreshAll() {
    await Promise.all([loadMlos(), loadRequests(), loadServers(), loadCreatorTiles(), loadBanner(), loadChatThreads()]);
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
      setTileDiscordInvite("");
      setTileDescription("");
      setTileBorderGlow(false);
      setTileBorderGlowColor("#c7ff4a");
      setTileVerifiedCreator(false);
      setTilePartnership(false);
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
      setTileDiscordInvite((existing as { creator_discord_invite?: string }).creator_discord_invite || "");
      setTileDescription((existing as { creator_description?: string }).creator_description || "");
      setTileWebsiteUrl((existing as { creator_website_url?: string }).creator_website_url || existing.button_url || "");
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
      setTileVerifiedCreator(Boolean((existing as { verified_creator?: boolean }).verified_creator));
      setTilePartnership(Boolean((existing as { partnership?: boolean }).partnership));
      setTileStatus("Loaded existing tile settings.");
    } else {
      setTileBannerUrl("");
      setTileLogoUrl("");
      setTileFitMode("cover");
      setTileButtonLabel("");
      setTileButtonUrl("");
      setTileDiscordInvite("");
      setTileDescription("");
      setTileBorderGlow(false);
      setTileBorderGlowColor("#c7ff4a");
      setTileVerifiedCreator(false);
      setTilePartnership(false);
      setTileZoom(100);
      setTilePosition("left center");
      setTilePosX(50);
      setTilePosY(50);
      setTileWebsiteUrl("");
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
      headers: authHeaders(),
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
      headers: authHeaders(),
    });

    if (res.ok) {
      loadRequests();
    }
  }

  async function syncServersToDiscord() {
    if (!hasAuth) return;
    setServerSyncDiscordLoading(true);
    try {
      const res = await fetch("/api/servers/sync-discord", {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(json.message || `Synced ${json.synced ?? 0} servers to Discord.`);
        loadServers();
      } else {
        alert(json.error || "Sync failed.");
      }
    } finally {
      setServerSyncDiscordLoading(false);
    }
  }

  async function deleteServer(id: string) {
    if (!confirm("Delete this FiveM server?")) return;
    const res = await fetch(`/api/servers/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) {
      loadServers();
    } else {
      const text = await res.text();
      alert(`Delete failed: ${text}`);
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
            <LanguageSelect />
            <AuthLink />
            <DiscordLink />
            
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
          <a href="/servers" className="header-link">
            {t("nav.servers")}
          </a>
          <a href="/submit" className="header-link">
            {t("nav.submit")}
          </a>
        </nav>
      </header>
      <div style={{ padding: 20 }}>
        <h1>{t("admin.title")}</h1>
        <p style={{ marginTop: 8, marginBottom: 16, fontSize: 14, opacity: 0.9, maxWidth: 600 }}>
          Manage your map: add or edit MLOs, creator tiles, the homepage banner, and more. Use the collapsible sections below — each controls a different part of the site.
        </p>

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
        title="Sign out of admin"
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
        title="Permanently removes every MLO from the map. Use with caution."
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
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
              Add new MLOs to the map. Search coordinates, click the map to pick a spot, fill in details, then submit.
            </div>
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
              adminDevSecret={
                typeof window !== "undefined" &&
                (window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1")
                  ? sessionStorage.getItem("adminDevSecret") || undefined
                  : undefined
              }
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
          <>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            Customize the text and styling of the homepage banner (above the map).
          </div>
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
                if (!hasAuth) return;
                setBannerSaving(true);
                const titleSize = bannerTitleFontSize.trim() ? Number(bannerTitleFontSize) : null;
                const subtitleSize = bannerSubtitleFontSize.trim() ? Number(bannerSubtitleFontSize) : null;
                const res = await fetch("/api/site-banner", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
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
            marginBottom: showLiveChats ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>Live Chats</div>
          <button onClick={() => setShowLiveChats((v) => !v)}>
            {showLiveChats ? `${t("admin.hide")} ▲` : `${t("admin.show")} ▼`}
          </button>
        </div>
        {showLiveChats && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            View and reply to visitor messages from the live chat widget. Replies sync to Discord.
          </div>
        )}
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
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            Edit or delete existing MLOs on the map. Search by name, creator, or category.
          </div>
        )}
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
                        if (!hasAuth) return;
                        await fetch(`/api/mlo?ids=${encodeURIComponent(ids.join(","))}`, {
                          method: "DELETE",
                          headers: authHeaders(),
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
                        <CategorySelect
                          value={editMloForm.category as CategoryKey}
                          onChange={(v) =>
                            setEditMloForm((f) => f ? { ...f, category: v } : f)
                          }
                          useTranslation={false}
                          style={{ padding: 0 }}
                        />
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
                              if (!editMloForm || !editingMloId || !hasAuth) return;
                              const xNum = Number(editMloForm.x);
                              const yNum = Number(editMloForm.y);
                              if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) return;
                              setEditMloSaving(true);
                              const res = await fetch("/api/mlo", {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  ...authHeaders(),
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
                              if (!hasAuth) return;
                              await fetch(`/api/mlo?id=${encodeURIComponent(mlo.id)}`, {
                                method: "DELETE",
                                headers: authHeaders(),
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
        {showCreatorTiles && (
          <AdminCreatorTilesGrid
            creatorTiles={creatorTiles}
            showReorderTiles={showReorderTiles}
            setShowReorderTiles={setShowReorderTiles}
            tileCreatorKey={tileCreatorKey}
            setTileCreatorKey={setTileCreatorKey}
            tileButtonLabel={tileButtonLabel}
            setTileButtonLabel={setTileButtonLabel}
            tileButtonUrl={tileButtonUrl}
            setTileButtonUrl={setTileButtonUrl}
            tileDiscordInvite={tileDiscordInvite}
            setTileDiscordInvite={setTileDiscordInvite}
            tileDescription={tileDescription}
            setTileDescription={setTileDescription}
            tileWebsiteUrl={tileWebsiteUrl}
            setTileWebsiteUrl={setTileWebsiteUrl}
            tileDiscordSaving={tileDiscordSaving}
            setTileDiscordSaving={setTileDiscordSaving}
            tileBorderGlow={tileBorderGlow}
            setTileBorderGlow={setTileBorderGlow}
            tileBorderGlowColor={tileBorderGlowColor}
            setTileBorderGlowColor={setTileBorderGlowColor}
            tileVerifiedCreator={tileVerifiedCreator}
            setTileVerifiedCreator={setTileVerifiedCreator}
            tilePartnership={tilePartnership}
            setTilePartnership={setTilePartnership}
            designTextureId={designTextureId}
            setDesignTextureId={setDesignTextureId}
            designTextureColor={designTextureColor}
            setDesignTextureColor={setDesignTextureColor}
            designLogoFile={designLogoFile}
            setDesignLogoFile={setDesignLogoFile}
            designLogoPosition={designLogoPosition}
            setDesignLogoPosition={setDesignLogoPosition}
            designLogoSize={designLogoSize}
            setDesignLogoSize={setDesignLogoSize}
            designGenerating={designGenerating}
            setDesignGenerating={setDesignGenerating}
            tileFitMode={tileFitMode}
            setTileFitMode={setTileFitMode}
            tileZoom={tileZoom}
            setTileZoom={setTileZoom}
            tilePosition={tilePosition}
            setTilePosition={setTilePosition}
            tilePosX={tilePosX}
            setTilePosX={setTilePosX}
            tilePosY={tilePosY}
            setTilePosY={setTilePosY}
            tileDragging={tileDragging}
            setTileDragging={setTileDragging}
            tileResizing={tileResizing}
            tileBannerUrl={tileBannerUrl}
            setTileBannerUrl={setTileBannerUrl}
            tileLogoUrl={tileLogoUrl}
            setTileLogoUrl={setTileLogoUrl}
            tileUploading={tileUploading}
            setTileUploading={setTileUploading}
            tileSaving={tileSaving}
            setTileSaving={setTileSaving}
            tileDeleting={tileDeleting}
            setTileDeleting={setTileDeleting}
            tileStatus={tileStatus}
            setTileStatus={setTileStatus}
            accessToken={accessToken}
            adminDevSecret={
              typeof window !== "undefined" &&
              (window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1")
                ? sessionStorage.getItem("adminDevSecret") || undefined
                : undefined
            }
            mlos={mlos}
            loadCreatorTiles={loadCreatorTiles}
            loadMlos={loadMlos}
            drawTileDesignCanvas={drawTileDesignCanvas}
            designLogoImage={designLogoImage}
            TILE_TEXTURES={TILE_TEXTURES}
            tileDesignCanvasRef={tileDesignCanvasRef}
            tilePreviewRef={tilePreviewRef}
            tileDragStart={tileDragStart}
            tilePosStart={tilePosStart}
          />
        )}
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
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            Choose which creators appear in the spotlight on the homepage. Add logos and adjust sizes.
          </div>
        )}
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
          const tilesByKey: Record<string, { logo_url?: string | null; spotlight_logo_size?: number | null; verified_creator?: boolean; partnership?: boolean }> = {};
          for (const t of creatorTiles || []) {
            if (!t.creator_key) continue;
            const k = String(t.creator_key).trim().toLowerCase();
            const entry = {
              logo_url: (t as { logo_url?: string | null }).logo_url ?? null,
              spotlight_logo_size: (t as { spotlight_logo_size?: number | null }).spotlight_logo_size,
              verified_creator: (t as { verified_creator?: boolean }).verified_creator === true,
              partnership: (t as { partnership?: boolean }).partnership === true,
            };
            tilesByKey[k] = entry;
            tilesByKey[k.replace(/-/g, " ")] = entry;
          }
          const list = Object.keys(countByKey)
            .map((creator_key) => {
              const tile = tilesByKey[creator_key] || tilesByKey[creator_key.replace(/\s+/g, "-")];
              const size =
                tile?.spotlight_logo_size != null && Number.isFinite(Number(tile.spotlight_logo_size))
                  ? Number(tile.spotlight_logo_size)
                  : 60;
              return {
                creator_key,
                logo_url: tile?.logo_url || null,
                spotlight_logo_size: Math.min(100, Math.max(15, size)),
                verified_creator: tile?.verified_creator ?? false,
                partnership: tile?.partnership ?? false,
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
              {list.map((creator: { creator_key: string; logo_url: string | null; spotlight_logo_size: number; verified_creator: boolean; partnership: boolean; displayName: string; count: number }) => {
                const size = spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size;
                const displayLogoUrl = spotlightLogoUrlOverride[creator.creator_key] || creator.logo_url;
                const verifiedCreator = spotlightVerifiedCreator[creator.creator_key] ?? creator.verified_creator;
                const partnership = spotlightPartnership[creator.creator_key] ?? creator.partnership;
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={verifiedCreator}
                          onChange={(e) =>
                            setSpotlightVerifiedCreator((prev) => ({ ...prev, [creator.creator_key]: e.target.checked }))
                          }
                        />
                        <span>Verified</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={partnership}
                          onChange={(e) =>
                            setSpotlightPartnership((prev) => ({ ...prev, [creator.creator_key]: e.target.checked }))
                          }
                        />
                        <span>Partner</span>
                      </label>
                    </div>
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
                          if (!file || !hasAuth) return;
                          setSpotlightUploading(creator.creator_key);
                          try {
                            const form = new FormData();
                            form.set("file", file);
                            form.set("creator_key", creator.creator_key);
                            const res = await fetch("/api/creator-tiles/upload-logo", {
                              method: "POST",
                              headers: authHeaders(),
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
                                  ...authHeaders(),
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
                        if (!hasAuth) return;
                        setSpotlightSaving(creator.creator_key);
                        try {
                          const res = await fetch("/api/creator-tiles", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              ...authHeaders(),
                            },
                            body: JSON.stringify({
                              creator_key: creator.creator_key,
                              logo_url: displayLogoUrl || undefined,
                              spotlight_logo_size: spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size,
                              verified_creator: verifiedCreator,
                              partnership,
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
                        if (!hasAuth) return;
                        setSpotlightSaving(creator.creator_key);
                        try {
                          const res = await fetch("/api/creator-tiles", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              ...authHeaders(),
                            },
                            body: JSON.stringify({
                              creator_key: creator.creator_key,
                              spotlight_logo_size: spotlightLogoSize[creator.creator_key] ?? creator.spotlight_logo_size,
                              verified_creator: verifiedCreator,
                              partnership,
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
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            Review and approve MLO submission requests from visitors.
          </div>
        )}
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
            marginBottom: showServers ? 10 : 0,
          }}
        >
          <div style={{ fontWeight: 700 }}>FiveM Servers</div>
          <button onClick={() => setShowServers((v) => !v)}>
            {showServers ? `${t("admin.hide")} ▲` : `${t("admin.show")} ▼`}
          </button>
        </div>
        {showServers && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            Manage FiveM servers listed on /servers. Delete spam or inappropriate listings.
          </div>
        )}
        {showServers && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input
                placeholder="Search servers..."
                value={serverSearch}
                onChange={(e) => setServerSearch(e.target.value)}
                style={{ maxWidth: 260 }}
              />
              <button
                onClick={syncServersToDiscord}
                disabled={serverSyncDiscordLoading || servers.length === 0}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  background: "#1e3a5f",
                  color: "white",
                  border: "1px solid #3b82f6",
                  borderRadius: 6,
                }}
              >
                {serverSyncDiscordLoading ? "Syncing…" : "Sync to Discord"}
              </button>
            </div>
            <div
              style={{
                border: "1px solid #243046",
                borderRadius: 10,
                padding: 12,
                background: "#10162b",
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {servers.length === 0 && (
                <div style={{ opacity: 0.7 }}>No servers yet.</div>
              )}
              {servers
                .filter((s: any) => {
                  if (!serverSearch.trim()) return true;
                  const q = serverSearch.trim().toLowerCase();
                  return (
                    (s.server_name || "").toLowerCase().includes(q) ||
                    (s.owner_name || "").toLowerCase().includes(q)
                  );
                })
                .map((s: any, idx: number, arr: any[]) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom:
                        idx === arr.length - 1 ? "none" : "1px solid #243046",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {s.server_name}
                      </div>
                      {s.owner_name && (
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                          {s.owner_name}
                        </div>
                      )}
                      {s.connect_url && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            marginTop: 2,
                            wordBreak: "break-all",
                          }}
                        >
                          {s.connect_url}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteServer(s.id)}
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
                      aria-label="Delete server"
                      title="Delete server"
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
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
        adminDevSecret={adminDevSecret}
        selectedId={selectedMloId}
      />

      </div>
      </div>
    </main>
  );
}
