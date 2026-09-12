"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileEdit, 
  ShieldCheck, 
  Smartphone,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "National Monitoring & GIS"
  },
  {
    name: "Android App",
    href: "/android",
    icon: Smartphone,
    description: "Working Handheld Station",
    badge: "Live"
  },
  {
    name: "Facilities",
    href: "/facilities",
    icon: Building2,
    description: "12 Registered Homes"
  },
  {
    name: "Officers",
    href: "/officers",
    icon: Users,
    description: "52 Vigilance Officers"
  },
  {
    name: "Form Builder",
    href: "/form-builder",
    icon: FileEdit,
    description: "Inspection Checklist Studio",
    badge: "Sync"
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 shadow-xl select-none transition-colors duration-200">
      {/* Ministry Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-amber-400/40 flex items-center justify-center shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xs tracking-wider text-white uppercase truncate">
              MoSJE National
            </h1>
            <p className="text-[10px] text-amber-400 font-bold tracking-tight truncate">
              Welfare Portal
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between text-[10px] font-mono px-2.5 py-1 bg-slate-800/60 rounded-lg border border-slate-700/50 text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GovCloud Live
          </span>
          <span className="text-slate-400 font-semibold">v2.4-Next</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Primary Navigation
        </div>

        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-amber-300" : "text-slate-400 group-hover:text-blue-400"
                }`} />
                <div className="truncate">
                  <div className="leading-tight truncate">{item.name}</div>
                  <div className={`text-[9px] font-normal truncate ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge ? (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                  isActive ? "bg-amber-400 text-slate-950" : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                }`}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                  isActive ? "opacity-100 translate-x-0.5 text-blue-200" : "opacity-0 -translate-x-1 group-hover:opacity-60"
                }`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        {/* Dark Mode Quick Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 text-xs font-semibold transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{theme === "dark" ? "Dark Mode Active" : "Light Mode Active"}</span>
          </span>
          <span className="text-[10px] font-mono uppercase bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
            Toggle
          </span>
        </button>

        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-400/30">
            DR
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-200 truncate">Dr. Rajesh Sharma</div>
            <div className="text-[10px] text-slate-400 truncate">Director PMU • MoSJE</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
