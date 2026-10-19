import type { VoiFormValues } from "../../types";

export interface PatientSummary {
  id: string;
  pat: string;
  patdob: string | null;
  patid: string;
  subid: string;
  last_visit_date: string | null;
}

export interface VisitSummary {
  visit_id: string;
  date_of_service: string;
  updated_at: string;
}

export interface SaveVisitResult {
  patient_id: string;
  visit_id: string;
  patient_key: string;
}

export interface GetVisitResult {
  visit_id: string;
  patient_id: string;
  date_of_service: string;
  form_data: VoiFormValues;
  updated_at: string;
}

export interface VerifyPinResult {
  token: string;
  expires_at: string;
}
