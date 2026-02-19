"use client";

import { useRouter } from "next/navigation";

type Props = {
  mloId: string;
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/** Link that increments view count on click, then navigates. More reliable than counting on page load. */
export default function ViewDetailsLink({ mloId, href, children, style }: Props) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    const isNewTab = e.ctrlKey || e.metaKey || e.button === 1;
    if (!isNewTab) {
      e.preventDefault();
      // Fire view increment before navigation - most reliable for same-tab click
      fetch("/api/mlo/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mlo_id: mloId }),
      }).catch(() => null);
      try {
        sessionStorage.setItem(`mlomesh_view_${mloId}`, String(Date.now()));
      } catch {
        /* ignore */
      }
      router.push(href);
    }
    // New tab: let default open new tab, MloViewTracker on that page will count
  };

  return (
    <a href={href} onClick={handleClick} style={style}>
      {children}
    </a>
  );
}
