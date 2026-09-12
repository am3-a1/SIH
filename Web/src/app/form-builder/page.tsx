"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from "@hello-pangea/dnd";
import { 
  FileEdit, 
  Plus, 
  Save, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  Sliders, 
  Camera, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Layers, 
  HelpCircle,
  ChevronRight,
  Info,
  Award
} from "lucide-react";
import { ChecklistForm, Question, QuestionType } from "@/types";
import { QuestionCard } from "@/components/form-builder/QuestionCard";
import { MobilePreview } from "@/components/form-builder/MobilePreview";
import { SchemaModal } from "@/components/form-builder/SchemaModal";
import { saveStoredChecklist, DEFAULT_CHECKLIST_SCHEMA, getStoredChecklist } from "@/lib/checklistStore";

// Zod Validation Schema
const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "yes_no", "number_range", "photo_evidence", "rubrics_checklist"]),
  title: z.string().min(1, "Question prompt is required"),
  description: z.string().optional(),
  required: z.boolean().default(true),
  // Text options
  placeholder: z.string().optional(),
  maxLength: z.number().optional(),
  // Yes/No options
  positiveLabel: z.string().optional(),
  negativeLabel: z.string().optional(),
  criticalFailure: z.boolean().optional(),
  // Number range options
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  targetThreshold: z.number().optional(),
  // Photo evidence options
  photoCategory: z.string().optional(),
  minPhotos: z.number().optional(),
  requireGeotagWatermark: z.boolean().optional(),
  // Rubrics options
  rubrics: z.array(z.object({
    id: z.string(),
    name: z.string(),
    weight: z.number().optional(),
    defaultScore: z.number().optional(),
  })).optional(),
  passingScore: z.number().optional(),
});

