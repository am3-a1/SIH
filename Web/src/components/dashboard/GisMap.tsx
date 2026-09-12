"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import facilitiesSeed from "@/data/facilities_seed.json";
import { Facility } from "@/types";
import { MapPin, Compass, Shield, Layers, Filter } from "lucide-react";

const SCHEME_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  AVYAY: { bg: "#10b981", border: "#047857", label: "AVYAY (Senior Care)" },
  NAPDDR: { bg: "#f43f5e", border: "#be123c", label: "NAPDDR (De-addiction)" },
  "PM-AJAY": { bg: "#3b82f6", border: "#1d4ed8", label: "PM-AJAY (Hostels)" },
  SMILE: { bg: "#f59e0b", border: "#b45309", label: "SMILE (Marginalised)" },
};

export function GisMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { theme } = useTheme();
  const [selectedScheme, setSelectedScheme] = useState<string>("ALL");
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null);

  const facilities: Facility[] = facilitiesSeed.facilities || [];

  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;
      // Dynamically import leaflet to avoid SSR issues
      const L = (await import("leaflet")).default;

      // Import Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (isCancelled) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered on India
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 78.9],
        zoom: 5,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // Select tile layer based on theme
      const isDark = theme === "dark" || document.documentElement.classList.contains("dark");
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | MoSJE PostGIS',
      }).addTo(map);

      // Render pins and geofence circles
      renderPins(L, map);

      // Force size update once mounted
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [theme]);

  // Update pins when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((module) => {
      const L = module.default;
      renderPins(L, mapInstanceRef.current);
    });
  }, [selectedScheme]);

  const renderPins = (L: any, map: any) => {
    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const filtered = facilities.filter(
      (f) => selectedScheme === "ALL" || f.scheme_code === selectedScheme
    );

    filtered.forEach((facility) => {
      const colorInfo = SCHEME_COLORS[facility.scheme_code] || {
        bg: "#6366f1",
        border: "#4338ca",
        label: facility.scheme_code,
      };

      // 1. Geofence buffer circle
      const circle = L.circle([facility.latitude, facility.longitude], {
        radius: facility.geofence_radius_meters * 400, // scaled visual buffer for national view
        color: colorInfo.border,
        fillColor: colorInfo.bg,
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);

      // 2. Custom SVG marker icon
      const customIcon = L.divIcon({
        className: "custom-gis-pin",
        html: `
          <div style="
            background-color: ${colorInfo.bg};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([facility.latitude, facility.longitude], {
        icon: customIcon,
      }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
              ${facility.scheme_code}
            </span>
            <span style="font-size: 10px; font-weight: bold; color: ${facility.compliance_grade === 'A' ? '#059669' : '#d97706'};">
              Grade ${facility.compliance_grade} • Risk ${facility.risk_score}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
            ${facility.name}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            ${facility.district}, ${facility.state}
          </div>
          <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between;">
            <span>Enrolled: <b>${facility.enrolled_beneficiaries}/${facility.sanctioned_capacity}</b></span>
            <span>Geofence: <b>${facility.geofence_radius_meters}m</b></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        setActiveFacility(facility);
      });

      markersRef.current.push(circle);
      markersRef.current.push(marker);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Map Card Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>National GIS Surveillance & Geofence Map</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Spatial monitoring of 12 registered institutions across India with PostGIS geofence perimeter rings.
          </p>
        </div>

        {/* Scheme Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "AVYAY", "NAPDDR", "PM-AJAY"].map((scheme) => (
            <button
              key={scheme}
              onClick={() => setSelectedScheme(scheme)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedScheme === scheme
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {scheme === "ALL" ? "All Schemes (12)" : scheme}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[400px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Summary Badge */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>12 GPS Polygons Active</span>
        </div>
      </div>

      {/* Scheme Legend Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-slate-300 font-medium">
          <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Schemes:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>AVYAY (Senior Care)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>NAPDDR (De-addiction)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>PM-AJAY (Hostels)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>SMILE (Marginalised)</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Click any marker to view geofence specifications
        </div>
      </div>
    </div>
  );
}
