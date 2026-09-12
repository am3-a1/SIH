"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Compass, 
  Users, 
  ExternalLink,
  Layers,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import { Facility } from "@/types";

export default function FacilitiesPage() {
  const allFacilities: Facility[] = facilitiesSeed.facilities || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");
  const [activeModalFacility, setActiveModalFacility] = useState<Facility | null>(null);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return allFacilities.filter((facility) => {
      const matchesSearch = 
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.in_charge_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.organization_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScheme = selectedScheme === "ALL" || facility.scheme_code === selectedScheme;
      const matchesGrade = selectedGrade === "ALL" || facility.compliance_grade === selectedGrade;

      return matchesSearch && matchesScheme && matchesGrade;
    });
  }, [allFacilities, searchQuery, selectedScheme, selectedGrade]);

  // Aggregate stats
  const totalCapacity = allFacilities.reduce((sum, f) => sum + (f.sanctioned_capacity || 0), 0);
  const totalEnrolled = allFacilities.reduce((sum, f) => sum + (f.enrolled_beneficiaries || 0), 0);
  const avgOccupancy = Math.round((totalEnrolled / (totalCapacity || 1)) * 100);
  const gradeACount = allFacilities.filter(f => f.compliance_grade === "A").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Building2 className="w-4 h-4" />
            <span>National Institution Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Registered Welfare Facilities Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified NGO and State run homes receiving Ministry of Social Justice & Empowerment statutory grants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/form-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <span>Create Checklist</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Institutions</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{allFacilities.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Geo-mapped</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Beneficiaries</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{totalEnrolled}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Of {totalCapacity} sanctioned</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Occupancy Rate</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{avgOccupancy}%</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">National Average</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Grade A Standard</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{gradeACount} / {allFacilities.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">High Compliance</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by facility name, ID, district, state, or in-charge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
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

          {/* Scheme Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "AVYAY", "NAPDDR", "PM-AJAY"].map((scheme) => (
              <button
                key={scheme}
                onClick={() => setSelectedScheme(scheme)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedScheme === scheme
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {scheme === "ALL" ? "All Schemes" : scheme}
              </button>
            ))}
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Grades</option>
              <option value="A">Grade A (Exemplary)</option>
              <option value="B">Grade B (Satisfactory)</option>
              <option value="C">Grade C (Action Required)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredFacilities.length}</strong> of {allFacilities.length} facilities
          </span>
          {(searchQuery || selectedScheme !== "ALL" || selectedGrade !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedScheme("ALL");
                setSelectedGrade("ALL");
              }}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Facilities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Facility Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4 text-center">Compliance</th>
                <th className="py-3 px-4">Geofence (GPS)</th>
                <th className="py-3 px-4">In-Charge Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700">No facilities found</p>
                      <p className="text-[11px]">
                        No registered institutions matched your search filter criteria. Try resetting filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((facility) => {
                  const occupancyPct = Math.round(
                    (facility.enrolled_beneficiaries / (facility.sanctioned_capacity || 1)) * 100
                  );

                  return (
                    <tr 
                      key={facility.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setActiveModalFacility(facility)}
                    >
                      {/* Facility Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {facility.name}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                              {facility.id}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              facility.scheme_code === "AVYAY"
                                ? "bg-blue-100 text-blue-800"
                                : facility.scheme_code === "NAPDDR"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {facility.scheme_code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {facility.organization_name}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {facility.district}, {facility.state}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {facility.address}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            PIN: {facility.pincode}
                          </div>
                        </div>
                      </td>

                      {/* Occupancy */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900">
                              {facility.enrolled_beneficiaries}
                            </span>
                            <span className="text-slate-400 font-mono">
                              / {facility.sanctioned_capacity}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                occupancyPct > 90 
                                  ? "bg-amber-500" 
                                  : occupancyPct > 70 
                                  ? "bg-blue-600" 
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {occupancyPct}% utilized
                          </div>
                        </div>
                      </td>

                      {/* Compliance Grade */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                            facility.compliance_grade === "A"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : facility.compliance_grade === "B"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}>
                            {facility.compliance_grade}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 mt-1">
                            Risk {facility.risk_score}/100
                          </span>
                        </div>
                      </td>

                      {/* Geofence GPS */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[10px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Compass className="w-3 h-3 text-blue-600" />
                            <span>{facility.geofence_radius_meters}m Radius</span>
                          </div>
                          <div className="text-slate-400">
                            {facility.latitude.toFixed(4)}° N
                          </div>
                          <div className="text-slate-400">
                            {facility.longitude.toFixed(4)}° E
                          </div>
                        </div>
                      </td>

                      {/* In-Charge Contact */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {facility.in_charge_name}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{facility.contact_phone}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {facility.contact_email}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalFacility(facility);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold rounded-lg transition-colors"
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

      {/* Facility Dossier Modal */}
      {activeModalFacility && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 relative">
              <button
                onClick={() => setActiveModalFacility(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                    {activeModalFacility.id}
                  </span>
                  <span className="text-xs bg-white/10 text-blue-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
                    {activeModalFacility.scheme_code}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Statutory Active
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {activeModalFacility.name}
                </h2>
                <p className="text-xs text-blue-200/90">
                  {activeModalFacility.organization_name} • {activeModalFacility.scheme_name}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Geofence and GPS Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    Statutory Geofence Boundary & Coordinates
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {activeModalFacility.geofence_radius_meters}m Perimeter Radius
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Latitude Coordinate</div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                      {activeModalFacility.latitude}° N
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Longitude Coordinate</div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                      {activeModalFacility.longitude}° E
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Inspectors must physically be within the {activeModalFacility.geofence_radius_meters}-meter GPS geofence ring to unlock and submit statutory compliance audits.
                </p>
              </div>

              {/* Beneficiary and Capacity Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-800 uppercase">Sanctioned</div>
                  <div className="text-xl font-black text-blue-900 mt-1">
                    {activeModalFacility.sanctioned_capacity}
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono">Beds / Seats</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Enrolled</div>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {activeModalFacility.enrolled_beneficiaries}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono">Current Roster</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-[10px] font-bold text-purple-800 uppercase">Compliance Grade</div>
                  <div className="text-xl font-black text-purple-900 mt-1">
                    Grade {activeModalFacility.compliance_grade}
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono">
                    Risk: {activeModalFacility.risk_score}
                  </div>
                </div>
              </div>

              {/* Contact & Administrative Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Administrative In-Charge
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Officer In-Charge</div>
                    <div className="font-bold text-slate-900">{activeModalFacility.in_charge_name}</div>
                    <div className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{activeModalFacility.contact_phone}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{activeModalFacility.contact_email}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Institution Address</div>
                    <div className="font-semibold text-slate-800">{activeModalFacility.address}</div>
                    <div className="text-slate-600">
                      {activeModalFacility.district}, {activeModalFacility.state} - {activeModalFacility.pincode}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      Last Statutory Audit: {activeModalFacility.last_inspected_at || "Never"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveModalFacility(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close Dossier
              </button>

              <Link
                href="/form-builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <span>Dispatch Checklist Audit</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
