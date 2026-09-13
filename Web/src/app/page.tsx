"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Shuffle,
  Sparkles,
  Smartphone,
  Radio,
  Clock,
  Award,
  ChevronRight,
  X,
  FileEdit,
  Activity,
  MapPin,
  CheckCircle2,
  Cctv,
  Video
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import officersSeed from "@/data/officers_seed.json";
import { Facility, Officer } from "@/types";
import { GisMap } from "@/components/dashboard/GisMap";
import { 
  triggerRandomOfficerDispatch, 
  triggerRiskWeightedOfficerDispatch, 
  getLatestDispatch, 
  subscribeToDispatch, 
  DispatchEvent 
} from "@/lib/dispatchStore";

export default function DashboardPage() {
  const facilities: Facility[] = facilitiesSeed.facilities || [];
  const [officers, setOfficers] = useState<Officer[]>(officersSeed.officers || []);

  const [latestDispatch, setLatestDispatch] = useState<DispatchEvent | null>(null);
  const [showDispatchBanner, setShowDispatchBanner] = useState<boolean>(false);
  const [dispatchCount, setDispatchCount] = useState<number>(() => officers.filter((o) => o.has_pending_assignment).length || 2);

  const refreshOfficers = () => {
    fetch("/api/v1/officers")
      .then((res) => res.json())
      .then((data) => {
        if (data?.officers && Array.isArray(data.officers)) {
          setOfficers(data.officers);
          const assigned = data.officers.filter((o: Officer) => o.has_pending_assignment).length;
          setDispatchCount(assigned);
        }
      })
      .catch((err) => console.error("Error refreshing dashboard officers:", err));
  };

  // Aggregates
  const totalCapacity = facilities.reduce((sum, f) => sum + (f.sanctioned_capacity || 0), 0);
  const totalEnrolled = facilities.reduce((sum, f) => sum + (f.enrolled_beneficiaries || 0), 0);
  const gradeACount = facilities.filter((f) => f.compliance_grade === "A").length;

  useEffect(() => {
    refreshOfficers();

    const existing = getLatestDispatch();
    if (existing) {
      setLatestDispatch(existing);
      setShowDispatchBanner(true);
    }

    const unsubscribe = subscribeToDispatch((event) => {
      setLatestDispatch(event);
      setShowDispatchBanner(true);
      refreshOfficers();
    });

    return () => unsubscribe();
  }, []);

  const handleRandomDispatch = () => {
    const event = triggerRandomOfficerDispatch();
    setLatestDispatch(event);
    setShowDispatchBanner(true);
  };

  const handleRiskWeightedDispatch = () => {
    const event = triggerRiskWeightedOfficerDispatch();
    setLatestDispatch(event);
    setShowDispatchBanner(true);
  };

  // Facilities sorted by risk
  const rankedFacilities = [...facilities].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Executive Command Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Central Command Center • Statutory Oversight</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
            National Welfare Surveillance & Audit Command
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 max-w-2xl font-medium">
            Real-time geospatial monitoring of MoSJE institutions, unannounced statutory auditor dispatching, and cryptographic inspection verification.
          </p>
        </div>

        {/* Quick Dispatch Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRandomDispatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Dispatch a random standby officer with zero notice"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-200" />
            <span>Random Dispatch</span>
          </button>

          <button
            onClick={handleRiskWeightedDispatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Dispatch auditor prioritized by statutory risk metric"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-200" />
            <span>Risk-Weighted Dispatch</span>
          </button>

          <Link
            href="/cctv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Central CCTV Surveillance Wall with ONVIF PTZ"
          >
            <Cctv className="w-3.5 h-3.5 text-amber-300" />
            <span>CCTV Wall</span>
          </Link>

          <Link
            href="/vc"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Unannounced Remote Video Conference with AI Face Tracking"
          >
            <Video className="w-3.5 h-3.5 text-teal-200" />
            <span>Remote VC</span>
          </Link>

          <Link
            href="/android"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Handheld App</span>
          </Link>
        </div>
      </div>

      {/* Unannounced Dispatch Alert Banner */}
      {showDispatchBanner && latestDispatch && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-purple-800 shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0">
              <Shuffle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-mono border border-purple-400/30">
                  {latestDispatch.type === "RANDOM" ? "Random Unannounced Audit" : "AI Risk-Weighted Audit"}
                </span>
                <span className="text-[10px] font-mono text-purple-300">
                  ID: {latestDispatch.id} • {latestDispatch.timestamp}
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5 truncate">
                Dispatched <span className="text-amber-300">{latestDispatch.officerName}</span> to audit{" "}
                <span className="text-white underline underline-offset-2">{latestDispatch.facilityName}</span>
              </div>
              <div className="text-xs text-purple-200/90 truncate">
                Immediate statutory surprise inspection triggered. Geofence lock activated on officer device.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/android"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <span>View in Android App</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setShowDispatchBanner(false)}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* National KPI Strip (High Contrast, Legible Fonts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Registered Facilities */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>Registered Homes</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{facilities.length}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">100% Geo-mapped</div>
        </div>

        {/* Card 2: Active Inspectors */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>Vigilance Officers</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{officers.length}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">{dispatchCount} Dispatched</div>
        </div>

        {/* Card 3: Enrolled Roll */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>Enrolled Roll</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalEnrolled}</div>
          <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">Of {totalCapacity} Cap</div>
        </div>

        {/* Card 4: Compliance Grade A */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>Grade A Homes</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{gradeACount} / {facilities.length}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">High Compliance</div>
        </div>

        {/* Card 5: CCTV Stream Uptime */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>CCTV Feed Uptime</span>
            <Radio className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">92.4%</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">ONVIF / RTSP Active</div>
        </div>

        {/* Card 6: Urgent Anomalies */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 text-xs font-bold">
            <span>Risk Flags</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">3 Priority</div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">Surprise Audit Queued</div>
        </div>
      </div>

      {/* Main Grid: GIS Map & Live Activity (Left) + AI Risk Prioritization (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: National GIS Map (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* GIS India Map */}
          <GisMap />

          {/* Live Field Activity Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Live Officer Field Activity & Audit Feed</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Real-Time Synchronized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Time (UTC)</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Inspector</th>
                    <th className="py-2.5 px-3">Facility Audited</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">11:23:52</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
                        AUDIT_SUBMITTED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Sunita Rao</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">Snehalaya Senior Citizens Home (Delhi)</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified AES-256</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">10:45:10</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-[10px]">
                        SURPRISE_DISPATCH
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Vikramaditya Roy</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">Nasha Mukti Punarvas Kendra (Amritsar)</td>
                    <td className="py-2.5 px-3 text-amber-700 dark:text-amber-400 font-bold">
                      In-Flight (Geofenced)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">09:15:30</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        GEOFENCE_ACQUIRED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Sunita Rao</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">Snehalaya Senior Citizens Home (Delhi)</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                      On-site Lock (35m)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI Risk Priority & Quick Intelligence (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Anomaly Flags Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Active AI Anomaly Flags</span>
              </h3>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                3 Action Required
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
                <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                  <span>Fire NOC Recertification Lapsed</span>
                  <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-bold">Risk 25</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Snehalaya Senior Home (New Delhi) municipal fire certificate expired 14 days ago. Unannounced inspection required.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 dark:text-slate-400 font-mono">AVYAY Scheme</span>
                  <button onClick={handleRiskWeightedDispatch} className="text-rose-700 dark:text-rose-300 font-bold hover:underline">
                    Dispatch Inspector &rarr;
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>Biometric Headcount Discrepancy</span>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold">Risk 18</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Savitribai Phule SC Girls Hostel shows 12 unverified absentees on morning biometric roll.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 dark:text-slate-400 font-mono">PM-AJAY Scheme</span>
                  <button onClick={handleRiskWeightedDispatch} className="text-amber-700 dark:text-amber-300 font-bold hover:underline">
                    Schedule Audit &rarr;
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Camera Stream RTSP Packet Drop</span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">Risk 14</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Nasha Mukti Punarvas Kendra (Circular Road) outdoor pan-tilt-zoom camera offline.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 dark:text-slate-400 font-mono">NAPDDR Scheme</span>
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Diagnostics Running</span>
                </div>
              </div>
            </div>
          </div>

          {/* Facility Risk Ranking Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Statutory Risk Priority Ranking</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                Top 5 Priority
              </span>
            </div>

            <div className="space-y-2">
              {rankedFacilities.slice(0, 5).map((fac, idx) => (
                <div
                  key={fac.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {idx + 1}. {fac.name}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                      {fac.district}, {fac.state} • {fac.scheme_code}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      fac.risk_score > 20
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                    }`}>
                      Risk {fac.risk_score}
                    </span>
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center">
                      {fac.compliance_grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/facilities"
              className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900"
            >
              <span>Explore All 12 Institutions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
