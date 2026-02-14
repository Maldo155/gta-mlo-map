"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

type Props = {
  onSearch: (pt: { x: number; y: number }) => void;
};

export default function CoordinateSearch({ onSearch }: Props) {
  const { t } = useLanguage();
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  function handleSearch() {
    const parsedX = Number(x);
    const parsedY = Number(y);

    if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
      return;
    }

    onSearch({ x: parsedX, y: parsedY });
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
        {t("coords.title")}
      </div>


      <div style={{ display: "flex", gap: 6 }}>
        <input
          placeholder={t("coords.x")}
          value={x}
          onChange={(e) => setX(e.target.value)}
          style={{ width: 64, padding: "6px 8px", fontSize: 12 }}
        />
        <input
          placeholder={t("coords.y")}
          value={y}
          onChange={(e) => setY(e.target.value)}
          style={{ width: 64, padding: "6px 8px", fontSize: 12 }}
        />
        <button
          type="button"
          onClick={handleSearch}
          style={{ padding: "6px 10px", fontSize: 12 }}
        >
          {t("coords.search")}
        </button>
      </div>
    </div>
  );
}
