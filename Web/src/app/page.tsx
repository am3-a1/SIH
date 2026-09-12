import Link from "next/link";
import { 
  Building2, 
  Users, 
  FileEdit, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Activity,
  Award,
  Layers,
  Sparkles
} from "lucide-react";
import facilitiesSeed from "@/data/facilities_seed.json";
import officersSeed from "@/data/officers_seed.json";

export default function DashboardPage() {
  const facilities = facilitiesSeed.facilities || [];
  const officers = officersSeed.officers || [];

  const totalCapacity = facilities.reduce((sum, f) => sum + (f.sanctioned_capacity || 0), 0);
  const totalEnrolled = facilities.reduce((sum, f) => sum + (f.enrolled_beneficiaries || 0), 0);
  const gradeACount = facilities.filter(f => f.compliance_grade === "A").length;
  const assignedOfficersCount = officers.filter(o => o.has_pending_assignment).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Central Surveillance & Compliance Authority
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            MoSJE Statutory Inspection & Audit Dashboard
          </h1>
          <p className="text-sm text-blue-200/90 leading-relaxed">
            Real-time monitoring platform for Ministry of Social Justice & Empowerment funded NGO facilities, 
            geofenced field inspections, tamper-evident camera evidence, and dynamic checklist orchestration.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/form-builder"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all"
            >
              <FileEdit className="w-4 h-4 text-slate-900" />
              <span>Launch Checklist Form Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/facilities"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs border border-white/20 transition-all"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>Explore Facilities Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Facilities
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{facilities.length}</span>
            <span className="text-xs text-emerald-600 font-bold font-mono">100% Active</span>
          </div>
          <p className="text-xs text-slate-500">
            Across Senior Citizens, IRCA, and SC Hostels
          </p>
        </div>

        {/* Card 2: Field Officers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Inspectors
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{officers.length}</span>
            <span className="text-xs text-amber-600 font-bold font-mono">{assignedOfficersCount} Dispatched</span>
          </div>
          <p className="text-xs text-slate-500">
            District Inspectors & Surprise Auditors
          </p>
        </div>

        {/* Card 3: Beneficiary Roll */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Roll
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalEnrolled}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalCapacity} Cap</span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time biometric & AI roll occupancy
          </p>
        </div>

        {/* Card 4: Compliance Grade */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              High Compliance
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{gradeACount}</span>
            <span className="text-xs text-blue-700 font-bold font-mono">Grade A Homes</span>
          </div>
          <p className="text-xs text-slate-500">
            Statutory Fire, Hygiene, & Food standards
          </p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Box 1: Facilities */}
        <Link
          href="/facilities"
          className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                Facilities Directory
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filter and inspect all 12 registered institutions across AVYAY, NAPDDR, and PM-AJAY schemes. View capacities, geofences, and compliance grades.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900">
            <span>View 12 Facilities</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Box 2: Officers */}
        <Link
          href="/officers"
          className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                Vigilance Officers Pool
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect 52 field inspectors and vigilance officers. View dispatch assignments, assigned audit statuses, and geographic jurisdictions.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-900">
            <span>View 52 Officers</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Box 3: Form Builder */}
        <Link
          href="/form-builder"
          className="group bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-2xl border border-blue-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Dynamic Form Builder</h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">Crucial</span>
              </div>
              <p className="text-xs text-blue-200/90 mt-1 leading-relaxed">
                Build statutory inspection checklists with drag-and-drop questions, React Hook Form validation, and live mobile phone preview.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-blue-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300 relative z-10">
            <span>Launch Form Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Scheme Badges Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            National Welfare Scheme Coverage (MoSJE)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">4 Active Statutory Schemes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-blue-900">AVYAY</div>
            <div className="text-[11px] text-slate-600">Atal Vayo Abhyuday Yojana</div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 font-semibold">Senior Citizen Homes</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-purple-900">NAPDDR</div>
            <div className="text-[11px] text-slate-600">Action Plan for Drug Demand Reduction</div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 font-semibold">IRCA Rehabilitation Centres</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-emerald-900">PM-AJAY</div>
            <div className="text-[11px] text-slate-600">Pradhan Mantri Anusuchit Jaati Abhyuday</div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 font-semibold">SC Welfare & Hostels</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-amber-900">SMILE</div>
            <div className="text-[11px] text-slate-600">Support for Marginalised Individuals</div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 font-semibold">Shelters & Livelihood Units</div>
          </div>
        </div>
      </div>
    </div>
  );
}
