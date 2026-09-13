"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  ExternalLink,
  Building2,
  FileText,
  BadgeCheck,
  Radio
} from "lucide-react";
import officersSeed from "@/data/officers_seed.json";
import { Officer } from "@/types";
import { subscribeToDispatch } from "@/lib/dispatchStore";

export default function OfficersPage() {
  const [allOfficers, setAllOfficers] = useState<Officer[]>(officersSeed.officers || []);

  const fetchLiveOfficers = () => {
    fetch("/api/v1/officers")
      .then((res) => res.json())
      .then((data) => {
        if (data?.officers && Array.isArray(data.officers)) {
          setAllOfficers(data.officers);
        }
      })
      .catch((err) => console.error("Error fetching live officers:", err));
  };

  useEffect(() => {
    fetchLiveOfficers();
    const unsubscribe = subscribeToDispatch(() => {
      fetchLiveOfficers();
    });
    return () => unsubscribe();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [activeModalOfficer, setActiveModalOfficer] = useState<Officer | null>(null);

  // Filter officers
  const filteredOfficers = useMemo(() => {
    return allOfficers.filter((officer) => {
      const matchesSearch =
        officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        officer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        officer.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (officer.district && officer.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (officer.state && officer.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (officer.assigned_facility_name && officer.assigned_facility_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ASSIGNED" && officer.has_pending_assignment) ||
        (selectedStatus === "STANDBY" && !officer.has_pending_assignment);

      const matchesRole = selectedRole === "ALL" || officer.role === selectedRole;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [allOfficers, searchQuery, selectedStatus, selectedRole]);

  // Aggregate stats
  const assignedCount = allOfficers.filter((o) => o.has_pending_assignment).length;
  const standbyCount = allOfficers.length - assignedCount;
  const surpriseAuditorsCount = allOfficers.filter((o) => o.role === "SURPRISE_AUDITOR").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            <Users className="w-4 h-4" />
            <span>Field Vigilance Cadre</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Vigilance & Field Officers Directory
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Authorized statutory inspectors, surprise vigilance auditors, and field surveillance personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/form-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <span>Checklist Studio</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Total Cadre</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{allOfficers.length}</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">National Deployment</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Assigned to Audit</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{assignedCount} Dispatched</div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">Live field inspections</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">On Standby</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{standbyCount}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Ready for immediate dispatch</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Flying Squad Auditors</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{surpriseAuditorsCount}</div>
          <div className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold mt-0.5">Surprise Vigilance Wing</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by officer name, username, designation, district, or assigned home..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All Officers", value: "ALL" },
              { label: `Assigned (${assignedCount})`, value: "ASSIGNED" },
              { label: `Standby (${standbyCount})`, value: "STANDBY" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedStatus === tab.value
                    ? "bg-purple-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Cadre:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Roles</option>
              <option value="DISTRICT_INSPECTOR">District Inspector</option>
              <option value="SURPRISE_AUDITOR">Surprise Auditor (Flying Squad)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredOfficers.length}</strong> of {allOfficers.length} officers
          </span>
          {(searchQuery || selectedStatus !== "ALL" || selectedRole !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
                setSelectedRole("ALL");
              }}
              className="text-purple-700 hover:text-purple-900 font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Officer Profile</th>
                <th className="py-3 px-4">Designation & Role</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Assignment Status</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700">No officers found</p>
                      <p className="text-[11px]">
                        No vigilance officers matched your search criteria. Try resetting filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((officer) => {
                  const initials = officer.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={officer.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setActiveModalOfficer(officer)}
                    >
                      {/* Officer Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            officer.has_pending_assignment
                              ? "bg-amber-100 text-amber-800 border border-amber-300 ring-2 ring-amber-400/30"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                              {officer.full_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              @{officer.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Role */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">
                            {officer.designation}
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              officer.role === "SURPRISE_AUDITOR"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}>
                              {officer.role === "SURPRISE_AUDITOR" ? "Flying Squad" : "District Inspector"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {officer.district === "ALL" ? "All India Mandate" : officer.district || "State PMU"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            State: {officer.state === "ALL" ? "National Jurisdiction" : officer.state || "Central"}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {officer.jurisdiction_facility_ids?.length || 0} Registered Facilities
                          </div>
                        </div>
                      </td>

                      {/* Assignment Status */}
                      <td className="py-3.5 px-4">
                        {officer.has_pending_assignment ? (
                          <div className="space-y-1 max-w-[200px]">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <Radio className="w-3 h-3 text-amber-600 animate-spin" />
                              Assigned Audit
                            </span>
                            <div className="text-[11px] font-bold text-slate-800 truncate">
                              {officer.assigned_facility_name || "Facility Assigned"}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">
                              ID: {officer.assigned_inspection_id || "Active"}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Standing by
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Available for audit dispatch
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="text-[11px] flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{officer.email || "officer@dosje.gov.in"}</span>
                          </div>
                          <div className="text-[11px] flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{officer.phone || "+91-9876543210"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalOfficer(officer);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold rounded-lg transition-colors"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Profile Modal */}
      {activeModalOfficer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 relative">
              <button
                onClick={() => setActiveModalOfficer(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 text-amber-300 border border-white/20 flex items-center justify-center font-black text-xl shadow-inner">
                  {activeModalOfficer.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-bold uppercase">
                      {activeModalOfficer.role}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      GovCloud Verified
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">
                    {activeModalOfficer.full_name}
                  </h2>
                  <p className="text-xs text-purple-200">
                    {activeModalOfficer.designation} • @{activeModalOfficer.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Active Assignment Section */}
              {activeModalOfficer.has_pending_assignment ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-amber-600 animate-spin" />
                      Active Statutory Inspection Assignment
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      {activeModalOfficer.assigned_inspection_id}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="text-xs font-bold text-slate-900">
                      {activeModalOfficer.assigned_facility_name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Facility Code: <strong className="font-mono text-slate-700">{activeModalOfficer.assigned_facility_id}</strong></span>
                    </div>
                    {activeModalOfficer.assigned_inspections?.[0] && (
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3 pt-1 border-t border-slate-100">
                        <span>Scheme: {activeModalOfficer.assigned_inspections[0].scheme_name}</span>
                        {activeModalOfficer.assigned_inspections[0].latitude && (
                          <span>Target: {activeModalOfficer.assigned_inspections[0].latitude}° N, {activeModalOfficer.assigned_inspections[0].longitude}° E</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Current Status: Standing by</div>
                      <div className="text-[11px] text-slate-500">Officer is in pool and available for emergency or surprise statutory audits.</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase">
                    Ready
                  </span>
                </div>
              )}

              {/* Geographic Scope & Authorizations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Jurisdiction & Authorized Facilities
                </h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Assigned Territory:</span>
                    <strong className="text-slate-900">
                      {activeModalOfficer.district === "ALL" ? "All India (Flying Squad)" : `${activeModalOfficer.district}, ${activeModalOfficer.state}`}
                    </strong>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Authorized Facility IDs ({activeModalOfficer.jurisdiction_facility_ids?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeModalOfficer.jurisdiction_facility_ids?.map((facId) => (
                        <span
                          key={facId}
                          className="font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold"
                        >
                          {facId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Official Communication Channels
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Official Gov Email</div>
                    <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeModalOfficer.email || "officer@dosje.gov.in"}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Secured Mobile & OTP</div>
                    <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeModalOfficer.phone || "+91-9876543210"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveModalOfficer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close Profile
              </button>

              <Link
                href="/form-builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <span>Assign Checklist Audit</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
