import type { VoiFormValues } from "../../types";
import { clearStoredToken, getStoredToken, storeToken } from "./session";
import type {
  GetVisitResult,
  PatientSummary,
  SaveVisitResult,
  VerifyPinResult,
  VisitSummary,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function supabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!url) throw new ApiError("Backend not configured (missing VITE_SUPABASE_URL)", 0);
  return url.replace(/\/$/, "");
}

function anonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new ApiError("Backend not configured (missing VITE_SUPABASE_ANON_KEY)", 0);
  return key;
}

function functionsBase(): string {
  return `${supabaseUrl()}/functions/v1`;
}

export function isBackendConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL?.trim() && import.meta.env.VITE_SUPABASE_ANON_KEY?.trim());
}

async function invoke<T>(name: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey(),
  };

  if (auth) {
    const token = getStoredToken();
    if (!token) throw new ApiError("Office PIN required", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${functionsBase()}/${name}`, {
    method: "POST",
    headers,
    body: body === undefined ? "{}" : JSON.stringify(body),
  });

  let payload: { error?: string } & T;
  try {
    payload = (await res.json()) as { error?: string } & T;
  } catch {
    throw new ApiError("Invalid server response", res.status);
  }

  if (!res.ok) {
    if (res.status === 401 && auth) clearStoredToken();
    throw new ApiError(payload.error ?? "Request failed", res.status);
  }

  return payload;
}

export async function verifyPin(pin: string): Promise<VerifyPinResult> {
  const result = await invoke<VerifyPinResult>("verify_pin", { pin }, false);
  storeToken(result.token, result.expires_at);
  return result;
}

export function signOutOffice(): void {
  clearStoredToken();
}

export function hasOfficeSession(): boolean {
  return getStoredToken() !== null;
}

export async function searchPatients(query: {
  pat?: string;
  patdob?: string;
  subid?: string;
}): Promise<PatientSummary[]> {
  const result = await invoke<{ patients: PatientSummary[] }>("search_patients", query);
  return result.patients;
}

export async function listVisits(patientId: string): Promise<VisitSummary[]> {
  const result = await invoke<{ visits: VisitSummary[] }>("list_visits", { patient_id: patientId });
  return result.visits;
}

export async function getVisit(visitId: string): Promise<GetVisitResult> {
  return invoke<GetVisitResult>("get_visit", { visit_id: visitId });
}

export async function saveVisit(form: VoiFormValues): Promise<SaveVisitResult> {
  return invoke<SaveVisitResult>("save_visit", form);
}
