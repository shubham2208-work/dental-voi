import { BENEFIT_FIELDS, COIN_FIELDS, LIMIT_FIELDS, PATIENT_FIELDS } from "./fields";
import type { FieldDef } from "./field-types";
import type { VoiFormValues } from "../types";

const REQUIRED_FIELDS: readonly FieldDef[] = [...PATIENT_FIELDS, ...BENEFIT_FIELDS, ...LIMIT_FIELDS, ...COIN_FIELDS];

function filled(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim() !== "";
  return false;
}

function rowLabel(code: string, index: number): string {
  const trimmed = code.trim();
  return trimmed || `row ${index + 1}`;
}

export function missingPrintFields(values: VoiFormValues): string[] {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!filled(values[field.name])) missing.push(field.label);
  }
  values.procedures.forEach((row, index) => {
    const label = rowLabel(row.code, index);
    if (!filled(row.code)) missing.push(`CDT code for row ${index + 1}`);
    if (!filled(row.pct)) missing.push(`Covered percent for ${label}`);
    if (!filled(row.name)) missing.push(`Procedure name for ${label}`);
    if (!filled(row.freq)) missing.push(`Frequency for ${label}`);
  });
  return missing;
}

export function printBlockMessage(missing: readonly string[]): string {
  return `Print stays closed until these fields are filled: ${missing.join(", ")}.`;
}

export function hasRecordedHistory(values: VoiFormValues): boolean {
  return values.procedures.some((row) => row.history.trim() !== "");
}

export const NO_HISTORY_PROMPT = "No history recorded. Do you want to continue?";
export const PRINT_SUCCESS = "Successfully printed.";
