import { Suspense } from "react";
import ServersContent from "./ServersContent";

export const dynamic = "force-dynamic";

export default function ServersPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, color: "white" }}>Loading…</main>
      }
    >
      <ServersContent />
    </Suspense>
  );
}
