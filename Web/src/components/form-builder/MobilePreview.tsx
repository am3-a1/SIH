"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  FileText, 
  HelpCircle,
  Wifi,
  Battery,
  Signal,
  Sparkles,
  AlertTriangle,
  Info
} from "lucide-react";
import { ChecklistForm, Question } from "@/types";

interface MobilePreviewProps {
  formValues: ChecklistForm;
}

export function MobilePreview({ formValues }: MobilePreviewProps) {
  // Mock mobile state for interactive preview
  const [activeTab, setActiveTab] = useState<"questions" | "info">("questions");
  const [mockYesNoAnswers, setMockYesNoAnswers] = useState<Record<string, boolean>>({});
  const [mockNumberAnswers, setMockNumberAnswers] = useState<Record<string, number>>({});

  const questions = formValues.questions || [];

  return (
    <div className="flex flex-col items-center">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[340px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 relative select-none ring-1 ring-slate-900/50">
        {/* Hardware Notch / Dynamic Island */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-slate-800"></div>
          <div className="w-2 h-2 rounded-full bg-blue-950/80"></div>
        </div>

        {/* Screen Content */}
        <div className="bg-slate-900 text-slate-100 rounded-[34px] overflow-hidden flex flex-col h-[650px] relative">
          {/* Status Bar */}
          <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-20">
            <span className="font-mono">09:41</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Header */}
          <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 backdrop-blur-sm z-10 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black tracking-wide text-white uppercase">
                  MoSJE Field Audit
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                {formValues.schemeCode || "STATUTORY"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate font-medium text-slate-300 max-w-[180px]">
                {formValues.title || "Untitled Inspection Checklist"}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                GPS Locked
              </span>
            </div>
          </div>

          {/* Checklist Questions Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Checklist Overview Notice */}
            <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-[10px] text-blue-200/90 space-y-1">
              <div className="font-bold text-blue-100 flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-400" />
                <span>Inspection Scope ({questions.length} Items)</span>
              </div>
              <p className="text-slate-300 text-[9px] leading-relaxed">
                {formValues.description || "All questions must be verified on-site inside the sanctioned facility boundary."}
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">No questions added yet</p>
                <p className="text-[10px] text-slate-500">
                  Use the Form Builder on the left to add inspection criteria.
                </p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 space-y-2 transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-slate-700 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white leading-tight">
                          {q.title || `Question ${idx + 1}`}
                          {q.required && (
                            <span className="text-rose-400 ml-1 font-mono text-[10px]">*</span>
                          )}
                        </div>
                        {q.description && (
                          <div className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                            {q.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      q.type === "text"
                        ? "bg-blue-500/20 text-blue-300"
                        : q.type === "yes_no"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : q.type === "number_range"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {q.type.replace("_", " ")}
                    </span>
                  </div>

                  {/* Question Input Controls Preview */}
                  {q.type === "text" && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        disabled
                        placeholder={q.placeholder || "Tap to enter inspector observation..."}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 placeholder-slate-500 focus:outline-none"
                      />
                      {q.maxLength && (
                        <div className="text-[8px] font-mono text-slate-500 text-right">
                          Max {q.maxLength} characters
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === "yes_no" && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMockYesNoAnswers(prev => ({ ...prev, [q.id]: true }))}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                            mockYesNoAnswers[q.id] === true
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{q.positiveLabel || "Yes / Compliant"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMockYesNoAnswers(prev => ({ ...prev, [q.id]: false }))}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                            mockYesNoAnswers[q.id] === false
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700"
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span>{q.negativeLabel || "No / Breach"}</span>
                        </button>
                      </div>

                      {q.criticalFailure && mockYesNoAnswers[q.id] === false && (
                        <div className="p-1.5 bg-rose-950/80 border border-rose-800 rounded-md flex items-center gap-1 text-[9px] text-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Statutory Breach: Triggers High-Risk MoSJE Alert</span>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === "number_range" && (
                    <div className="space-y-1.5 bg-slate-900/70 p-2 rounded-lg border border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Current Value:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {mockNumberAnswers[q.id] ?? q.targetThreshold ?? q.min ?? 0} {q.unit || ""}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={q.min ?? 0}
                        max={q.max ?? 100}
                        step={q.step ?? 1}
                        value={mockNumberAnswers[q.id] ?? q.targetThreshold ?? q.min ?? 0}
                        onChange={(e) => setMockNumberAnswers(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
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

                  {q.type === "photo_evidence" && (
                    <div className="space-y-1.5">
                      <div className="border border-dashed border-slate-600 bg-slate-900/90 rounded-lg p-2.5 flex flex-col items-center justify-center text-center space-y-1">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-200">
                          Take {q.photoCategory || "Evidence"} Photo
                        </div>
                        <div className="text-[8px] text-slate-400">
                          Min required: {q.minPhotos || 1} photo(s)
                        </div>

                        {q.requireGeotagWatermark && (
                          <div className="mt-1 flex items-center gap-1 text-[8px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>GPS & Watermark Stamped</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mobile Footer Action */}
          <div className="p-3 bg-slate-800/90 border-t border-slate-700/80 backdrop-blur-sm space-y-1.5">
            <button
              type="button"
              disabled
              className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md opacity-90 cursor-not-allowed"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Submit Statutory Audit</span>
            </button>
            <div className="text-center text-[8px] font-mono text-slate-500">
              SHA-256 Cryptographic Packaging Active
            </div>
          </div>

          {/* Home Indicator Bar */}
          <div className="pb-1.5 pt-0.5 flex justify-center">
            <div className="w-24 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 font-mono mt-3 text-center">
        Live preview matches the Android inspection client in real-time.
      </p>
    </div>
  );
}
