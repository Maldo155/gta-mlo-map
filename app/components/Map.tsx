"use client";

import {
  MapContainer,
  ImageOverlay,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIES } from "@/app/lib/categories";

/* ================= CONFIG ================= */

const MAP_SIZE = 8192;
// GTA V world coords are centered at (0, 0). Adjust if your map uses different bounds.
const WORLD_BOUNDS = {
  minX: -MAP_SIZE / 2,
  maxX: MAP_SIZE / 2,
  minY: -MAP_SIZE / 2,
  maxY: MAP_SIZE / 2,
};
// Calibration to align this map image with gtamap.xyz GTA coords.
// Derived from two reference points provided by the user.
const GTA_CALIBRATION = {
  scaleX: 0.7258972658926451,
  offsetX: -425.9384500924705,
  scaleY: -0.3777132577845863,
  offsetY: 2347.68367689339,
};
// Correction from estimated GTA coords (from our base calibration)
// to true GTA coords (from CodeWalker reference points).
const GTA_CORRECTION = {
  a11: 1.0996947861032143,
  a12: 0.00014402745816775864,
  b1: -132.1801140692835,
  a21: -0.003000367797389436,
  a22: 0.5732595162032009,
  b2: -1404.1341432704112,
  // Precomputed inverse of the 2x2 matrix above
  inv11: 0.9093425986509521,
  inv12: -0.0002284659903333143,
  inv21: 0.00475938414046254,
  inv22: 1.7444094450296648,
};

/* ================= ICONS ================= */

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const clickIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const searchResultIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const categoryByKey = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.key, cat])
);

function getCategoryIcon(category?: string | null) {
  const cat = category ? categoryByKey[category] : null;
  if (!cat) return markerIcon;
  const iconImage = (cat as { iconImage?: string }).iconImage;
  const inner =
    iconImage
      ? `<img src="${iconImage}" alt="" style="width:18px;height:18px;object-fit:contain;" />`
      : (cat as { icon: string }).icon;
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:999px;background:#10162b;border:1px solid #243046;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 6px 14px rgba(0,0,0,0.35);">${inner}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/* ================= TYPES ================= */

type Mlo = {
  id: string;
  name: string;
  category?: string | null;
  x: number | null;
  y: number | null;
};

type Props = {
  mlos: Mlo[];
  searchPoint?: { x: number; y: number } | null;
  onMapClick?: (pt: { x: number; y: number }) => void;
  onMloClick?: (id: string) => void;
  focusMlo?: { id: string; x: number; y: number } | null;
  focusOnlyId?: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function worldToMap(pt: { x: number; y: number }) {
  const x = clamp(pt.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  const y = clamp(pt.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);

  const mapX =
    ((x - WORLD_BOUNDS.minX) / (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX)) *
    MAP_SIZE;
  const mapY =
    ((WORLD_BOUNDS.maxY - y) / (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY)) *
    MAP_SIZE;

  return { x: mapX, y: mapY };
}

function mapToWorld(pt: { x: number; y: number }) {
  const worldX =
    (pt.x / MAP_SIZE) * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) +
    WORLD_BOUNDS.minX;
  const worldY =
    WORLD_BOUNDS.maxY -
    (pt.y / MAP_SIZE) * (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY);

  return { x: worldX, y: worldY };
}

function gtaToWorld(pt: { x: number; y: number }) {
  return {
    x: pt.x * GTA_CALIBRATION.scaleX + GTA_CALIBRATION.offsetX,
    y: pt.y * GTA_CALIBRATION.scaleY + GTA_CALIBRATION.offsetY,
  };
}

function worldToGta(pt: { x: number; y: number }) {
  return {
    x: (pt.x - GTA_CALIBRATION.offsetX) / GTA_CALIBRATION.scaleX,
    y: (pt.y - GTA_CALIBRATION.offsetY) / GTA_CALIBRATION.scaleY,
  };
}

function estimatedGtaToTrue(pt: { x: number; y: number }) {
  return {
    x: GTA_CORRECTION.a11 * pt.x + GTA_CORRECTION.a12 * pt.y + GTA_CORRECTION.b1,
    y: GTA_CORRECTION.a21 * pt.x + GTA_CORRECTION.a22 * pt.y + GTA_CORRECTION.b2,
  };
}

function trueGtaToEstimated(pt: { x: number; y: number }) {
  const dx = pt.x - GTA_CORRECTION.b1;
  const dy = pt.y - GTA_CORRECTION.b2;
  return {
    x: GTA_CORRECTION.inv11 * dx + GTA_CORRECTION.inv12 * dy,
    y: GTA_CORRECTION.inv21 * dx + GTA_CORRECTION.inv22 * dy,
  };
}

function MapFocus({
  point,
  zoom = 1.5,
}: {
  point: { x: number; y: number } | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;
    map.setView([point.y, point.x], zoom, { animate: true });
  }, [map, point, zoom]);

  return null;
}

function FitBoundsOnReady({
  bounds,
}: {
  bounds: [[number, number], [number, number]];
}) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds);
  }, [map, bounds]);

  return null;
}

