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
  Sparkles
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import officersSeed from "@/data/officers_seed.json";
import { Facility, Officer } from "@/types";

type AdminTab = "facilities" | "officers" | "audits" | "offline";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("facilities");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const facilities: Facility[] = facilitiesSeed.facilities || [];
  const officers: Officer[] = officersSeed.officers || [];

  const [audits, setAudits] = useState<any[]>([]);
  const [offlinePackages, setOfflinePackages] = useState<any[]>([]);

  // Load live central audits and offline packages from localStorage
  useEffect(() => {
    try {
      const storedAudits = localStorage.getItem("mosje_central_audits");
      if (storedAudits) {
        setAudits(JSON.parse(storedAudits));
      } else {
        // Fallback demo audit entries
        setAudits([
          {
            inspection_id: "INSP-2026-001",
            facility_id: "DOSJE-DL-001",
            facility_name: "Snehalaya Senior Citizens Home",
            officer_id: "33333333-3333-3333-3333-333333333333",
            officer_name: "Sunita Rao",
            timestamp: "2026-09-12T14:30:00.000Z",
            status: "COMPLETED",
            compliance_grade: "Grade A",
            risk_score: 18,
            sha256_hash: "0x8f4c2e1a9b7d3f5e6a8c0b2d4e6f8a1c3e5b7d9f0a2c4e6b8d0f2a4c6e8b0d2",
            responses: { q_infra: "Compliant", q_hygiene: "Excellent", q_food: 88 }
          },
          {
            inspection_id: "INSP-2026-002",
            facility_id: "DOSJE-PB-002",
            facility_name: "Nasha Mukti Punarvas Kendra (IRCA)",
            officer_id: "44444444-4444-4444-4444-444444444444",
            officer_name: "Vikramaditya Roy",
            timestamp: "2026-09-12T11:15:00.000Z",
            status: "COMPLETED",
            compliance_grade: "Grade B",
            risk_score: 55,
            sha256_hash: "0x3b7d5e9a1c4f6e8b0d2a4c6e8f0a2c4e6b8d0f2a4c6e8b0d2a4c6e8f0a2c4e6",
            responses: { q_infra: "Requires Maintenance", q_hygiene: "Fair", q_food: 65 }
          }
        ]);
      }

      const storedOffline = localStorage.getItem("mosje_offline_audits");
      if (storedOffline) {
        setOfflinePackages(JSON.parse(storedOffline));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

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

          {/* Search Input */}
          <div className="relative min-w-[240px]">
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

      {/* Raw Record JSON Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">
                  Database Record Inspector (JSON)
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-400 bg-slate-950 rounded-b-2xl">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
