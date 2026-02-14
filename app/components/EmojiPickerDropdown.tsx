"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme, EmojiStyle } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Props = {
  onEmojiSelect: (emoji: string) => void;
  label?: string;
};

export default function EmojiPickerDropdown({ onEmojiSelect, label = "Add emoji" }: Props) {
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

  function handleClick(data: EmojiClickData) {
    onEmojiSelect(data.emoji);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "6px 12px",
          fontSize: 14,
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          color: "#e5e7eb",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 18 }}>😀</span>
        {label}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: 6,
            zIndex: 1000,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <EmojiPicker
            onEmojiClick={handleClick}
            theme={Theme.DARK}
            width={320}
            height={400}
            emojiStyle={EmojiStyle.NATIVE}
          />
        </div>
      )}
    </div>
  );
}
