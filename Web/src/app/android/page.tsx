"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Smartphone, 
  ShieldCheck, 
  Shield, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  LogOut, 
  Wifi, 
  Signal, 
  Battery, 
  Compass, 
  Building2, 
  Users, 
  Lock, 
  FileEdit,
  ExternalLink,
  ChevronRight,
  Upload,
  Sparkles
} from "lucide-react";
import officersSeed from "@/data/officers_seed.json";
import facilitiesSeed from "@/data/facilities_seed.json";
import { Officer, Facility, ChecklistForm, Question } from "@/types";
import { getStoredChecklist, subscribeToChecklist } from "@/lib/checklistStore";
import { getLatestDispatch, subscribeToDispatch } from "@/lib/dispatchStore";

export default function AndroidAppPage() {
  const allOfficers: Officer[] = officersSeed.officers || [];
  const allFacilities: Facility[] = facilitiesSeed.facilities || [];

  // Active Checklist State (synced with Form Builder)
  const [checklist, setChecklist] = useState<ChecklistForm>(getStoredChecklist());

  // App Screen State: 'login' | 'audit' | 'success'
  const [screen, setScreen] = useState<"login" | "audit" | "success">("login");

  // Selected Officer
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(allOfficers[0]?.id || "");
  const [selectedOfficer, setSelectedOfficer] = useState<Officer>(allOfficers[0]);

  // Selected Facility
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(allFacilities[0]?.id || "");
  const [selectedFacility, setSelectedFacility] = useState<Facility>(allFacilities[0]);

  // GPS Simulation & Geofence
  const [isOnsite, setIsOnsite] = useState<boolean>(true);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number }>({
    lat: allFacilities[0]?.latitude || 28.5672,
    lng: allFacilities[0]?.longitude || 77.1734,
  });

  // Form Field Values (filled by inspector)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionHash, setSubmissionHash] = useState<string>("");

  // Hidden file input for authentic photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoQuestionId, setActivePhotoQuestionId] = useState<string | null>(null);

  // Subscribe to Form Builder changes
  useEffect(() => {
    setChecklist(getStoredChecklist());
    const unsubscribe = subscribeToChecklist((updated) => {
      setChecklist(updated);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Dispatch changes
  useEffect(() => {
    const unsubscribeDispatch = subscribeToDispatch((dispatch) => {
      // Find officer and facility
      const off = allOfficers.find(o => o.id === dispatch.officerId);
      const fac = allFacilities.find(f => f.id === dispatch.facilityId);
      if (off) {
        setSelectedOfficerId(off.id);
        setSelectedOfficer(off);
      }
      if (fac) {
        setSelectedFacilityId(fac.id);
        setSelectedFacility(fac);
        setDeviceCoords({ lat: fac.latitude, lng: fac.longitude });
      }
    });
    return () => unsubscribeDispatch();
  }, [allOfficers, allFacilities]);

  // Handle officer change
  const handleOfficerChange = (id: string) => {
    setSelectedOfficerId(id);
    const found = allOfficers.find((o) => o.id === id);
    if (found) {
      setSelectedOfficer(found);
      // If officer has assigned facility, select it
      if (found.assigned_facility_id) {
        const assignedFac = allFacilities.find((f) => f.id === found.assigned_facility_id);
        if (assignedFac) {
          setSelectedFacilityId(assignedFac.id);
          setSelectedFacility(assignedFac);
          setDeviceCoords({ lat: assignedFac.latitude, lng: assignedFac.longitude });
        }
      }
    }
  };

  // Handle facility change
  const handleFacilityChange = (id: string) => {
    setSelectedFacilityId(id);
    const found = allFacilities.find((f) => f.id === id);
    if (found) {
      setSelectedFacility(found);
      if (isOnsite) {
        setDeviceCoords({ lat: found.latitude, lng: found.longitude });
      }
    }
  };

  // Toggle onsite simulation
  const handleToggleOnsite = (onsite: boolean) => {
    setIsOnsite(onsite);
    if (onsite && selectedFacility) {
      setDeviceCoords({ lat: selectedFacility.latitude, lng: selectedFacility.longitude });
    } else if (!onsite && selectedFacility) {
      // Move 4.2 km away
      setDeviceCoords({ lat: selectedFacility.latitude + 0.04, lng: selectedFacility.longitude + 0.04 });
    }
  };

  // Watermarked Photo Generation (Canvas based with high contrast HUD)
  const generateWatermarkedPhoto = (questionId: string, category: string, fileImage?: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (fileImage) {
      ctx.drawImage(fileImage, 0, 0, 640, 480);
    } else {
      // Background gradient simulation for on-site scene
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(0.5, "#334155");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // On-site grid pattern
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 480);
        ctx.stroke();
      }
      for (let j = 0; j < 480; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(640, j);
        ctx.stroke();
      }

      // Center subject icon / label
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`VERIFIED ON-SITE EVIDENCE: ${category.toUpperCase()}`, 320, 230);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Target: ${selectedFacility?.name || "MoSJE Institution"}`, 320, 260);
    }

    // Top Statutory Banner
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fillRect(0, 0, 640, 50);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("MoSJE STATUTORY FIELD AUDIT • GOVT OF INDIA", 20, 24);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "11px monospace";
    ctx.fillText(`EVIDENCE: ${category.toUpperCase()} • ${selectedFacility?.id || "DOSJE-001"}`, 20, 42);

    // Bottom Cryptographic HUD Banner
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fillRect(0, 410, 640, 70);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`GPS: ${deviceCoords.lat.toFixed(4)}° N, ${deviceCoords.lng.toFixed(4)}° E • ACCURACY ±3.8m`, 20, 430);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px monospace";
    const nowIso = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    ctx.fillText(`TIMESTAMP: ${nowIso} • INSPECTOR: ${selectedOfficer?.full_name || "Auditor"}`, 20, 448);
    ctx.fillStyle = "#94a3b8";
    const randomHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    ctx.fillText(`SHA-256 SEAL: ${randomHash.substring(0, 42)}...`, 20, 466);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhotos((prev) => ({ ...prev, [questionId]: dataUrl }));
  };

  // Photo file upload handler
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoQuestionId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const q = checklist.questions.find((item) => item.id === activePhotoQuestionId);
        generateWatermarkedPhoto(activePhotoQuestionId, q?.photoCategory || "Evidence", img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Encrypted Audit
  const handleSubmitAudit = () => {
    if (!isOnsite) {
      alert("GPS GEOFENCE BREACH: You are outside the authorized facility perimeter! The audit cannot be submitted until live GPS verifies you are on-site.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      setSubmissionHash(generatedHash);
      setIsSubmitting(false);
      setScreen("success");
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input for Real Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      {/* Synchronized Notice Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl border border-blue-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">
                Working Android Handheld Station
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono font-bold">
                Live Form Sync Active
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Simulates the official native Android APK client. Inspection questions update in real-time as you modify the checklist in Form Builder.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/form-builder"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all shrink-0"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Edit Questions in Form Builder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Area with Centered Phone Frame */}
      <div className="flex justify-center py-2">
        {/* Smartphone Frame */}
        <div className="w-full max-w-[390px] h-[830px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative select-none ring-1 ring-slate-900/40 flex flex-col">
          {/* Dynamic Island / Speaker */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-blue-950"></div>
          </div>

          {/* Screen Container */}
          <div className="bg-slate-900 text-slate-100 rounded-[38px] overflow-hidden flex flex-col flex-1 relative">
            {/* Status Bar */}
            <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-20">
              <span className="font-mono">09:41</span>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mobile Header */}
            <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 backdrop-blur-sm z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[11px] font-black text-white uppercase tracking-wider">
                    MoSJE Handheld Client
                  </div>
                  <div className="text-[9px] text-blue-200">
                    {screen === "login" ? "OAuth2 SSO Gateway" : selectedOfficer?.full_name}
                  </div>
                </div>
              </div>

              {screen !== "login" && (
                <button
                  onClick={() => setScreen("login")}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Switch</span>
                </button>
              )}
            </div>

            {/* =========================================================================
                 SCREEN 1: OFFICER LOGIN
            ========================================================================== */}
            {screen === "login" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4">
                <div className="text-center pt-3 space-y-1.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/80 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-sm font-black text-white">
                    Inspector Authentication
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Central Field Surveillance Cadre • GovCloud SSO
                  </p>
                </div>

                <div className="space-y-3 my-auto">
                  {/* Officer Select */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Choose Field Inspector (52 Available)
                    </label>
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => handleOfficerChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {allOfficers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.full_name} ({o.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Officer Status Card */}
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        Cadre Status
                      </span>
                      {selectedOfficer.has_pending_assignment ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          Active Audit Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-700 text-slate-300">
                          Standing by
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-white">
                      {selectedOfficer.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedOfficer.designation} • {selectedOfficer.role}
                    </div>

                    {selectedOfficer.has_pending_assignment && (
                      <div className="pt-2 border-t border-slate-700/80 text-[10px] text-amber-300 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Unannounced Statutory Audit Target:</span>
                        </div>
                        <div className="font-semibold text-white">
                          {selectedOfficer.assigned_facility_name || "Assigned Institution"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GovCloud PIN */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      GovCloud Authenticator PIN
                    </label>
                    <input
                      type="password"
                      value="••••••••"
                      disabled
                      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-slate-400"
                    />
                  </div>

                  {/* Sign In CTA */}
                  <button
                    onClick={() => setScreen("audit")}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Unlock Handheld Audit Station</span>
                  </button>
                </div>

                <div className="text-center text-[9px] text-slate-500 font-mono pb-1">
                  PostGIS Geofence • AES-256-GCM Cryptographic Enclave
                </div>
              </div>
            )}

            {/* =========================================================================
                 SCREEN 2: WORKING AUDIT STATION
            ========================================================================== */}
            {screen === "audit" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* GPS Geofence Radar Status */}
                  <div className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isOnsite 
                      ? "bg-emerald-950/50 border-emerald-800 text-emerald-200" 
                      : "bg-rose-950/60 border-rose-800 text-rose-200"
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isOnsite ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] text-emerald-300 uppercase">GPS Geofence Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-[11px] text-rose-300 uppercase">Geofence Breach (Offsite)</span>
                          </>
                        )}
                      </div>

                      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOnsite}
                          onChange={(e) => handleToggleOnsite(e.target.checked)}
                          className="accent-blue-500 rounded"
                        />
                        <span>Simulate Onsite</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono bg-black/30 p-1.5 rounded-lg">
                      <span>{deviceCoords.lat.toFixed(4)}° N, {deviceCoords.lng.toFixed(4)}° E</span>
                      <span className={isOnsite ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {isOnsite ? "Within 150m Perimeter" : "4.2 km Away (Locked)"}
                      </span>
                    </div>
                  </div>

                  {/* Target Facility Card */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Auditing Institution
                      </span>
                      <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                        {selectedFacility?.scheme_code}
                      </span>
                    </div>

                    <select
                      value={selectedFacilityId}
                      onChange={(e) => handleFacilityChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none"
                    >
                      {allFacilities.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.district})
                        </option>
                      ))}
                    </select>

                    <div className="text-[9px] text-slate-400 flex justify-between">
                      <span>Cap: {selectedFacility?.enrolled_beneficiaries}/{selectedFacility?.sanctioned_capacity}</span>
                      <span>Grade: {selectedFacility?.compliance_grade} (Risk: {selectedFacility?.risk_score})</span>
                    </div>
                  </div>

                  {/* Checklist Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{checklist.title || "Statutory Checklist"}</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      {checklist.questions?.length || 0} Items
                    </span>
                  </div>

                  {/* Dynamic Questions Form (Synced from Form Builder) */}
                  <div className="space-y-2.5">
                    {checklist.questions?.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-2.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-700 text-amber-300 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-[11px] font-bold text-white leading-tight">
                                {q.title}
                                {q.required && <span className="text-rose-400 ml-1">*</span>}
                              </div>
                              {q.description && (
                                <p className="text-[9px] text-slate-400 mt-0.5">{q.description}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 1. TEXT QUESTION */}
                        {q.type === "text" && (
                          <input
                            type="text"
                            placeholder={q.placeholder || "Enter inspector observation..."}
                            value={formResponses[q.id] || ""}
                            onChange={(e) => setFormResponses({ ...formResponses, [q.id]: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-blue-500"
                          />
                        )}

                        {/* 2. YES/NO QUESTION */}
                        {q.type === "yes_no" && (
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setFormResponses({ ...formResponses, [q.id]: true })}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                  formResponses[q.id] === true
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{q.positiveLabel || "Compliant"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormResponses({ ...formResponses, [q.id]: false })}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                  formResponses[q.id] === false
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700"
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{q.negativeLabel || "Breach"}</span>
                              </button>
                            </div>

                            {q.criticalFailure && formResponses[q.id] === false && (
                              <div className="p-1.5 bg-rose-950/80 border border-rose-800 rounded-md flex items-center gap-1 text-[8px] text-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Statutory Breach: Dispatches high-priority PMU alert</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. NUMBER RANGE QUESTION */}
                        {q.type === "number_range" && (
                          <div className="space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">Recorded Value:</span>
                              <span className="font-mono font-bold text-amber-300">
                                {formResponses[q.id] ?? q.targetThreshold ?? q.min ?? 0} {q.unit || ""}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={q.min ?? 0}
                              max={q.max ?? 100}
                              step={q.step ?? 1}
                              value={formResponses[q.id] ?? q.targetThreshold ?? q.min ?? 0}
                              onChange={(e) => setFormResponses({ ...formResponses, [q.id]: Number(e.target.value) })}
                              className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                              <span>Min: {q.min ?? 0}</span>
                              {q.targetThreshold !== undefined && (
                                <span className="text-amber-400">Target: {q.targetThreshold}</span>
                              )}
                              <span>Max: {q.max ?? 100}</span>
                            </div>
                          </div>
                        )}

                        {/* 4. PHOTO EVIDENCE QUESTION */}
                        {q.type === "photo_evidence" && (
                          <div className="space-y-2">
                            {capturedPhotos[q.id] ? (
                              <div className="space-y-1">
                                <div className="rounded-lg overflow-hidden border border-slate-700 relative">
                                  <img
                                    src={capturedPhotos[q.id]}
                                    alt="Watermarked Site Evidence"
                                    className="w-full h-28 object-cover"
                                  />
                                  <div className="absolute top-1 left-1 bg-black/70 text-emerald-300 text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>GPS & Timestamp Watermarked</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => generateWatermarkedPhoto(q.id, q.photoCategory || "Evidence")}
                                  className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-semibold flex items-center justify-center gap-1 transition"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Retake Photo</span>
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => generateWatermarkedPhoto(q.id, q.photoCategory || "Evidence")}
                                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition group"
                                >
                                  <Camera className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] font-bold text-slate-200">
                                    Snap On-site Photo
                                  </span>
                                  <span className="text-[7px] text-slate-400">
                                    Watermark HUD stamped
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePhotoQuestionId(q.id);
                                    fileInputRef.current?.click();
                                  }}
                                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition group"
                                >
                                  <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] font-bold text-slate-200">
                                    Upload Real Photo
                                  </span>
                                  <span className="text-[7px] text-slate-400">
                                    Stamps HUD dynamically
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Audit Action */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5 mt-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitAudit}
                    className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isOnsite
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing AES-256 Package...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-300" />
                        <span>Submit Encrypted Audit to DoSJE</span>
                      </>
                    )}
                  </button>
                  <div className="text-center text-[8px] font-mono text-slate-500">
                    Geofenced Digital Signature • Immutable Central Ledger
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                 SCREEN 3: AUDIT SUBMITTED SUCCESS
            ========================================================================== */}
            {screen === "success" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between items-center text-center space-y-4">
                <div className="my-auto space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-95">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-white">
                      Audit Submitted Successfully!
                    </h2>
                    <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                      Encrypted & Logged to Central MoSJE PMU
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-left space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Inspection ID:</span>
                      <strong className="font-mono text-white">INSP-2026-SUBMITTED</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Audited Facility:</span>
                      <strong className="text-white truncate max-w-[150px]">{selectedFacility?.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Auditor:</span>
                      <strong className="text-white">{selectedOfficer?.full_name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Geofence Status:</span>
                      <strong className="text-emerald-400">VERIFIED ON-SITE</strong>
                    </div>
                    <div className="pt-1 border-t border-slate-700 text-[8px] font-mono text-slate-400 break-all">
                      SHA-256 SEAL: {submissionHash}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFormResponses({});
                      setCapturedPhotos({});
                      setScreen("audit");
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    Start Another Inspection
                  </button>
                </div>

                <div className="text-center text-[9px] font-mono text-slate-500">
                  GovCloud Synchronization Complete
                </div>
              </div>
            )}

            {/* Home Bar */}
            <div className="pb-1.5 pt-0.5 flex justify-center">
              <div className="w-24 h-1 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
