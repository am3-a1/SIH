import { ChecklistForm } from "@/types";

export const DEFAULT_CHECKLIST_SCHEMA: ChecklistForm = {
  title: "MoSJE Statutory Comprehensive Vigilance & Safety Audit",
  schemeCode: "AVYAY",
  category: "Surprise Vigilance Audit",
  targetFacilityType: "Senior Citizens Home & Rehabilitation Center",
  description: "Standard statutory inspection checklist covering biometric headcount verification, nutritional hygiene, fire NOC validation, and photographic evidence with geofenced cryptographic watermarking.",
  questions: [
    {
      id: "q-evidence-kitchen",
      type: "photo_evidence",
      title: "Photographic Evidence: Food Storage & Dietary Kitchen Hygiene",
      description: "Capture high-resolution evidence of grain storage, refrigeration temperature seals, and meal preparation areas.",
      required: true,
      photoCategory: "Dining & Kitchen",
      minPhotos: 2,
      requireGeotagWatermark: true,
    },
    {
      id: "q-statutory-fire-noc",
      type: "yes_no",
      title: "Is the statutory Fire Safety Certificate (NOC) active and valid?",
      description: "Verify that the local municipal Fire Department NOC is displayed in the main reception and unexpired.",
      required: true,
      positiveLabel: "Compliant / Valid NOC",
      negativeLabel: "Non-Compliant / Expired",
      criticalFailure: true,
    },
    {
      id: "q-headcount-verified",
      type: "number_range",
      title: "Verified Physical Beneficiary Headcount on Premises",
      description: "Actual roll-call headcount verified during physical inspection walk-through against sanctioned roster.",
      required: true,
      min: 0,
      max: 150,
      step: 1,
      unit: "Beneficiaries Present",
      targetThreshold: 50,
    },
    {
      id: "q-notes-observations",
      type: "text",
      title: "Inspector Observations & Grievance Redressal Review",
      description: "Note any discrepancies between the biometric log and physical count, medical supply stock, or resident complaints.",
      required: false,
      placeholder: "Record any discrepancies, maintenance shortcomings, or positive feedback...",
      maxLength: 1000,
    },
  ],
};

const STORAGE_KEY = "mosje-active-checklist-v1";
const SYNC_EVENT = "mosje-checklist-updated";

export function getStoredChecklist(): ChecklistForm {
  if (typeof window === "undefined") return DEFAULT_CHECKLIST_SCHEMA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHECKLIST_SCHEMA;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to parse stored checklist, returning default:", err);
  }
  return DEFAULT_CHECKLIST_SCHEMA;
}

export function saveStoredChecklist(form: ChecklistForm): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: form }));
  } catch (err) {
    console.error("Failed to save checklist to storage:", err);
  }
}

export function subscribeToChecklist(callback: (form: ChecklistForm) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<ChecklistForm>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}
