import type { FieldDef } from "./field-types";

export type { FieldDef } from "./field-types";

export const PATIENT_FIELDS = [
  { kind: "date", name: "date", label: "Date" },
  { kind: "text", name: "by", label: "Completed By" },
  { kind: "text", name: "office", label: "Office Name" },
  { kind: "text", name: "ins", label: "Insurance Name" },
  { kind: "text", name: "sub", label: "Subscriber" },
  { kind: "text", name: "payor", label: "Payor ID" },
  { kind: "text", name: "pat", label: "Patient Name" },
  { kind: "text", name: "subid", label: "Sub. ID #" },
  { kind: "text", name: "patid", label: "Patient ID" },
  { kind: "date", name: "subdob", label: "Sub. D.O.B" },
  { kind: "date", name: "patdob", label: "Patient DOB" },
  { kind: "text", name: "grp", label: "Group #" },
  { kind: "text", name: "grpn", label: "Group Name" },
  { kind: "byear", name: "byear", label: "Benefit Year" },
] as const satisfies readonly FieldDef[];

export const BENEFIT_FIELDS = [
  { kind: "money", name: "max", label: "In-Network Max" },
  { kind: "money", name: "maxr", label: "Max Remaining" },
  { kind: "money", name: "famd", label: "Family Deductible" },
  { kind: "money", name: "indd", label: "Individual Deductible" },
  { kind: "money", name: "orthomax", label: "Ortho Max" },
  { kind: "money", name: "orthod", label: "Ortho Deductible" },
  { kind: "yesno", name: "dedmet", label: "Deductible Met" },
] as const satisfies readonly FieldDef[];

export const LIMIT_FIELDS = [
  { kind: "date", name: "eff", label: "Effective Date" },
  { kind: "wait", name: "bwait", label: "Basic Waiting Period" },
  { kind: "wait", name: "mwait", label: "Major Waiting Period" },
  { kind: "mtc", name: "mtc", label: "Missing Tooth Clause" },
] as const satisfies readonly FieldDef[];

export const COIN_FIELDS = [
  { kind: "pct", name: "prev", label: "Preventative" },
  { kind: "pct", name: "basic", label: "Basic" },
  { kind: "pct", name: "major", label: "Major" },
  { kind: "pct", name: "perio", label: "Perio" },
  { kind: "pct", name: "endo", label: "Endo" },
  { kind: "pct", name: "osurg", label: "Oral Surgery" },
  { kind: "pct", name: "impl", label: "Implants" },
  { kind: "pct", name: "abut", label: "Implant Abutment" },
  { kind: "pct", name: "icrown", label: "Implant Crowns" },
  { kind: "pct", name: "ortho", label: "Ortho" },
] as const satisfies readonly FieldDef[];

export const NOTES_FIELD = { kind: "notes", name: "notes", label: "Notes" } as const satisfies FieldDef;

export const SUMMARY_FIELDS: readonly FieldDef[] = [
  ...PATIENT_FIELDS,
  ...BENEFIT_FIELDS,
  ...LIMIT_FIELDS,
  ...COIN_FIELDS,
  NOTES_FIELD,
];