/* ================= MAP ================= */

export default function Map({
  mlos,
  searchPoint,
  onMapClick,
  onMloClick,
  focusMlo,
  focusOnlyId,
}: Props) {
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [activeMarker, setActiveMarker] = useState<"search" | "click" | null>(
    null
  );
  const searchMapPoint =
    searchPoint &&
    Number.isFinite(searchPoint.x) &&
    Number.isFinite(searchPoint.y)
      ? worldToMap(gtaToWorld(trueGtaToEstimated(searchPoint)))
      : null;
  const focusMapPoint =
    focusMlo &&
    Number.isFinite(focusMlo.x) &&
    Number.isFinite(focusMlo.y)
      ? worldToMap(gtaToWorld(trueGtaToEstimated({ x: focusMlo.x, y: focusMlo.y })))
      : null;
  const hasSearchMarker = Boolean(searchMapPoint);

  useEffect(() => {
    if (searchMapPoint) {
      setActiveMarker("search");
    }
  }, [searchMapPoint]);

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const x = e.latlng.lng;
        const y = e.latlng.lat;

        if (onMapClick) {
          setClickPos({ x, y });
          const world = mapToWorld({ x, y });
          const gta = estimatedGtaToTrue(worldToGta(world));
          setActiveMarker("click");
          onMapClick({
            x: Number(gta.x.toFixed(4)),
            y: Number(gta.y.toFixed(4)),
          });
        }
      },
    });
    return null;
  }

  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [MAP_SIZE, MAP_SIZE],
  ];

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      minZoom={-2}
      maxZoom={2}
      style={{ height: "100%", width: "100%" }}
    >
      <FitBoundsOnReady bounds={bounds} />
      {focusMapPoint && (
        <MapFocus point={focusMapPoint} />
      )}
      <ImageOverlay
        url="/maps/gta-5-map-atlas-hd.jpg"
        bounds={bounds}
      />

      <ClickHandler />
      {/* MapFocus disabled to avoid snapping on search */}

      {/* CLICK MARKER */}
      {onMapClick && clickPos && activeMarker === "click" && !hasSearchMarker && (
        <Marker
          position={[clickPos.y, clickPos.x]}
          icon={clickIcon}
        />
      )}

      {/* SEARCH MARKER */}
      {searchMapPoint && activeMarker === "search" && (
        <Marker
          position={[searchMapPoint.y, searchMapPoint.x]}
          icon={searchResultIcon}
        />
      )}

      {/* MLO MARKERS */}
      {mlos.map((mlo) => {
        if (focusOnlyId && mlo.id !== focusOnlyId) {
          return null;
        }
        if (
          mlo.x == null ||
          mlo.y == null ||
          !Number.isFinite(mlo.x) ||
          !Number.isFinite(mlo.y)
        ) {
          return null;
        }

        const mapPoint = worldToMap(
          gtaToWorld(trueGtaToEstimated({ x: mlo.x, y: mlo.y }))
        );

        return (
          <Marker
            key={mlo.id}
            position={[mapPoint.y, mapPoint.x]}
            icon={getCategoryIcon(mlo.category)}
            eventHandlers={{
              click: () => onMloClick?.(mlo.id),
            }}
          >
          </Marker>
        );
      })}
    </MapContainer>
  );
}
