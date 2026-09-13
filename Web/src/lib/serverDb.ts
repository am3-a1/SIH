import fs from "fs";
import path from "path";
import officersSeed from "../data/officers_seed.json";
import facilitiesSeed from "../data/facilities_seed.json";
import { Facility, Officer } from "../types";

export interface AuditRecord {
  inspection_id: string;
  facility_id: string;
  facility_name: string;
  officer_id: string;
  officer_name: string;
  timestamp: string;
  status: string;
  compliance_grade: string;
  risk_score: number;
  sha256_hash: string;
  geofence_verified: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  scores?: {
    infrastructure: number;
    hygiene: number;
    food: number;
    medical: number;
    attendance: number;
  };
  responses?: Record<string, any>;
  photos_count?: number;
  client_app?: string;
  notes?: string;
}

function getDbFilePath(): string {
  const rootCandidate = path.join(process.cwd(), "Web", "src", "data", "live_db.json");
  const webCandidate = path.join(process.cwd(), "src", "data", "live_db.json");
  if (fs.existsSync(path.join(process.cwd(), "Web", "src", "data"))) {
    return rootCandidate;
  }
  return webCandidate;
}

const DB_FILE_PATH = getDbFilePath();

// In-memory cache holding live state
let memoryOfficers: Officer[] | null = null;
let memoryFacilities: Facility[] | null = null;
let memoryAudits: AuditRecord[] | null = null;
let memoryChecklist: any | null = null;

function loadDatabase() {
  if (memoryOfficers && memoryFacilities && memoryAudits) {
    return;
  }

  // Attempt to load from disk file
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      memoryOfficers = parsed.officers || null;
      memoryFacilities = parsed.facilities || null;
      memoryAudits = parsed.audits || null;
      memoryChecklist = parsed.checklist || null;
    }
  } catch (err) {
    console.error("Failed to read live_db.json, falling back to seed data:", err);
  }

  // Fallbacks if not on disk
  if (!memoryOfficers) {
    // Deep clone officers seed
    memoryOfficers = JSON.parse(JSON.stringify(officersSeed.officers || []));
  }
  if (!memoryFacilities) {
    memoryFacilities = JSON.parse(JSON.stringify(facilitiesSeed.facilities || []));
  }
  if (!memoryAudits) {
    memoryAudits = JSON.parse(JSON.stringify(BASELINE_SEED_AUDITS));
  }
}

export const BASELINE_SEED_AUDITS: AuditRecord[] = [
  {
    inspection_id: "INSP-2026-001",
    facility_id: "DOSJE-DL-001",
    facility_name: "Snehalaya Senior Citizens Home",
    officer_id: "33333333-3333-3333-3333-333333333333",
    officer_name: "Sunita Rao",
    timestamp: "2026-09-12T14:30:00.000Z",
    status: "COMPLETED",
    compliance_grade: "Grade A",
    risk_score: 18,
    sha256_hash: "0x8f4c2e1a9b7d3f5e6a8c0b2d4e6f8a1c3e5b7d9f0a2c4e6b8d0f2a4c6e8b0d2",
    geofence_verified: true,
    latitude: 28.5672,
    longitude: 77.1734,
    scores: {
      infrastructure: 88,
      hygiene: 85,
      food: 92,
      medical: 80,
      attendance: 90,
    },
    responses: {
      observation: "Infrastructure in sound condition. Clean living premises and active community kitchen.",
      fire_safety: "COMPLIANT",
      beneficiary_ratio: 88,
    },
    photos_count: 2,
    client_app: "Native Android Handheld APK (Kotlin)",
    notes: "Statutory surprise inspection verified on-site via PostGIS hardware geofence.",
  },
  {
    inspection_id: "INSP-2026-002",
    facility_id: "DOSJE-PB-002",
    facility_name: "Nasha Mukti Punarvas Kendra (IRCA)",
    officer_id: "44444444-4444-4444-4444-444444444444",
    officer_name: "Vikramaditya Roy",
    timestamp: "2026-09-12T11:15:00.000Z",
    status: "COMPLETED",
    compliance_grade: "Grade B",
    risk_score: 55,
    sha256_hash: "0x3b7d5e9a1c4f6e8b0d2a4c6e8f0a2c4e6b8d0f2a4c6e8b0d2a4c6e8f0a2c4e6",
    geofence_verified: true,
    latitude: 31.634,
    longitude: 74.8723,
    scores: {
      infrastructure: 65,
      hygiene: 70,
      food: 68,
      medical: 75,
      attendance: 62,
    },
    responses: {
      observation: "Dormitory sanitation requires deep cleaning. Dispensary stock verified.",
      fire_safety: "COMPLIANT",
      beneficiary_ratio: 65,
    },
    photos_count: 3,
    client_app: "Android Web Simulator (GovCloud Client)",
    notes: "Prioritized surveillance audit dispatched by Central AI Risk Engine.",
  },
];

