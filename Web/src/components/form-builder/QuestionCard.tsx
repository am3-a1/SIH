"use client";

import { useState } from "react";
import { UseFormRegister, Control, Controller } from "react-hook-form";
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  FileText, 
  CheckSquare, 
  Sliders, 
  Camera, 
  ShieldAlert,
  HelpCircle,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { ChecklistForm, Question, QuestionType } from "@/types";

interface QuestionCardProps {
  index: number;
  question: Question;
  register: UseFormRegister<ChecklistForm>;
  control: Control<ChecklistForm>;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps?: any;
}

const TYPE_CONFIG = {
  text: {
    label: "Text Input",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText,
  },
  yes_no: {
    label: "Yes / No Toggle",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckSquare,
  },
  number_range: {
    label: "Number Range",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Sliders,
  },
  photo_evidence: {
    label: "Photo Evidence",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Camera,
  },
};

export function QuestionCard({
  index,
  question,
  register,
  control,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  dragHandleProps,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const typeConfig = TYPE_CONFIG[question.type] || TYPE_CONFIG.text;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group overflow-hidden">
      {/* Top Banner / Drag Header */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${typeConfig.color}`}>
            <TypeIcon className="w-3.5 h-3.5" />
            <span>{typeConfig.label}</span>
          </span>

          {/* Hidden input to persist id and type */}
          <input type="hidden" {...register(`questions.${index}.id`)} />
          <input type="hidden" {...register(`questions.${index}.type`)} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Reorder Buttons */}
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMoveUp && onMoveUp(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMoveDown && onMoveDown(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Duplicate Question"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Question Prompt (Always Visible) */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Question Prompt / Inspection Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register(`questions.${index}.title` as const, { required: true })}
            placeholder="e.g. Verify kitchen hygiene and food storage compliance..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-semibold"
          />
        </div>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
            {/* Description / Instructions */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Field Guidance / Regulatory Notes (Optional)
              </label>
              <textarea
                rows={2}
                {...register(`questions.${index}.description` as const)}
                placeholder="Specific guidance for the field inspector on what constitutes statutory compliance..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Type-Specific Options */}

            {/* 1. TEXT INPUT OPTIONS */}
            {question.type === "text" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                    Placeholder Hint
                  </label>
                  <input
                    type="text"
                    {...register(`questions.${index}.placeholder` as const)}
                    placeholder="Enter observation notes..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                    Max Character Limit
                  </label>
                  <input
                    type="number"
                    {...register(`questions.${index}.maxLength` as const, { valueAsNumber: true })}
                    placeholder="500"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 2. YES/NO OPTIONS */}
            {question.type === "yes_no" && (
              <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                      Positive Label (Pass)
                    </label>
                    <input
                      type="text"
                      {...register(`questions.${index}.positiveLabel` as const)}
                      placeholder="Compliant / Yes"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                      Negative Label (Fail)
                    </label>
                    <input
                      type="text"
                      {...register(`questions.${index}.negativeLabel` as const)}
                      placeholder="Non-Compliant / No"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Critical Statutory Breach Flag</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      If checked, a negative answer flags an immediate critical non-compliance breach to MoSJE central PMU.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    {...register(`questions.${index}.criticalFailure` as const)}
                    className="w-4 h-4 text-rose-600 accent-rose-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 3. NUMBER RANGE OPTIONS */}
            {question.type === "number_range" && (
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                      Min Value
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.min` as const, { valueAsNumber: true })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                      Max Value
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.max` as const, { valueAsNumber: true })}
                      placeholder="200"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                      Step
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.step` as const, { valueAsNumber: true })}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                      Target Threshold
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.targetThreshold` as const, { valueAsNumber: true })}
                      placeholder="50"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    {...register(`questions.${index}.unit` as const)}
                    placeholder="e.g. Beneficiaries / Sq Ft / % / °C"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* 4. PHOTO EVIDENCE OPTIONS */}
            {question.type === "photo_evidence" && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Evidence Category
                    </label>
                    <select
                      {...register(`questions.${index}.photoCategory` as const)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg text-slate-800 font-medium"
                    >
                      <option value="Dining & Kitchen">Dining & Kitchen</option>
                      <option value="Dormitory & Living Quarters">Dormitory & Living Quarters</option>
                      <option value="Fire Safety & Equipment">Fire Safety & Equipment</option>
                      <option value="Sanitation & Washrooms">Sanitation & Washrooms</option>
                      <option value="Medical & First Aid Post">Medical & First Aid Post</option>
                      <option value="Beneficiary Attendance Board">Beneficiary Attendance Board</option>
                      <option value="General Campus Infrastructure">General Campus Infrastructure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Minimum Required Photos
                    </label>
                    <select
                      {...register(`questions.${index}.minPhotos` as const, { valueAsNumber: true })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg text-slate-800 font-mono"
                    >
                      <option value="1">1 Photo minimum</option>
                      <option value="2">2 Photos minimum</option>
                      <option value="3">3 Photos minimum</option>
                      <option value="4">4 Photos minimum</option>
                      <option value="5">5 Photos minimum</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Enforce Hardware GPS & Timestamp Watermark</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Camera photos must be stamped with live latitude, longitude, ISO time, and SHA-256 seal.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    {...register(`questions.${index}.requireGeotagWatermark` as const)}
                    className="w-4 h-4 text-amber-600 accent-amber-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Common Required Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Mark as Mandatory Question
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register(`questions.${index}.required` as const)}
                  className="w-4 h-4 text-blue-600 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
