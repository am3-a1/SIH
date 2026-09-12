"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  FileCode, 
  Terminal, 
  Download,
  Layers,
  Sparkles
} from "lucide-react";
import { ChecklistForm } from "@/types";

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ChecklistForm | null;
}

export function SchemaModal({ isOpen, onClose, formData }: SchemaModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !formData) return null;

  const jsonString = JSON.stringify(formData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-${(formData.schemeCode || "schema").toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Question type count summary
  const questions = formData.questions || [];
  const textCount = questions.filter(q => q.type === "text").length;
  const yesNoCount = questions.filter(q => q.type === "yes_no").length;
  const numberCount = questions.filter(q => q.type === "number_range").length;
  const photoCount = questions.filter(q => q.type === "photo_evidence").length;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Inspection Schema Validated & Saved</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Structured JSON Schema Output
            </h2>
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <Terminal className="w-3.5 h-3.5 text-amber-300" />
              <span>Full structured payload has been output to browser console.</span>
            </div>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Scheme:</span>
            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
              {formData.schemeCode || "ALL"}
            </span>
            <span className="font-bold text-slate-700 ml-2">Total Questions:</span>
            <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
              {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {textCount} Text
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              {yesNoCount} Yes/No
            </span>
            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              {numberCount} Numbers
            </span>
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
              {photoCount} Photos
            </span>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs">
          <pre className="overflow-x-auto leading-relaxed whitespace-pre">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-slate-400" />
            <span>Payload Size: {new Blob([jsonString]).size} bytes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy JSON Schema</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>Download .json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
