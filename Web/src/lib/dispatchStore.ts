import facilitiesSeed from "@/data/facilities_seed.json";
import officersSeed from "@/data/officers_seed.json";
import { Facility, Officer } from "@/types";

export interface DispatchEvent {
  id: string;
  type: "RANDOM" | "RISK_WEIGHTED";
  officerId: string;
  officerName: string;
  facilityId: string;
  facilityName: string;
  schemeName: string;
  timestamp: string;
  riskScore: number;
}

const DISPATCH_STORAGE_KEY = "mosje-latest-dispatch";
const DISPATCH_CUSTOM_EVENT = "mosje-dispatch-triggered";

export function getLatestDispatch(): DispatchEvent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DISPATCH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function triggerRandomOfficerDispatch(): DispatchEvent {
  const officers: Officer[] = officersSeed.officers || [];
  const facilities: Facility[] = facilitiesSeed.facilities || [];

  // Pick from officers (prefer standby officers)
  const standbyOfficers = officers.filter(o => !o.has_pending_assignment);
  const pool = standbyOfficers.length > 0 ? standbyOfficers : officers;
  const officer = pool[Math.floor(Math.random() * pool.length)];

  // Pick random facility
  const facility = facilities[Math.floor(Math.random() * facilities.length)];

  const dispatchEvent: DispatchEvent = {
    id: `INSP-RANDOM-${Date.now().toString().slice(-6)}`,
    type: "RANDOM",
    officerId: officer.id,
    officerName: officer.full_name,
    facilityId: facility.id,
    facilityName: facility.name,
    schemeName: facility.scheme_name,
    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    riskScore: facility.risk_score,
  };

  saveDispatch(dispatchEvent);
  return dispatchEvent;
}

export function triggerRiskWeightedOfficerDispatch(): DispatchEvent {
  const officers: Officer[] = officersSeed.officers || [];
  const facilities: Facility[] = facilitiesSeed.facilities || [];

  // Sort facilities by risk score descending
  const sortedFacilities = [...facilities].sort((a, b) => b.risk_score - a.risk_score);
  // Pick from top 3 highest risk facilities
  const topRisks = sortedFacilities.slice(0, 3);
  const facility = topRisks[Math.floor(Math.random() * topRisks.length)];

  // Prefer Surprise Auditor / flying squad
  const flyingSquad = officers.filter(o => o.role === "SURPRISE_AUDITOR");
  const pool = flyingSquad.length > 0 ? flyingSquad : officers;
  const officer = pool[Math.floor(Math.random() * pool.length)];

  const dispatchEvent: DispatchEvent = {
    id: `INSP-RISK-${Date.now().toString().slice(-6)}`,
    type: "RISK_WEIGHTED",
    officerId: officer.id,
    officerName: officer.full_name,
    facilityId: facility.id,
    facilityName: facility.name,
    schemeName: facility.scheme_name,
    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    riskScore: facility.risk_score,
  };

  saveDispatch(dispatchEvent);
  return dispatchEvent;
}

function saveDispatch(dispatch: DispatchEvent) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(dispatch));
    window.dispatchEvent(new CustomEvent(DISPATCH_CUSTOM_EVENT, { detail: dispatch }));
  } catch (err) {
    console.error("Failed to save dispatch:", err);
  }
}

export function subscribeToDispatch(callback: (dispatch: DispatchEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<DispatchEvent>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(DISPATCH_CUSTOM_EVENT, handler);
  return () => window.removeEventListener(DISPATCH_CUSTOM_EVENT, handler);
}
