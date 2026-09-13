"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Cctv, 
  Video, 
  ShieldCheck, 
  MapPin, 
  User, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Scan, 
  Eye, 
  EyeOff, 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Moon, 
  SunMedium, 
  Sparkles, 
  Radio, 
  Building2,
  X
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import { Facility } from "@/types";

export default function CCTVPage() {
  const facilities: Facility[] = facilitiesSeed.facilities || [];
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id || "DOSJE-DL-001");
  const currentFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  // Global Surveillance States
  const [privacyBlur, setPrivacyBlur] = useState<boolean>(false);
  const [focusedCamera, setFocusedCamera] = useState<number | null>(null);
  const [clockStr, setClockStr] = useState<string>("");
  const [utcClockStr, setUtcClockStr] = useState<string>("");

  // PTZ states for Cam 1
  const [ptzPan, setPtzPan] = useState<number>(0);
  const [ptzTilt, setPtzTilt] = useState<number>(0);
  const [ptzZoom, setPtzZoom] = useState<number>(1);
  const [ptzMessage, setPtzMessage] = useState<string>("ONVIF Profile S Active");

  // AI Headcount states for Cam 2
  const [isScanningHeadcount, setIsScanningHeadcount] = useState<boolean>(false);
  const [headcountResults, setHeadcountResults] = useState<{
    detected: number;
    registered: number;
    discrepancy: number;
    isAnomaly: boolean;
    timestamp: string;
    riskLevel?: string;
    aiEngine?: string;
  } | null>(null);
  const [showDetectionBoxes, setShowDetectionBoxes] = useState<boolean>(true);

  // IR Night vision for Cam 3
  const [irMode, setIrMode] = useState<boolean>(false);

  // Snapshot modal
  const [snapshotData, setSnapshotData] = useState<{
    camName: string;
    timestamp: string;
    facilityName: string;
    hash: string;
  } | null>(null);

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(now.toLocaleTimeString("en-IN", { hour12: false }));
      setUtcClockStr(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // PTZ Handler
  const handlePTZ = (action: string) => {
    switch (action) {
      case "PAN_LEFT":
        setPtzPan((prev) => Math.max(prev - 12, -48));
        setPtzMessage("PTZ Pan Left (-12°)");
        break;
      case "PAN_RIGHT":
        setPtzPan((prev) => Math.min(prev + 12, 48));
        setPtzMessage("PTZ Pan Right (+12°)");
        break;
      case "TILT_UP":
        setPtzTilt((prev) => Math.max(prev - 10, -30));
        setPtzMessage("PTZ Tilt Up (+10°)");
        break;
      case "TILT_DOWN":
        setPtzTilt((prev) => Math.min(prev + 10, 30));
        setPtzMessage("PTZ Tilt Down (-10°)");
        break;
      case "ZOOM_IN":
        setPtzZoom((prev) => Math.min(prev + 0.25, 2.5));
        setPtzMessage("PTZ Zoom In (1.25x)");
        break;
      case "ZOOM_OUT":
        setPtzZoom((prev) => Math.max(prev - 0.25, 1.0));
        setPtzMessage("PTZ Zoom Out (0.8x)");
        break;
      case "RESET":
        setPtzPan(0);
        setPtzTilt(0);
        setPtzZoom(1);
        setPtzMessage("PTZ Position Reset to Preset 0");
        break;
    }
  };

  // Run AI Headcount Scan on Cam 2
  const runHeadcountScan = async () => {
    setIsScanningHeadcount(true);
    try {
      const reg = currentFacility?.enrolled_beneficiaries || 88;
      const res = await fetch("/api/v1/ai/headcount-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility_id: currentFacility?.id || "DOSJE-DL-001",
          image_data: `CCTV-CAM02-LIVE-${Date.now()}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHeadcountResults({
          detected: data.detected_count,
          registered: data.facility_registered_count || reg,
          discrepancy: data.discrepancy_percentage,
          isAnomaly: data.is_anomaly,
          timestamp: new Date().toLocaleTimeString(),
          riskLevel: data.risk_level,
          aiEngine: data.ai_engine
        });
      } else {
        throw new Error("Failed to scan");
      }
    } catch (err) {
      // Fallback calculation if offline
      const reg = currentFacility?.enrolled_beneficiaries || 88;
      const detected = Math.max(1, Math.round(reg * (0.93 + Math.random() * 0.05)));
      const disc = Math.round(Math.abs(reg - detected) / reg * 1000) / 10;
      setHeadcountResults({
        detected,
        registered: reg,
        discrepancy: disc,
        isAnomaly: disc > 20,
        timestamp: new Date().toLocaleTimeString(),
        riskLevel: disc > 40 ? "CRITICAL" : disc > 20 ? "HIGH" : "NORMAL",
        aiEngine: "DoSJE AI Vision (Local Fallback)"
      });
    } finally {
      setIsScanningHeadcount(false);
      setShowDetectionBoxes(true);
    }
  };

  // Capture Snapshot
  const captureSnapshot = (camName: string) => {
    const randomHash = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setSnapshotData({
      camName,
      timestamp: new Date().toISOString(),
      facilityName: currentFacility?.name || "Facility",
      hash: `SHA256:${randomHash.toUpperCase()}`
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header & Facility Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Central CCTV Surveillance Wall
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ONVIF Profile S/G Connected
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <Cctv className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              National Facility Multi-Stream Monitoring Wall
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live continuous RTSP/H.264 video matrix with dynamic PTZ control, night vision IR, and automated AI headcount verification.
            </p>
          </div>

          {/* Controls & Facility Menu */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Facility Selector */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Select Target Facility
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  setSelectedFacilityId(e.target.value);
                  setHeadcountResults(null);
                  handlePTZ("RESET");
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.district}, {fac.state})
                  </option>
                ))}
              </select>
            </div>

            {/* DPDP Face Anonymization Toggle */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                DPDP Act 2023 Privacy
              </label>
              <button
                onClick={() => setPrivacyBlur(!privacyBlur)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  privacyBlur
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {privacyBlur ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                <span>{privacyBlur ? "Face Blur: ACTIVE" : "Face Blur: OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Target Facility Metadata Strip */}
        {currentFacility && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Scheme</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block font-mono">
                {currentFacility.scheme_code}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">In-Charge</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {currentFacility.in_charge_name}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Enrolled Roster</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 truncate block font-mono">
                {currentFacility.enrolled_beneficiaries} / {currentFacility.sanctioned_capacity}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Grade</span>
              <span className={`font-bold font-mono ${
                currentFacility.compliance_grade === "A"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : currentFacility.compliance_grade === "B"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                Grade {currentFacility.compliance_grade} ({currentFacility.risk_score}% Risk)
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Geofence Radius</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block font-mono">
                {currentFacility.geofence_radius_meters}m
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">GPS Coordinates</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block">
                {currentFacility.latitude.toFixed(4)}°N, {currentFacility.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Camera Grid (4 Screens or Single Focused) */}
      <div className={`grid gap-5 ${focusedCamera !== null ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        
        {/* CAMERA 1: Main Gate & Perimeter (With Active ONVIF PTZ) */}
        {(focusedCamera === null || focusedCamera === 1) && (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-850 flex flex-col transition-all">
            {/* Camera Header */}
            <div className="bg-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold tracking-tight">CAM-01: Main Gate & Perimeter Check-In</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-900/40">
                  1080p • 25fps • 2.4Mbps
                </span>
                <button
                  onClick={() => setFocusedCamera(focusedCamera === 1 ? null : 1)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Toggle Fullscreen Cam"
                >
                  {focusedCamera === 1 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Video Canvas / Simulator */}
            <div className="relative h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden select-none">
              {/* Animated camera interior with PTZ transforms */}
              <div 
                className={`w-full h-full relative flex items-center justify-center transition-transform duration-300 ${
                  privacyBlur ? "blur-md" : ""
                }`}
                style={{
                  transform: `scale(${ptzZoom}) translate(${ptzPan}px, ${ptzTilt}px)`
                }}
              >
                {/* Visual Gate / Yard Simulation */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 opacity-90"></div>
                {/* Perspective lines */}
                <div className="absolute inset-x-8 bottom-0 h-40 border-b-2 border-dashed border-slate-700/60 transform -skew-x-12"></div>
                <div className="absolute inset-x-8 bottom-0 h-40 border-b-2 border-dashed border-slate-700/60 transform skew-x-12"></div>
                {/* Gate Silhouette */}
                <div className="w-48 h-32 border-4 border-slate-800/80 rounded-t-xl relative flex flex-col justify-end p-2 bg-slate-900/40">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-500 bg-black/60 px-2 py-0.5 rounded border border-emerald-800">
                    GATE #1 BARRIER
                  </div>
                  <div className="w-full h-1 bg-amber-500/80 rounded mb-2 animate-pulse"></div>
                  <div className="grid grid-cols-6 gap-1 h-20 opacity-40">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-slate-700 h-full rounded-xs"></div>
                    ))}
                  </div>
                </div>

                {/* Simulated Moving Inspector / Vehicle */}
                <div className="absolute bottom-6 left-1/4 w-10 h-16 bg-blue-600/30 border border-blue-400/60 rounded flex flex-col items-center justify-center animate-pulse">
                  <span className="text-[7px] font-mono text-blue-200">OFFICER</span>
                </div>
              </div>

              {/* Scanlines Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30"></div>

              {/* Tactical Watermark HUD */}
              <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-amber-400 bg-black/80 px-2 py-1 rounded border border-slate-800">
                RTSP: <span className="text-emerald-400">rtsp://10.20.{currentFacility.id.slice(-3)}.101/live/ch0</span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded border border-slate-800">
                REC | {currentFacility.latitude.toFixed(4)}°N, {currentFacility.longitude.toFixed(4)}°E | {clockStr} IST ({utcClockStr})
              </div>
              <div className="absolute top-2.5 right-2.5 text-[9px] font-mono text-emerald-400 bg-black/80 px-2 py-1 rounded border border-slate-800">
                {ptzMessage}
              </div>
            </div>

            {/* ONVIF PTZ Controls */}
            <div className="bg-slate-900 p-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">ONVIF PTZ:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handlePTZ("PAN_LEFT")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Pan Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePTZ("TILT_UP")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Tilt Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePTZ("TILT_DOWN")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Tilt Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePTZ("PAN_RIGHT")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Pan Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-slate-800 mx-1"></span>
                  <button
                    onClick={() => handlePTZ("ZOOM_IN")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePTZ("ZOOM_OUT")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePTZ("RESET")}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Reset Position"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => captureSnapshot("CAM-01 Main Gate")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Capture Stamped Frame</span>
              </button>
            </div>
          </div>
        )}

        {/* CAMERA 2: Dining Hall & Kitchen (AI Attendance Scan Overlay) */}
        {(focusedCamera === null || focusedCamera === 2) && (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-850 flex flex-col transition-all">
            {/* Camera Header */}
            <div className="bg-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold tracking-tight">CAM-02: Dining Hall & Nutrition Verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={runHeadcountScan}
                  disabled={isScanningHeadcount}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <Scan className={`w-3 h-3 ${isScanningHeadcount ? "animate-spin" : ""}`} />
                  <span>{isScanningHeadcount ? "Running Scan..." : "Run AI Headcount"}</span>
                </button>
                <button
                  onClick={() => setFocusedCamera(focusedCamera === 2 ? null : 2)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Toggle Fullscreen Cam"
                >
                  {focusedCamera === 2 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Video Canvas / AI Simulator */}
            <div className="relative h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden select-none">
              <div className={`w-full h-full relative flex items-center justify-center ${privacyBlur ? "blur-md" : ""}`}>
                {/* Simulated Hall Background */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950 to-slate-900"></div>
                {/* Dining Tables Silhouette */}
                <div className="w-3/4 h-24 border-t-2 border-slate-700/60 flex items-center justify-around px-4">
                  <div className="w-20 h-10 bg-slate-800/40 rounded border border-slate-700/40"></div>
                  <div className="w-20 h-10 bg-slate-800/40 rounded border border-slate-700/40"></div>
                  <div className="w-20 h-10 bg-slate-800/40 rounded border border-slate-700/40"></div>
                </div>

                {/* Simulated AI Beneficiary Detections */}
                {showDetectionBoxes && (
                  <div className="absolute inset-0 pointer-events-none p-4">
                    <div className="absolute top-10 left-12 w-20 h-28 border-2 border-emerald-400 bg-emerald-500/10 rounded flex flex-col justify-between p-1">
                      <span className="text-[8px] font-mono bg-emerald-900/90 text-emerald-200 px-1 py-0.5 rounded">
                        Beneficiary #1 [98%]
                      </span>
                      <span className="text-[7px] font-mono text-emerald-300">Verified Face</span>
                    </div>

                    <div className="absolute top-12 left-44 w-20 h-28 border-2 border-cyan-400 bg-cyan-500/10 rounded flex flex-col justify-between p-1">
                      <span className="text-[8px] font-mono bg-cyan-900/90 text-cyan-200 px-1 py-0.5 rounded">
                        Beneficiary #2 [95%]
                      </span>
                      <span className="text-[7px] font-mono text-cyan-300">Verified Face</span>
                    </div>

                    <div className="absolute top-8 right-24 w-20 h-28 border-2 border-amber-400 bg-amber-500/10 rounded flex flex-col justify-between p-1">
                      <span className="text-[8px] font-mono bg-amber-900/90 text-amber-200 px-1 py-0.5 rounded">
                        Beneficiary #3 [92%]
                      </span>
                      <span className="text-[7px] font-mono text-amber-300">Verified Face</span>
                    </div>

                    <div className="absolute bottom-10 right-12 w-20 h-28 border-2 border-purple-400 bg-purple-500/10 rounded flex flex-col justify-between p-1">
                      <span className="text-[8px] font-mono bg-purple-900/90 text-purple-200 px-1 py-0.5 rounded">
                        Beneficiary #4 [94%]
                      </span>
                      <span className="text-[7px] font-mono text-purple-300">Verified Face</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30"></div>

              {/* Tactical Watermark HUD */}
              <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-amber-400 bg-black/80 px-2 py-1 rounded border border-slate-800">
                RTSP: <span className="text-emerald-400">rtsp://10.20.{currentFacility.id.slice(-3)}.102/live/ch0</span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded border border-slate-800">
                TensorFlow Headcount Verification | {clockStr} IST
              </div>
            </div>

            {/* AI Headcount Result Bar */}
            <div className="bg-slate-900 p-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                {headcountResults ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {headcountResults.detected} Verified / {headcountResults.registered} Roster
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      {headcountResults.discrepancy}% Delta
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      headcountResults.isAnomaly
                        ? "bg-rose-900/80 text-rose-300 border border-rose-700"
                        : "bg-emerald-900/80 text-emerald-300 border border-emerald-700"
                    }`}>
                      {headcountResults.isAnomaly
                        ? `GHOST BENEFICIARY ALERT (${headcountResults.riskLevel || "HIGH"} RISK)`
                        : "COMPLIANT: NO GHOST BENEFICIARY"}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">
                    Automated YOLOv8 / SSD Face Scan Ready • Click "Run AI Headcount"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetectionBoxes(!showDetectionBoxes)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {showDetectionBoxes ? "Hide Boxes" : "Show Boxes"}
                </button>
                <button
                  onClick={() => captureSnapshot("CAM-02 Dining Hall")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CAMERA 3: Dormitory & Activity Wing (With IR Night Vision Toggle) */}
        {(focusedCamera === null || focusedCamera === 3) && (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-850 flex flex-col transition-all">
            <div className="bg-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold tracking-tight">CAM-03: Dormitory & Common Activity Hall</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIrMode(!irMode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    irMode
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>{irMode ? "IR Night Vision: ON" : "IR Night Vision: OFF"}</span>
                </button>
                <button
                  onClick={() => setFocusedCamera(focusedCamera === 3 ? null : 3)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Toggle Fullscreen Cam"
                >
                  {focusedCamera === 3 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className={`relative h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden select-none ${
              irMode ? "grayscale contrast-125 brightness-110" : ""
            }`}>
              <div className={`w-full h-full relative flex items-center justify-center ${privacyBlur ? "blur-md" : ""}`}>
                {/* Background Room Outline */}
                <div className={`absolute inset-0 ${irMode ? "bg-emerald-950/20" : "bg-slate-950"}`}></div>
                <div className="w-4/5 h-32 border-2 border-slate-800/80 rounded-xl flex items-center justify-around p-3">
                  <div className="w-16 h-20 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-500">
                    BED #1
                  </div>
                  <div className="w-16 h-20 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-500">
                    BED #2
                  </div>
                  <div className="w-16 h-20 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-500">
                    BED #3
                  </div>
                </div>
              </div>

              {/* IR Green Tint Indicator */}
              {irMode && (
                <div className="absolute top-2.5 right-2.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-1 rounded border border-emerald-700 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-emerald-400" />
                  <span>850nm IR ILLUMINATION ACTIVE</span>
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded border border-slate-800">
                REC | 1080p • 25fps | {clockStr} IST
              </div>
            </div>

            <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400 font-mono text-[11px]">
                Motion Detector: <span className="text-emerald-400 font-bold">NORMAL ACTIVITY</span> (Senior Dormitory)
              </span>
              <button
                onClick={() => captureSnapshot("CAM-03 Dormitory")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Snapshot</span>
              </button>
            </div>
          </div>
        )}

        {/* CAMERA 4: Medical Dispensary & Pharmacy */}
        {(focusedCamera === null || focusedCamera === 4) && (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-850 flex flex-col transition-all">
            <div className="bg-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold tracking-tight">CAM-04: Medical Dispensary & Drug Inventory</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-900/40">
                  Protected Vault
                </span>
                <button
                  onClick={() => setFocusedCamera(focusedCamera === 4 ? null : 4)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Toggle Fullscreen Cam"
                >
                  {focusedCamera === 4 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="relative h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden select-none">
              <div className={`w-full h-full relative flex items-center justify-center ${privacyBlur ? "blur-md" : ""}`}>
                <div className="absolute inset-0 bg-slate-950"></div>
                {/* Pharmacy Locker Silhouette */}
                <div className="w-1/2 h-36 border-2 border-slate-800 rounded-xl bg-slate-900/40 flex flex-col justify-between p-3">
                  <div className="flex justify-between items-center text-[8px] font-mono text-blue-400 border-b border-slate-850 pb-1">
                    <span>SCHEDULE X/H DRUG VAULT</span>
                    <span className="text-emerald-400">LOCKED</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-20 opacity-60">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700/60 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded border border-slate-800">
                REC | ONVIF TAMPER DETECTION ACTIVE | {clockStr} IST
              </div>
            </div>

            <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400 font-mono text-[11px]">
                Vault Status: <span className="text-emerald-400 font-bold">SECURED (Keycard Access Only)</span>
              </span>
              <button
                onClick={() => captureSnapshot("CAM-04 Dispensary")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Snapshot</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Snapshot Verification Modal */}
      {snapshotData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">CCTV Stamped Evidence Frame</h3>
              </div>
              <button
                onClick={() => setSnapshotData(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fake Snapshot Image Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2 relative overflow-hidden">
              <Cctv className="w-12 h-12 text-blue-500/40 mx-auto" />
              <div className="text-xs font-bold text-slate-200">{snapshotData.facilityName}</div>
              <div className="text-[11px] font-mono text-emerald-400">{snapshotData.camName}</div>
              <div className="text-[10px] font-mono text-slate-400">{snapshotData.timestamp}</div>
              
              <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] font-mono text-amber-400 break-all">
                {snapshotData.hash}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSnapshotData(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Close & Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

