 "use client";
 
 import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
 import { useSearchParams } from "next/navigation";
import PublicFilterSidebar from "../components/PublicFilterSidebar";
import Sidebar from "../components/Sidebar";
import MapWelcomePopup from "../components/MapWelcomePopup";
 import { CategoryKey } from "../lib/categories";
import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";
 
 const Map = dynamic(() => import("../components/Map"), { ssr: false });
 
function MapPageContent() {
  const { t } = useLanguage();
   const searchParams = useSearchParams();
   const [mlos, setMlos] = useState<any[]>([]);
 
  const [search, setSearch] = useState("");
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
   const [activeCategories, setActiveCategories] = useState<CategoryKey[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>("");
   const [searchPoint, setSearchPoint] =
     useState<{ x: number; y: number } | null>(null);
 
  const [selectedMloId, setSelectedMloId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean | null>(null);
  const [highlightFromFresh, setHighlightFromFresh] = useState(false);
  const [focusMlo, setFocusMlo] = useState<{ id: string; x: number; y: number } | null>(null);
  const [creatorTiles, setCreatorTiles] = useState<{ creator_key: string; partnership?: boolean }[]>([]);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("mlomesh_map_welcome_seen");
      setShowWelcomePopup(!seen);
    } catch {
      setShowWelcomePopup(true);
    }
  }, []);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    function fetchViewCounts(ids: string[]) {
      if (ids.length === 0) return;
      fetch(`/api/mlo/views?ids=${encodeURIComponent(ids.join(","))}`)
        .then((res) => res.json())
        .then((json) => setViewCounts(json.views || {}))
        .catch(() => null);
    }
    function fetchMlos() {
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
      fetch("/api/mlo", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setMlos(d.mlos || []);
          const ids = (d.mlos || []).map((mlo: any) => mlo.id).filter(Boolean);
          fetchViewCounts(ids);
          delayTimer = setTimeout(() => fetchViewCounts(ids), 800);
        });
    }
    fetchMlos();
    const interval = setInterval(fetchMlos, 60_000);

    function fetchCreatorTiles() {
      fetch("/api/creator-tiles", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setCreatorTiles(d.tiles || []))
        .catch(() => null);
    }
    fetchCreatorTiles();
    const tilesInterval = setInterval(fetchCreatorTiles, 60_000);

    // Refresh view counts when returning from MLO detail page (e.g. after clicking Back)
    const refresh = () => {
      fetch("/api/mlo", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          const ids = (d.mlos || []).map((mlo: any) => mlo.id).filter(Boolean);
          if (ids.length === 0) return;
          fetch(`/api/mlo/views?ids=${encodeURIComponent(ids.join(","))}`)
            .then((res) => res.json())
            .then((json) => setViewCounts(json.views || {}))
            .catch(() => null);
        });
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      clearInterval(tilesInterval);
      if (delayTimer) clearTimeout(delayTimer);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
 
   useEffect(() => {
     const x = Number(searchParams.get("x"));
     const y = Number(searchParams.get("y"));
     if (Number.isFinite(x) && Number.isFinite(y)) {
       setSearchPoint({ x, y });
     }
   }, [searchParams]);

  useEffect(() => {
    const mloId = searchParams.get("mloId");
    const highlight = searchParams.get("highlight");
    setHighlightFromFresh(highlight === "1");
    if (!mloId || mlos.length === 0) return;
    const match = mlos.find((mlo) => mlo.id === mloId);
    if (!match) return;
    setSelectedMloId(mloId);
    setIsSidebarOpen(true);
    if (Number.isFinite(match.x) && Number.isFinite(match.y)) {
      setFocusMlo({ id: mloId, x: Number(match.x), y: Number(match.y) });
    }
  }, [searchParams, mlos]);
 
   function toggleCategory(cat: CategoryKey) {
     setActiveCategories((prev) =>
       prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
     );
   }

   // When user applies any filter, clear "highlight only one" mode so all filtered markers show
   useEffect(() => {
     if (selectedCreator || search.trim() || activeCategories.length > 0) {
       setHighlightFromFresh(false);
     }
   }, [selectedCreator, search, activeCategories]);
 
  const filteredMlos = mlos.filter((mlo) => {
    const matchesText =
      !search ||
      mlo.name?.toLowerCase().includes(search.toLowerCase()) ||
      mlo.creator?.toLowerCase().includes(search.toLowerCase()) ||
      mlo.tag?.toLowerCase().includes(search.toLowerCase());
 
    const matchesCategory =
      activeCategories.length === 0 || activeCategories.includes(mlo.category);

     const matchesCreator =
       !selectedCreator ||
       (mlo.creator || "").trim().toLowerCase() === selectedCreator.toLowerCase();
 
     return matchesText && matchesCategory && matchesCreator;
   });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mlo of mlos) {
      if (!mlo?.category) continue;
      counts[mlo.category] = (counts[mlo.category] || 0) + 1;
    }
    return counts;
  }, [mlos]);

  const creatorOptions = useMemo(() => {
    const tilesByKey: Record<string, { partnership?: boolean }> = {};
    for (const t of creatorTiles) {
      const k = String(t.creator_key || "").trim().toLowerCase();
      if (k) tilesByKey[k] = { partnership: (t as { partnership?: boolean }).partnership === true };
    }
    const byKey: Record<string, { label: string; count: number; partnership?: boolean }> = {};
    for (const mlo of mlos) {
      const raw = (mlo.creator || "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!byKey[key]) byKey[key] = { label: raw, count: 0, partnership: tilesByKey[key]?.partnership };
      byKey[key].count += 1;
    }
    return Object.entries(byKey)
      .sort((a, b) => {
        const aPartner = a[1].partnership ?? false;
        const bPartner = b[1].partnership ?? false;
        if (aPartner && !bPartner) return -1;
        if (!aPartner && bPartner) return 1;
        return a[1].label.localeCompare(b[1].label);
      })
      .map(([key, { label, count, partnership }]) => ({ key, label, count, partnership }));
  }, [mlos, creatorTiles]);
 
  // Radius in GTA world units; markers within this distance of the clicked one also show in the sidebar
  const MLO_CLICK_RADIUS_GTA = 35;

  const selectedMlo = selectedMloId
    ? mlos.find((mlo) => mlo.id === selectedMloId)
    : null;
  const sidebarMlos = selectedMlo
    ? mlos.filter((mlo) => {
        if (
          !Number.isFinite(mlo.x) ||
          !Number.isFinite(mlo.y) ||
          !Number.isFinite(selectedMlo.x) ||
          !Number.isFinite(selectedMlo.y)
        ) {
          return mlo.id === selectedMlo.id;
        }
        const dx = Number(mlo.x) - Number(selectedMlo.x);
        const dy = Number(mlo.y) - Number(selectedMlo.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= MLO_CLICK_RADIUS_GTA;
      })
    : [];

  // Build returnTo from current state so Back from MLO detail restores map position & sidebar
  const mapReturnTo = useMemo(() => {
    if (selectedMloId && selectedMlo && Number.isFinite(selectedMlo.x) && Number.isFinite(selectedMlo.y)) {
      const params = new URLSearchParams();
      params.set("mloId", selectedMloId);
      params.set("highlight", "1");
      params.set("x", String(selectedMlo.x));
      params.set("y", String(selectedMlo.y));
      return `/map?${params.toString()}`;
    }
    const q = searchParams.toString();
    return `/map${q ? `?${q}` : ""}`;
  }, [selectedMloId, selectedMlo, searchParams]);

  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    try {
      sessionStorage.setItem("mlomesh_map_welcome_seen", "1");
    } catch {
      /* ignore */
    }
  };

  return (
     <>
     <MapWelcomePopup show={showWelcomePopup ?? false} onClose={handleWelcomeClose} />
     <main
       className="home-root map-page"
       style={{
         display: "flex",
         flexDirection: "column",
         height: "100vh",
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
            'linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="header-logo-float">
        <img src="/mlomesh-logo.png" alt="MLOMesh logo" className="header-logo" />
      </div>
      <header
        className="site-header"
        style={{
          padding: "6px 12px",
          backgroundColor: "#10162b",
          backgroundImage: 'url("/header-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          color: "white",
          backdropFilter: "blur(8px)",
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
          <a href="/creators" className="header-link header-link-creators">
            {t("nav.creators")}
          </a>
          <a href="/servers" className="header-link header-link-servers">
            {t("nav.servers")}
          </a>
          <a href="/submit" className="header-link">
            {t("nav.submit")}
          </a>
        </nav>
      </header>
       <div
         className="map-content-area"
         style={{
           display: "flex",
           flex: 1,
           minHeight: 0,
           overflow: "hidden",
           position: "relative",
         }}
       >
         <PublicFilterSidebar
           search={search}
           setSearch={setSearch}
           activeCategories={activeCategories}
           toggleCategory={toggleCategory}
           onSearch={(pt) => setSearchPoint(pt)}
           categoryCounts={categoryCounts}
           totalMlos={mlos.length}
           selectedCreator={selectedCreator}
           onCreatorChange={setSelectedCreator}
           creatorOptions={creatorOptions}
           highlightCreatorSearch={showWelcomePopup === true}
         />
 
          <Map
           key={highlightFromFresh && selectedMloId ? `focus-${selectedMloId}` : "all"}
           mlos={filteredMlos}
           searchPoint={searchPoint}
          onMloClick={(id) => {
            setHighlightFromFresh(false);
            setFocusMlo(null);
            setSelectedMloId(id);
            setIsSidebarOpen(true);
          }}
            focusMlo={highlightFromFresh ? focusMlo : null}
            focusOnlyId={highlightFromFresh ? selectedMloId : null}
         />
 
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setHighlightFromFresh(false);
            setSelectedMloId(null);
            setFocusMlo(null);
          }}
          mlos={sidebarMlos}
          onRefresh={() => {}}
          selectedId={selectedMloId}
          viewCounts={viewCounts}
          returnTo={mapReturnTo}
        />
       </div>
      </div>
     </main>
     </>
   );
}

export default function MapPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Loading…</main>}>
      <MapPageContent />
    </Suspense>
  );
}
