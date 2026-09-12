export interface Facility {
  id: string;
  name: string;
  scheme_code: string;
  scheme_name: string;
  organization_name: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  sanctioned_capacity: number;
  enrolled_beneficiaries: number;
  compliance_grade: string;
  risk_score: number;
  in_charge_name: string;
  contact_phone: string;
  contact_email: string;
  last_inspected_at?: string;
  is_active: boolean | number;
}

export interface AssignedInspection {
  inspection_id: string;
  facility_id: string;
  facility_name: string;
  scheme_name: string;
  latitude?: number;
  longitude?: number;
}

export interface Officer {
  id: string;
  username: string;
  full_name: string;
  role: string;
  designation: string;
  district?: string | null;
  state?: string | null;
  email?: string;
  phone?: string;
  has_pending_assignment: boolean;
  assigned_facility_id?: string | null;
  assigned_facility_name?: string | null;
  assigned_inspection_id?: string | null;
  assigned_inspections: AssignedInspection[];
  assigned_facility_ids: string[];
  jurisdiction_facility_ids: string[];
}

export type QuestionType = 'text' | 'yes_no' | 'number_range' | 'photo_evidence';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  // Text options
  placeholder?: string;
  maxLength?: number;
  // Yes/No options
  positiveLabel?: string;
  negativeLabel?: string;
  criticalFailure?: boolean;
  // Number range options
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  targetThreshold?: number;
  // Photo evidence options
  photoCategory?: string;
  minPhotos?: number;
  requireGeotagWatermark?: boolean;
}

export interface ChecklistForm {
  title: string;
  schemeCode: string;
  category: string;
  description: string;
  targetFacilityType: string;
  questions: Question[];
}
