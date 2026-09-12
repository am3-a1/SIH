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
  ArrowDown,
  Award,
  Plus,
  Minus
} from "lucide-react";
import { ChecklistForm, Question, QuestionType, RubricItem } from "@/types";

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

const TYPE_CONFIG: Record<QuestionType, { label: string; color: string; icon: any }> = {
  text: {
    label: "Text Input",
    color: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: FileText,
  },
  yes_no: {
    label: "Yes / No Toggle",
    color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckSquare,
  },
  number_range: {
    label: "Number Range",
    color: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: Sliders,
  },
  photo_evidence: {
    label: "Photo Evidence",
    color: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Camera,
  },
  rubrics_checklist: {
    label: "Compliance Rubrics",
    color: "bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    icon: Award,
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group overflow-hidden">
      {/* Top Banner / Drag Header */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMoveDown && onMoveDown(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="Duplicate Question"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Question Prompt (Always Visible) */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Question Prompt / Inspection Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register(`questions.${index}.title` as const, { required: true })}
            placeholder="e.g. Verify kitchen hygiene and food storage compliance..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-semibold transition-colors"
          />
        </div>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            {/* Description / Instructions */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Field Guidance / Regulatory Notes (Optional)
              </label>
              <textarea
                rows={2}
                {...register(`questions.${index}.description` as const)}
                placeholder="Specific guidance for the field inspector on what constitutes statutory compliance..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>

            {/* Type-Specific Options */}

            {/* 1. TEXT INPUT OPTIONS */}
            {question.type === "text" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                    Placeholder Hint
                  </label>
                  <input
                    type="text"
                    {...register(`questions.${index}.placeholder` as const)}
                    placeholder="Enter observation notes..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/80 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                    Max Character Limit
                  </label>
                  <input
                    type="number"
                    {...register(`questions.${index}.maxLength` as const, { valueAsNumber: true })}
                    placeholder="500"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/80 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 2. YES/NO OPTIONS */}
            {question.type === "yes_no" && (
              <div className="space-y-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-1">
                      Positive Label (Pass)
                    </label>
                    <input
                      type="text"
                      {...register(`questions.${index}.positiveLabel` as const)}
                      placeholder="Compliant / Yes"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-1">
                      Negative Label (Fail)
                    </label>
                    <input
                      type="text"
                      {...register(`questions.${index}.negativeLabel` as const)}
                      placeholder="Non-Compliant / No"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Critical Statutory Breach Flag</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
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
              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1">
                      Min Value
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.min` as const, { valueAsNumber: true })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1">
                      Max Value
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.max` as const, { valueAsNumber: true })}
                      placeholder="200"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1">
                      Step
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.step` as const, { valueAsNumber: true })}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1">
                      Target Threshold
                    </label>
                    <input
                      type="number"
                      {...register(`questions.${index}.targetThreshold` as const, { valueAsNumber: true })}
                      placeholder="50"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    {...register(`questions.${index}.unit` as const)}
                    placeholder="e.g. Beneficiaries / Sq Ft / % / °C"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* 4. PHOTO EVIDENCE OPTIONS */}
            {question.type === "photo_evidence" && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                      Evidence Category
                    </label>
                    <select
                      {...register(`questions.${index}.photoCategory` as const)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                      Minimum Required Photos
                    </label>
                    <select
                      {...register(`questions.${index}.minPhotos` as const, { valueAsNumber: true })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                    >
                      <option value="1">1 Photo minimum</option>
                      <option value="2">2 Photos minimum</option>
                      <option value="3">3 Photos minimum</option>
                      <option value="4">4 Photos minimum</option>
                      <option value="5">5 Photos minimum</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Direct Camera-Only Capture (Tamper-Proof)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      Camera photos only. Device gallery/photo uploads are permanently blocked to prevent spoofing. Stamped with live GPS & SHA-256 seal.
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

            {/* 5. STATUTORY RUBRICS CHECKLIST OPTIONS */}
            {question.type === "rubrics_checklist" && (
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Statutory Inspection Rubrics (Editable Matrix)</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    Auto-Calculates Grade A / B / C
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Transferred from official Android Handheld Station. Generates interactive 0-100% sliders with real-time statutory compliance grade scoring.
                </p>

                {/* Rubrics List */}
                <div className="space-y-2">
                  {(question.rubrics || [
                    { id: "r_infra", name: "1. Infrastructure & Fire Safety", weight: 20 },
                    { id: "r_hygiene", name: "2. Hygiene & Cleanliness", weight: 20 },
                    { id: "r_food", name: "3. Food & Nutrition Standard", weight: 20 },
                    { id: "r_medical", name: "4. Medical Ward & Care Log", weight: 20 },
                    { id: "r_attendance", name: "5. Staff & Beneficiary Roll", weight: 20 },
                  ]).map((rubric, rIdx) => (
                    <div key={rubric.id || rIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        {...register(`questions.${index}.rubrics.${rIdx}.name` as const)}
                        defaultValue={rubric.name}
                        placeholder="Rubric criterion name..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/80 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">Weight:</span>
                        <input
                          type="number"
                          {...register(`questions.${index}.rubrics.${rIdx}.weight` as const, { valueAsNumber: true })}
                          defaultValue={rubric.weight || 20}
                          className="w-14 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/80 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-center"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-900 dark:text-teal-300">
                    Statutory Passing Threshold:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      {...register(`questions.${index}.passingScore` as const, { valueAsNumber: true })}
                      defaultValue={70}
                      placeholder="70"
                      className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 text-center"
                    />
                    <span className="text-[10px] font-mono text-slate-500">/ 100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Common Required Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
