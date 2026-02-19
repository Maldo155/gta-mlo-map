"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { addVisitedMloId } from "@/app/lib/visitedMlos";

type Props = { mloId: string; returnTo?: string | null };

export default function MloBackButton({ mloId, returnTo }: Props) {
  const router = useRouter();

  useEffect(() => {
    addVisitedMloId(mloId);
  }, [mloId]);

  const handleBack = () => {
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        marginBottom: 24,
        background: "rgba(36, 48, 70, 0.8)",
        border: "1px solid rgba(139, 92, 246, 0.5)",
        borderRadius: 8,
        color: "#c4b5fd",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <span aria-hidden>←</span>
      Back
    </button>
  );
}
