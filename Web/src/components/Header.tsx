"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  Search, 
  Shield, 
  Sparkles, 
  PlusCircle, 
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  Smartphone
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const [timeString, setTimeString] = useState<string>("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Department & Title */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-blue-900 dark:text-blue-400 tracking-wider">
              Government of India
            </span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-700/60">
              MoSJE
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            National Welfare Monitoring & Statutory Inspection Platform
          </div>
        </div>
      </div>

      {/* Right: Actions, Badges & User Status */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{timeString || "Syncing UTC Clock..."}</span>
        </div>

        {/* Security Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>AES-256 Verified</span>
        </div>

        {/* Dark Mode Toggle Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 font-bold"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline text-xs">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-xs">Dark</span>
            </>
          )}
        </button>

        {/* Android App Link */}
        <Link
          href="/android"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
        >
          <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Handheld App</span>
        </Link>

        {/* Form Builder Shortcut CTA */}
        <Link
          href="/form-builder"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>New Checklist</span>
        </Link>
      </div>
    </header>
  );
}
