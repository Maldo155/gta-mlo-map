 "use client";
 
 import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
 import { useSearchParams } from "next/navigation";
 import PublicFilterSidebar from "../components/PublicFilterSidebar";
 import Sidebar from "../components/Sidebar";
 import { CategoryKey } from "../lib/categories";
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
  const [highlightFromFresh, setHighlightFromFresh] = useState(false);
  const [focusMlo, setFocusMlo] = useState<{ id: string; x: number; y: number } | null>(null);
 
  useEffect(() => {
    fetch("/api/mlo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setMlos(d.mlos || []);
        const ids = (d.mlos || []).map((mlo: any) => mlo.id).filter(Boolean);
        if (ids.length === 0) return;
        fetch(`/api/mlo/views?ids=${encodeURIComponent(ids.join(","))}`)
          .then((res) => res.json())
          .then((json) => setViewCounts(json.views || {}))
          .catch(() => null);
      });
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
    const byKey: Record<string, { label: string; count: number }> = {};
    for (const mlo of mlos) {
      const raw = (mlo.creator || "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!byKey[key]) byKey[key] = { label: raw, count: 0 };
      byKey[key].count += 1;
    }
    return Object.entries(byKey)
      .sort((a, b) => a[1].label.localeCompare(b[1].label))
      .map(([key, { label, count }]) => ({ key, label, count }));
  }, [mlos]);
 
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

  return (
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
            '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
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
            <span className="header-pill">
              Discord
            </span>
            <LanguageSelect />
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
          <a href="/requests" className="header-link">
            {t("nav.requests")}
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
         />
 
          <Map
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
          onClose={() => setIsSidebarOpen(false)}
          mlos={sidebarMlos}
          onRefresh={() => {}}
          selectedId={selectedMloId}
          viewCounts={viewCounts}
        />
       </div>
      </div>
     </main>
   );
}

export default function MapPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Loading…</main>}>
      <MapPageContent />
    </Suspense>
  );
}
