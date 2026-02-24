"use client";

import { useState, useEffect } from "react";

const GALLERY_CONVEYOR_SPEED_SEC = 400;

type Props = {
  images: string[];
};

export default function ServerGalleryConveyor({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (!images.length) return null;
  const duplicated = [...images, ...images];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndex == null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i! - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i! + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex != null) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          marginBottom: 24,
          maskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          maskSize: "100% 100%",
        }}
      >
        <div
          className="server-gallery-conveyor-track"
          style={{
            display: "flex",
            gap: 8,
            animation: `galleryConveyorScroll ${GALLERY_CONVEYOR_SPEED_SEC}s linear infinite`,
            width: "max-content",
          }}
        >
          {duplicated.map((url, i) => {
            const originalIndex = i % images.length;
            return (
              <button
                key={`${i}-${url}`}
                type="button"
                className="server-gallery-conveyor-thumb"
                onClick={() => setLightboxIndex(originalIndex)}
                style={{
                  flexShrink: 0,
                  width: 240,
                  height: 180,
                  padding: 0,
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "none",
                  overflow: "hidden",
                }}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {lightboxIndex != null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
          onClick={() => setLightboxIndex(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "1px solid #374151",
              background: "rgba(31,41,55,0.9)",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! - 1 + images.length) % images.length); }}
            aria-label="Previous"
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "1px solid #374151",
              background: "rgba(31,41,55,0.9)",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 24,
            }}
          >
            ‹
          </button>
          <img
            src={images[lightboxIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 48px)",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! + 1) % images.length); }}
            aria-label="Next"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "1px solid #374151",
              background: "rgba(31,41,55,0.9)",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 24,
            }}
          >
            ›
          </button>
        </div>
      )}

      <style>{`
        @keyframes galleryConveyorScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
