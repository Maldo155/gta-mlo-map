"use client";

import { Suspense } from "react";
import OriginalHomeContent from "../components/OriginalHomeContent";

export default function MloHomePage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            background: "#0f1115",
          }}
        >
          <p>Loading…</p>
        </main>
      }
    >
      <OriginalHomeContent />
    </Suspense>
  );
}
