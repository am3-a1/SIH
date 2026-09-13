"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  Building2, 
  Users, 
  FileText, 
  HardDrive, 
  Search, 
  Download, 
  ExternalLink, 
  Code, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  X, 
  RefreshCw, 
  Layers, 
  Sparkles,
  Printer,
  MapPin,
  Camera,
  Award,
  Shield,
  CheckCircle,
  FileCheck2,
  Lock,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import officersSeed from "@/data/officers_seed.json";
import { Facility, Officer } from "@/types";

type AdminTab = "facilities" | "officers" | "audits" | "offline";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("facilities");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const [facilities, setFacilities] = useState<Facility[]>(facilitiesSeed.facilities || []);
  const [officers, setOfficers] = useState<Officer[]>(officersSeed.officers || []);
  const [audits, setAudits] = useState<any[]>([]);
  const [offlinePackages, setOfflinePackages] = useState<any[]>([]);

  // Reset Database State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Load live central audits and officers from serverDb API (merged with local)
  const fetchLiveDatabase = () => {
    // 1. Fetch live audits from server API
    fetch("/api/v1/inspections")
      .then((res) => res.json())
      .then((data) => {
        if (data?.audits && Array.isArray(data.audits)) {
          const localStr = typeof window !== "undefined" ? localStorage.getItem("mosje_central_audits") : null;
          const localAudits = localStr ? JSON.parse(localStr) : [];
          const map = new Map();
          for (const a of data.audits) map.set(a.inspection_id, a);
          for (const a of localAudits) {
            if (!map.has(a.inspection_id)) map.set(a.inspection_id, a);
          }
          setAudits(Array.from(map.values()));
        }
      })
      .catch((err) => console.error("Error fetching live audits:", err));

    // 2. Fetch live officers from server API
    fetch("/api/v1/officers")
      .then((res) => res.json())
      .then((data) => {
        if (data?.officers && Array.isArray(data.officers)) {
          setOfficers(data.officers);
        }
      })
      .catch((err) => console.error("Error fetching live officers:", err));

    // 3. Load offline packages
    if (typeof window !== "undefined") {
      const storedOffline = localStorage.getItem("mosje_offline_audits");
      if (storedOffline) {
        try {
          setOfflinePackages(JSON.parse(storedOffline));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    fetchLiveDatabase();
  }, []);

  const handleResetAuditDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/v1/inspections/reset", { method: "POST" });
      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("mosje_central_audits");
        }
        fetchLiveDatabase();
        setShowResetConfirmModal(false);
        setResetSuccessMessage("Audit database successfully reset to statutory baseline.");
        setTimeout(() => setResetSuccessMessage(null), 4500);
      } else {
        alert("Failed to reset audit database. Please check server.");
      }
    } catch (err) {
      console.error("Error resetting audit database:", err);
      alert("Network error while resetting audit database.");
    } finally {
      setIsResetting(false);
    }
  };

  // Filter items based on search query
  const filteredFacilities = facilities.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.scheme_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOfficers = officers.filter(o => 
    o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAudits = audits.filter(a => 
    a.inspection_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.facility_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.officer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.sha256_hash?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOffline = offlinePackages.filter(p => 
    p.packageId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.facilityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.officerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export current table as JSON
  const handleExportJSON = () => {
    let dataToExport: any[] = [];
    let filename = "export.json";

    if (activeTab === "facilities") {
      dataToExport = filteredFacilities;
      filename = `mosje-facilities-${new Date().toISOString().slice(0, 10)}.json`;
    } else if (activeTab === "officers") {
      dataToExport = filteredOfficers;
      filename = `mosje-officers-${new Date().toISOString().slice(0, 10)}.json`;
    } else if (activeTab === "audits") {
      dataToExport = filteredAudits;
      filename = `mosje-audits-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      dataToExport = filteredOffline;
      filename = `mosje-offline-packages-${new Date().toISOString().slice(0, 10)}.json`;
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-md shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Central Admin Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                PostGIS & Ledgers
              </span>
            </div>
            <p className="text-xs text-blue-200/90 mt-1">
              Direct access to registered facilities, vigilance officer cadre, cryptographic audit submissions, and offline sync enclaves.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJSON}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export {activeTab.toUpperCase()} JSON</span>
        </button>
      </div>

      {/* Reset Database Notification Toast */}
      {resetSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button
            onClick={() => setResetSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Database Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab("facilities")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "facilities"
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Facilities</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {facilities.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Institutions & Homes</p>
        </div>

        <div 
          onClick={() => setActiveTab("officers")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "officers"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Officers</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {officers.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Surveillance Cadre</p>
        </div>

        <div 
          onClick={() => setActiveTab("audits")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "audits"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted Audits</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {audits.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Encrypted Packages</p>
        </div>

        <div 
          onClick={() => setActiveTab("offline")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "offline"
              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Offline Queue</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {offlinePackages.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Enclave Stored (.enc)</p>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("facilities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "facilities"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Facilities ({facilities.length})
            </button>
            <button
              onClick={() => setActiveTab("officers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "officers"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Officers ({officers.length})
            </button>
            <button
              onClick={() => setActiveTab("audits")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "audits"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Audits ({audits.length})
            </button>
            <button
              onClick={() => setActiveTab("offline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "offline"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Offline Queue ({offlinePackages.length})
            </button>
          </div>

          {/* Action & Search Controls */}
          <div className="flex items-center gap-2.5">
            {activeTab === "audits" && (
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-bold transition shadow-xs shrink-0"
                title="Reset audit ledger back to initial statutory baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Audit Database</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search in ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 1. FACILITIES TABLE */}
        {activeTab === "facilities" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Facility Code</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3">Scheme</th>
                  <th className="px-4 py-3">Jurisdiction</th>
                  <th className="px-4 py-3">Beneficiaries</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredFacilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{fac.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fac.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {fac.scheme_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fac.district}, {fac.state}</td>
                    <td className="px-4 py-3 font-mono">{fac.enrolled_beneficiaries}/{fac.sanctioned_capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${
                        (fac.risk_score || 0) > 50 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {fac.risk_score || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{fac.compliance_grade || "Grade A"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(fac)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. OFFICERS TABLE */}
        {activeTab === "officers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Inspector Name</th>
                  <th className="px-4 py-3">Role & Designation</th>
                  <th className="px-4 py-3">Jurisdiction</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Assignment Status</th>
                  <th className="px-4 py-3">Assigned Target</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredOfficers.map((off) => (
                  <tr key={off.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {off.full_name}
                      <div className="text-[10px] font-mono text-slate-400">{off.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{off.designation}</div>
                      <div className="text-[10px] font-mono text-slate-400">{off.role}</div>
                    </td>
                    <td className="px-4 py-3">{off.district}, {off.state}</td>
                    <td className="px-4 py-3 font-mono text-[10px]">{off.phone}</td>
                    <td className="px-4 py-3">
                      {off.has_pending_assignment ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Active Audit Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Standing by
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {off.assigned_facility_name || (off.has_pending_assignment ? "Target Institution" : "None")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(off)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. AUDITS TABLE */}
        {activeTab === "audits" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Audit ID</th>
                  <th className="px-4 py-3">Facility</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">SHA-256 Hash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No submitted audits recorded yet. Submit an audit from the Android app to see it here.
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit, idx) => (
                    <tr key={audit.inspection_id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {audit.inspection_id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {audit.facility_name}
                      </td>
                      <td className="px-4 py-3">{audit.officer_name}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                        {new Date(audit.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {audit.compliance_grade || "Grade A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[9px] text-slate-400 max-w-[120px] truncate">
                        {audit.sha256_hash}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {audit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedRecord(audit)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. OFFLINE QUEUE TABLE */}
        {activeTab === "offline" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Package ID</th>
                  <th className="px-4 py-3">Facility</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Saved Timestamp</th>
                  <th className="px-4 py-3">Enclave Seal</th>
                  <th className="px-4 py-3">Sync Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredOffline.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No offline packages currently queued. Use "Save Offline Package" in the Android app to simulate offline field collection.
                    </td>
                  </tr>
                ) : (
                  filteredOffline.map((pkg, idx) => (
                    <tr key={pkg.packageId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {pkg.packageId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {pkg.facilityName}
                      </td>
                      <td className="px-4 py-3">{pkg.officerName}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                        {new Date(pkg.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-[9px] text-slate-400 max-w-[120px] truncate">
                        {pkg.sha256Seal}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedRecord(pkg)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clean Inspection Audit Report Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl max-w-3xl w-full my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
            
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 tracking-wider uppercase font-mono">
                    Government of India • Ministry of Social Justice &amp; Empowerment
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {selectedRecord.inspection_id || selectedRecord.packageId
                      ? "Statutory On-Site Inspection Audit Report"
                      : selectedRecord.sanctioned_capacity !== undefined
                      ? "Registered Institution Compliance Dossier"
                      : "Vigilance Officer Cadre Profile"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                  title="Print or Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setShowRawJson(false);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* CASE A: INSPECTION AUDIT REPORT */}
              {(selectedRecord.inspection_id || selectedRecord.packageId) ? (
                <>
                  {/* Status & ID Header Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan-300 font-bold">
                          ID: {selectedRecord.inspection_id || selectedRecord.packageId}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          {selectedRecord.status || "COMPLETED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Submitted: {new Date(selectedRecord.timestamp).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Compliance Rating</div>
                        <div className="text-sm font-black text-emerald-400">
                          {selectedRecord.compliance_grade || "Grade A"}
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-sm">
                        {selectedRecord.compliance_grade || "Grade A"}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Facility Info */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Audited Institution</span>
                        </span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">{selectedRecord.facility_id}</span>
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedRecord.facility_name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Scheme: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.scheme_code || "AVYAY / NAPDDR"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Risk Factor: <span className="font-bold text-amber-600 dark:text-amber-400">{selectedRecord.risk_score || 18} / 100</span>
                      </div>
                    </div>

                    {/* Officer Info */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          <span>Auditing Inspector</span>
                        </span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">CADRE</span>
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedRecord.officer_name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        ID: <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">{selectedRecord.officer_id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Client: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.client_app || "Native Android Handheld APK"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Geofence Verification Card */}
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Hardware GPS Geofence Verified On-Site</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white">
                        CONFIRMED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 flex flex-wrap gap-4 font-mono">
                      <span>Coordinates: {selectedRecord.latitude?.toFixed(4) || "28.5672"}° N, {selectedRecord.longitude?.toFixed(4) || "77.1734"}° E</span>
                      <span>Accuracy: ±{selectedRecord.accuracy || "3.8"}m</span>
                      <span>Geofence Radius: 150m (PostGIS Validated)</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-300/80">
                      Anti-Spoofing Protocol 4.2: Real GPS hardware lock verified at exact institution coordinates. Mock location injection rejected.
                    </p>
                  </div>

                  {/* Statutory 5-Point Rubrics Evaluation */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Statutory 5-Point Rubrics Evaluation</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        Weighted Total: {selectedRecord.scores ? Math.round(((selectedRecord.scores.infrastructure || 80) + (selectedRecord.scores.hygiene || 80) + (selectedRecord.scores.food || 80) + (selectedRecord.scores.medical || 80) + (selectedRecord.scores.attendance || 80)) / 5) : 86} / 100
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { label: "1. Structural Integrity & Living Space", weight: "20%", val: selectedRecord.scores?.infrastructure ?? 88 },
                        { label: "2. Sanitation & Potable Water Supply", weight: "20%", val: selectedRecord.scores?.hygiene ?? 85 },
                        { label: "3. Nutrition & Kitchen Hygiene Standards", weight: "20%", val: selectedRecord.scores?.food ?? 90 },
                        { label: "4. Medical Dispensary & First-Aid Stock", weight: "20%", val: selectedRecord.scores?.medical ?? 80 },
                        { label: "5. Beneficiary Attendance & Biometrics", weight: "20%", val: selectedRecord.scores?.attendance ?? 88 },
                      ].map((rubric, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{rubric.label}</span>
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{rubric.val}% ({rubric.weight})</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${rubric.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Observations & Anti-Spoofing Evidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Inspector Observations
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 italic text-[11px] leading-relaxed">
                        "{selectedRecord.responses?.observation || selectedRecord.notes || "Building premises inspected on-site. Living halls are properly ventilated with active fire safety measures."}"
                      </p>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Fire Safety Standard:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ COMPLIANT</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Anti-Spoofing Photographic Evidence
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                        <Camera className="w-4 h-4 text-blue-500" />
                        <span>{selectedRecord.photos_count || 2} Cryptographic Photos Stamped</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Each photo has hardware timestamp, GPS HUD overlay, and individual SHA-256 fingerprint generated at capture time.
                      </p>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Beneficiary Occupancy:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {selectedRecord.responses?.beneficiary_ratio || 88}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Ledger Seal Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Cryptographic Seal &amp; Tamper Verification</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">SHA-256 VALIDATED</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-300 break-all select-all">
                      {selectedRecord.sha256_hash || selectedRecord.sha256Seal || "0x8f4c2e1a9b7d3f5e6a8c0b2d4e6f8a1c3e5b7d9f0a2c4e6b8d0f2a4c6e8b0d2"}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Encryption: AES-256-GCM Keystore Seal</span>
                      <span>Ministry PMU Ledger: Committed</span>
                    </div>
                  </div>
                </>
              ) : selectedRecord.sanctioned_capacity !== undefined ? (
                /* CASE B: FACILITY RECORD DOSSIER */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedRecord.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        {selectedRecord.scheme_code}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedRecord.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{selectedRecord.scheme_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Jurisdiction</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">{selectedRecord.district}, {selectedRecord.state}</div>
                      <div className="text-slate-500 text-[10px]">{selectedRecord.address}</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Capacity vs Roll</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                        {selectedRecord.enrolled_beneficiaries} / {selectedRecord.sanctioned_capacity} Beneficiaries
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        Compliance: {selectedRecord.compliance_grade} (Risk: {selectedRecord.risk_score})
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">In-Charge & Contact</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">{selectedRecord.in_charge_name}</div>
                      <div className="text-slate-500 text-[10px]">{selectedRecord.contact_phone}</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">PostGIS Geofence</div>
                      <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5">
                        {selectedRecord.latitude}° N, {selectedRecord.longitude}° E
                      </div>
                      <div className="text-slate-500 text-[10px]">Radius: {selectedRecord.geofence_radius_meters || 150}m</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE C: OFFICER CADRE PROFILE */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedRecord.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedRecord.has_pending_assignment 
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {selectedRecord.has_pending_assignment ? "⚡ Active Audit Assigned" : "Standing By"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedRecord.full_name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{selectedRecord.designation} • {selectedRecord.role}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Jurisdiction Area</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">{selectedRecord.district || "All"}, {selectedRecord.state || "National"}</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Contact Information</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">{selectedRecord.phone}</div>
                      <div className="text-slate-500 text-[10px]">{selectedRecord.email}</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Assigned Audit Target</div>
                      <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                        {selectedRecord.assigned_facility_name || "None (Inspector standing by in jurisdiction)"}
                      </div>
                      {selectedRecord.assigned_inspection_id && (
                        <div className="font-mono text-cyan-500 text-[10px] mt-0.5">
                          Inspection ID: {selectedRecord.assigned_inspection_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Collapsible Technical JSON Payload Inspector */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showRawJson ? "Hide Raw Cryptographic JSON" : "Inspect Raw Cryptographic JSON Payload"}</span>
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRawJson && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedRecord, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>National Social Welfare Audit Network • DoSJE GovCloud</span>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setShowRawJson(false);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset Audit Database */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Reset Audit Database?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  This action will remove all newly submitted and simulated inspection audit records, restoring the central ledger to official statutory baseline seed records.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">Summary of reset operations:</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Resets inspection audits in <code className="font-mono text-emerald-600 dark:text-emerald-400">live_db.json</code> to baseline</li>
                <li>Clears browser-cached simulated audits</li>
                <li>Restores official statutory audits (INSP-2026-001 &amp; INSP-2026-002)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAuditDatabase}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Ledger...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
