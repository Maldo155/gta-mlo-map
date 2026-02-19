import { Suspense } from "react";
import CreatorsContent from "./CreatorsContent";

export default function CreatorsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, color: "white" }}>Loading…</main>}>
      <CreatorsContent />
    </Suspense>
  );
}
