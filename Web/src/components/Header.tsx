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
  CheckCircle2
} from "lucide-react";

export function Header() {
  const [timeString, setTimeString] = useState<string>("");

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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Left: Department & Title */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-blue-900 tracking-wider">
              Government of India
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300/60">
              MoSJE
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-900 leading-tight">
            National Welfare Monitoring & Statutory Inspection Platform
          </div>
        </div>
      </div>

      {/* Right: Actions, Badges & User Status */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeString || "Syncing UTC Clock..."}</span>
        </div>

        {/* Security Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>AES-256 Verified</span>
        </div>

        {/* Form Builder Shortcut CTA */}
        <Link
          href="/form-builder"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all hover:shadow"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>New Checklist</span>
        </Link>
      </div>
    </header>
  );
}