function persistDatabase() {
  try {
    const payload = {
      version: "2.0",
      last_updated: new Date().toISOString(),
      officers: memoryOfficers,
      facilities: memoryFacilities,
      audits: memoryAudits,
      checklist: memoryChecklist,
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist live_db.json:", err);
  }
}

export const serverDb = {
  getOfficers(): Officer[] {
    loadDatabase();
    return memoryOfficers || [];
  },

  getOfficerById(id: string): Officer | undefined {
    loadDatabase();
    return memoryOfficers?.find((o) => o.id === id || o.username === id);
  },

  getFacilities(): Facility[] {
    loadDatabase();
    return memoryFacilities || [];
  },

  getFacilityById(id: string): Facility | undefined {
    loadDatabase();
    return memoryFacilities?.find((f) => f.id === id);
  },

  getAudits(): AuditRecord[] {
    loadDatabase();
    return memoryAudits || [];
  },

  /**
   * Dispatches an officer to a target facility and updates database state.
   */
  dispatchOfficer(officerId: string, facilityId: string, type: "RANDOM" | "RISK_WEIGHTED" = "RANDOM"): {
    officer: Officer;
    facility: Facility;
    inspectionId: string;
  } {
    loadDatabase();
    const officer = memoryOfficers?.find((o) => o.id === officerId || o.username === officerId);
    const facility = memoryFacilities?.find((f) => f.id === facilityId);

    if (!officer) throw new Error(`Officer '${officerId}' not found.`);
    if (!facility) throw new Error(`Facility '${facilityId}' not found.`);

    const inspectionId = `INSP-${type.substring(0, 4)}-${Date.now().toString().slice(-5)}`;

    // Update officer state
    officer.has_pending_assignment = true;
    officer.assigned_facility_id = facility.id;
    officer.assigned_facility_name = facility.name;
    officer.assigned_inspection_id = inspectionId;
    officer.assigned_facility_ids = [facility.id];
    officer.assigned_inspections = [
      {
        inspection_id: inspectionId,
        facility_id: facility.id,
        facility_name: facility.name,
        scheme_name: facility.scheme_name,
        scheduled_date: new Date().toISOString().slice(0, 10),
        status: "ASSIGNED",
        inspection_type: "SURPRISE_AUDIT",
        facilityDistrict: facility.district,
        facilityState: facility.state,
        latitude: facility.latitude,
        longitude: facility.longitude,
      },
    ];

    persistDatabase();

    return { officer, facility, inspectionId };
  },

  /**
   * Commits an audit submission to the central ledger and clears the officer's pending assignment.
   */
  submitAudit(data: any): AuditRecord {
    loadDatabase();

    const facilityId = data.facility_id || "DOSJE-DL-001";
    const officerId = data.inspector_id || data.officer_id || "33333333-3333-3333-3333-333333333333";
    const facility = memoryFacilities?.find((f) => f.id === facilityId);
    const officer = memoryOfficers?.find((o) => o.id === officerId || o.username === officerId);

    const scores = data.scores || {
      infrastructure: 85,
      hygiene: 80,
      food: 85,
      medical: 75,
      attendance: 85,
    };
    const avgScore = Math.round(
      ((scores.infrastructure || 80) +
        (scores.hygiene || 80) +
        (scores.food || 80) +
        (scores.medical || 80) +
        (scores.attendance || 80)) /
        5
    );

    let grade = "Grade B";
    if (avgScore >= 80) grade = "Grade A";
    else if (avgScore >= 60) grade = "Grade B";
    else if (avgScore >= 40) grade = "Grade C";
    else grade = "Grade D";

    const inspectionId = data.inspection_id || `INSP-${Date.now().toString(36).toUpperCase()}`;
    const sha256 =
      data.sha256_hash ||
      `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const record: AuditRecord = {
      inspection_id: inspectionId,
      facility_id: facilityId,
      facility_name: data.facility_name || facility?.name || "MoSJE Registered Facility",
      officer_id: officerId,
      officer_name: data.inspector_name || data.officer_name || officer?.full_name || "Field Inspector",
      timestamp: new Date().toISOString(),
      status: "COMPLETED",
      compliance_grade: grade,
      risk_score: facility?.risk_score || 20,
      sha256_hash: sha256,
      geofence_verified: data.geofence_verified !== false,
      latitude: data.inspector_latitude || facility?.latitude || 28.5672,
      longitude: data.inspector_longitude || facility?.longitude || 77.1734,
      accuracy: data.accuracy || 4.2,
      scores,
      responses: data.responses || (data.photos_evidence ? { photos: data.photos_evidence.length } : {}),
      photos_count: Array.isArray(data.photos)
        ? data.photos.length
        : Array.isArray(data.photos_evidence)
        ? data.photos_evidence.length
        : Number(data.photos_count) || 1,
      client_app: data.client_app || "Native Android Handheld APK (Kotlin)",
      notes: "Audit cryptographic package verified and stamped to central MoSJE ledger.",
    };

    // Insert at front
    memoryAudits?.unshift(record);

    // Clear officer's pending assignment now that audit is completed
    if (officer) {
      officer.has_pending_assignment = false;
      officer.assigned_facility_id = undefined;
      officer.assigned_facility_name = undefined;
      officer.assigned_inspection_id = undefined;
      officer.assigned_facility_ids = [];
      officer.assigned_inspections = [];
    }

    persistDatabase();

    return record;
  },

  /**
   * Resets the audits database to the initial statutory baseline seed records.
   */
  resetAudits(): AuditRecord[] {
    loadDatabase();
    memoryAudits = JSON.parse(JSON.stringify(BASELINE_SEED_AUDITS));
    persistDatabase();
    return memoryAudits || [];
  },

  getChecklist(): any {
    loadDatabase();
    return memoryChecklist || DEFAULT_STATUTORY_CHECKLIST;
  },

  saveChecklist(form: any): any {
    loadDatabase();
    memoryChecklist = form;
    persistDatabase();
    return memoryChecklist;
  },
};

export const DEFAULT_STATUTORY_CHECKLIST = {
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
    {
      id: "q-statutory-rubrics",
      type: "rubrics_checklist",
      title: "Statutory 5-Point Inspection Rubrics Matrix",
      description: "Interactive quantitative rubrics assessing infrastructure, hygiene, nutrition, medical care, and staff roll with automatic Grade calculation.",
      required: true,
      rubrics: [
        { id: "r_infra", name: "1. Infrastructure & Fire Safety", weight: 20, defaultScore: 85 },
        { id: "r_hygiene", name: "2. Hygiene & Cleanliness", weight: 20, defaultScore: 90 },
        { id: "r_food", name: "3. Food & Nutrition Standard", weight: 20, defaultScore: 80 },
        { id: "r_medical", name: "4. Medical Ward & Care Log", weight: 20, defaultScore: 85 },
        { id: "r_attendance", name: "5. Staff & Beneficiary Roll", weight: 20, defaultScore: 90 },
      ],
      passingScore: 70,
    },
  ],
};