const checklistSchema = z.object({
  title: z.string().min(3, "Form title is required"),
  schemeCode: z.string().min(1, "Scheme code is required"),
  category: z.string().min(1, "Category is required"),
  targetFacilityType: z.string().min(1, "Target facility type is required"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

export default function FormBuilderPage() {
  const [mounted, setMounted] = useState(false);
  const [savedData, setSavedData] = useState<ChecklistForm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChecklistForm>({
    resolver: zodResolver(checklistSchema),
    defaultValues: DEFAULT_CHECKLIST_SCHEMA,
  });

  // Dynamic Questions Array
  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: "questions",
  });

  // Watch entire form for real-time mobile preview
  const formValues = watch();

  useEffect(() => {
    setMounted(true);
    const existing = getStoredChecklist();
    if (existing) {
      reset(existing);
    }
  }, [reset]);

  // Drag and Drop reordering handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  // Add new question of specified type
  const handleAddQuestion = (type: QuestionType) => {
    const timestamp = Date.now();
    const newId = `q_${type}_${timestamp}`;

    let newQuestion: Question;

    switch (type) {
      case "text":
        newQuestion = {
          id: newId,
          type: "text",
          title: "New Text Observation",
          description: "Inspector notes and observations",
          required: true,
          placeholder: "Enter details here...",
          maxLength: 500,
        };
        break;
      case "yes_no":
        newQuestion = {
          id: newId,
          type: "yes_no",
          title: "New Statutory Compliance Check",
          description: "Verify compliance with statutory guidelines",
          required: true,
          positiveLabel: "Compliant / Yes",
          negativeLabel: "Non-Compliant / No",
          criticalFailure: false,
        };
        break;
      case "number_range":
        newQuestion = {
          id: newId,
          type: "number_range",
          title: "New Quantitative Metric",
          description: "Record numerical count or measurement",
          required: true,
          min: 0,
          max: 100,
          step: 1,
          unit: "Units",
          targetThreshold: 25,
        };
        break;
      case "photo_evidence":
        newQuestion = {
          id: newId,
          type: "photo_evidence",
          title: "New Photo Evidence Requirement",
          description: "Capture timestamped on-site photographic evidence via camera",
          required: true,
          photoCategory: "Dormitory & Living Quarters",
          minPhotos: 1,
          requireGeotagWatermark: true,
        };
        break;
      case "rubrics_checklist":
        newQuestion = {
          id: newId,
          type: "rubrics_checklist",
          title: "Statutory 5-Point Inspection Rubrics Matrix",
          description: "Quantitative scoring matrix assessing statutory standards with automatic Grade calculation.",
          required: true,
          rubrics: [
            { id: `r_1_${timestamp}`, name: "1. Infrastructure & Fire Safety", weight: 20 },
            { id: `r_2_${timestamp}`, name: "2. Hygiene & Cleanliness", weight: 20 },
            { id: `r_3_${timestamp}`, name: "3. Food & Nutrition Standard", weight: 20 },
            { id: `r_4_${timestamp}`, name: "4. Medical Ward & Care Log", weight: 20 },
            { id: `r_5_${timestamp}`, name: "5. Staff & Beneficiary Roll", weight: 20 },
          ],
          passingScore: 70,
        };
        break;
    }

    append(newQuestion);
    showToast(`Added ${type.replace("_", " ")} question!`);
  };

  // Duplicate an existing question
  const handleDuplicate = (index: number) => {
    const currentQ = formValues.questions[index];
    if (!currentQ) return;

    const duplicated: Question = {
      ...currentQ,
      id: `q_copy_${Date.now()}`,
      title: `${currentQ.title} (Copy)`,
    };

    insert(index + 1, duplicated);
    showToast("Question duplicated successfully!");
  };

  // Move helpers
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Save Form Handler
  const onSubmit = (data: ChecklistForm) => {
    // 1. Sync structured schema directly into the Android Handheld App UI
    saveStoredChecklist(data);

    // 2. Output structured JSON schema to console
    console.log("=================================================");
    console.log(" [MoSJE Inspection Studio] STATUTORY CHECKLIST SCHEMA SAVED & SYNCED TO ANDROID APP");
    console.log("=================================================");
    console.log(JSON.stringify(data, null, 2));
    console.table(data.questions);

    // 3. Open copyable modal for user convenience
    setSavedData(data);
    setIsModalOpen(true);
    showToast("Checklist saved and updated into Android Handheld App!");
  };

  const handleResetToTemplate = () => {
    reset(DEFAULT_CHECKLIST_SCHEMA);
    saveStoredChecklist(DEFAULT_CHECKLIST_SCHEMA);
    showToast("Reset to default MoSJE statutory audit template.");
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Initializing Checklist Form Studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Inspection Checklist Studio</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Dynamic Form Builder
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Design and orchestrate statutory field checklists with drag-and-drop questions. Changes update the Android Handheld Station in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/android"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Open in Android App</span>
          </Link>

          <button
            type="button"
            onClick={handleResetToTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            title="Reset to default statutory template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Template</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all hover:shadow-blue-500/25"
          >
            <Save className="w-4 h-4" />
            <span>Save & Sync to Android</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Preview Tabs Selector */}
      <div className="flex xl:hidden bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setActiveTab("builder")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "builder" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Form Studio Editor</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "preview" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile App Preview</span>
        </button>
      </div>

      {/* Main Studio Grid: Editor (Left) + Mobile Device Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Builder (xl:col-span-7) */}
        <div className={`space-y-6 ${activeTab === "preview" ? "hidden xl:block xl:col-span-7" : "xl:col-span-7"}`}>
          {/* Form Metadata Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Checklist Metadata & Scope</span>
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                MoSJE Protocol v2.4
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Checklist Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="e.g. Annual Statutory Surprise Vigilance Inspection"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-bold transition-colors"
                />
                {errors.title && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Scheme & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Scheme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("schemeCode")}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="AVYAY">AVYAY (Senior Citizens)</option>
                    <option value="NAPDDR">NAPDDR (Rehabilitation / IRCA)</option>
                    <option value="PM-AJAY">PM-AJAY (SC Hostels & Grants)</option>
                    <option value="SMILE">SMILE (Marginalised Welfare)</option>
                    <option value="ALL">ALL (Multi-Scheme Protocol)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Inspection Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="Surprise Vigilance Audit">Surprise Vigilance Audit</option>
                    <option value="Annual Recertification">Annual Recertification</option>
                    <option value="Infrastructure & Hygiene">Infrastructure & Hygiene</option>
                    <option value="Biometric Headcount Verification">Biometric Headcount Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Facility Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("targetFacilityType")}
                    placeholder="e.g. Senior Citizen Homes"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Scope & Auditor Instructions
                </label>
                <textarea
                  rows={2}
                  {...register("description")}
                  placeholder="Provide statutory guidelines, background context, or mandates for this inspection checklist..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Add Question Actions Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Add Question Type to Checklist
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {fields.length} Criteria Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Type 1: Text */}
              <button
                type="button"
                onClick={() => handleAddQuestion("text")}
                className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200">Text Input</div>
                <div className="text-[9px] text-blue-700/70 dark:text-blue-400/70">Observations</div>
              </button>

              {/* Type 2: Yes/No */}
              <button
                type="button"
                onClick={() => handleAddQuestion("yes_no")}
                className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Yes / No</div>
                <div className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70">Compliance</div>
              </button>

              {/* Type 3: Number */}
              <button
                type="button"
                onClick={() => handleAddQuestion("number_range")}
                className="p-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100/80 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <Sliders className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Range</div>
                <div className="text-[9px] text-purple-700/70 dark:text-purple-400/70">Headcounts</div>
              </button>

              {/* Type 4: Photo Evidence */}
              <button
                type="button"
                onClick={() => handleAddQuestion("photo_evidence")}
                className="p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <Camera className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">Camera</div>
                <div className="text-[9px] text-amber-700/70 dark:text-amber-400/70">Watermarked</div>
              </button>

              {/* Type 5: Compliance Rubrics */}
              <button
                type="button"
                onClick={() => handleAddQuestion("rubrics_checklist")}
                className="p-2.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-xl text-left transition-all group col-span-2 sm:col-span-1"
              >
                <div className="flex items-center justify-between mb-1">
                  <Award className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs font-bold text-teal-900 dark:text-teal-200">Rubrics</div>
                <div className="text-[9px] text-teal-700/70 dark:text-teal-400/70">Grade Matrix</div>
              </button>
            </div>
          </div>

          {/* Drag & Drop Questions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold px-1">
              <span>Drag handle icon (⋮⋮) to reorder questions</span>
              <span>Total: {fields.length} criteria</span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions-droppable">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 min-h-[100px] p-1 rounded-2xl transition-colors ${
                      snapshot.isDraggingOver ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    {fields.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 space-y-2">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Checklist has no questions</p>
                        <p className="text-[11px]">
                          Click any button in the bar above to add a question, or load the default template.
                        </p>
                      </div>
                    ) : (
                      fields.map((field, index) => {
                        const currentQuestion = formValues.questions?.[index] || field;

                        return (
                          <Draggable
                            key={field.id}
                            draggableId={field.id}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`drag-item ${dragSnapshot.isDragging ? "is-dragging z-40" : ""}`}
                              >
                                <QuestionCard
                                  index={index}
                                  question={currentQuestion as Question}
                                  register={register}
                                  control={control}
                                  onDelete={remove}
                                  onDuplicate={handleDuplicate}
                                  onMoveUp={handleMoveUp}
                                  onMoveDown={handleMoveDown}
                                  isFirst={index === 0}
                                  isLast={index === fields.length - 1}
                                  dragHandleProps={dragProvided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Bottom Save Action Footer */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Checklist ready with <strong>{fields.length}</strong> statutory items.
            </div>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all hover:shadow-blue-500/25"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync to Android</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Mobile App Preview (xl:col-span-5) */}
        <div className={`xl:col-span-5 sticky top-6 ${activeTab === "builder" ? "hidden xl:block" : "block"}`}>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Mobile App Live Emulation</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Live Synced
              </span>
            </div>

            {/* Smartphone Emulation View */}
            <MobilePreview formValues={formValues} />
          </div>
        </div>
      </div>

      {/* Structured JSON Schema Output Modal */}
      <SchemaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={savedData}
      />
    </div>
  );
}
