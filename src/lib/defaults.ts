import type { ProcedureRow, VoiFormValues } from "../types";

export const DEFAULT_PROCEDURES: readonly ProcedureRow[] = [
  { code: "D0150", name: "Comprehensive Exam", pct: "100%", freq: "2x/Year", history: "", teeth: false },
  { code: "D0120", name: "Periodic Exam", pct: "100%", freq: "2x/Year", history: "", teeth: false },
  { code: "D0140", name: "Limited Exam", pct: "100%", freq: "2x/Year", history: "", teeth: false },
  { code: "D0210/ D0330", name: "Full Mouth Series / Panorex", pct: "100%", freq: "1x/5Years", history: "", teeth: false },
  { code: "D1110", name: "Cleaning", pct: "100%", freq: "4x/Year", history: "", teeth: false },
  { code: "D1351", name: "Sealants", pct: "100%", freq: "1x/3Years", history: "", teeth: false },
  { code: "D1208", name: "Fluoride", pct: "100%", freq: "2x/Year", history: "", teeth: false },
  { code: "D2391", name: "Composite Filling", pct: "80%", freq: "No Frequency", history: "", teeth: true },
  { code: "D2740", name: "Porcelain Crown", pct: "50%", freq: "1x/7Years", history: "", teeth: true },
  { code: "D2950", name: "Core Build-Up", pct: "50%", freq: "1x/60Mo", history: "", teeth: true },
  { code: "D6740", name: "Bridge", pct: "50%", freq: "1x/60Mo", history: "", teeth: true },
  { code: "D3330", name: "Root Canal", pct: "80%", freq: "1x/Lifetime", history: "", teeth: true },
  { code: "D3348", name: "Retreatment of Root Canal", pct: "80%", freq: "1x/Lifetime", history: "", teeth: true },
  { code: "D4910", name: "Perio Maintenance", pct: "80%", freq: "4x/Year", history: "", teeth: false },
  { code: "D4355", name: "Full Mouth Debridement", pct: "80%", freq: "1x/3Years", history: "", teeth: false },
  { code: "D4341", name: "Scaling & Root Planning", pct: "80%", freq: "1x/2Years", history: "", teeth: false },
  { code: "D9944", name: "Occlusal Guard", pct: "80%", freq: "1x/2Years", history: "", teeth: false },
];

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultRecord(now = new Date()): VoiFormValues {
  return {
    date: todayIso(now),
    by: "",
    office: "",
    ins: "",
    sub: "",
    payor: "",
    pat: "",
    subid: "",
    patid: "",
    subdob: "",
    patdob: "",
    grp: "",
    grpn: "",
    byear: "",
    max: null,
    maxr: null,
    famd: null,
    indd: null,
    orthomax: null,
    orthod: null,
    dedmet: "NO",
    eff: "",
    bwait: "NONE",
    mwait: "NONE",
    mtc: "NONE",
    prev: "",
    basic: "",
    major: "",
    perio: "",
    endo: "",
    osurg: "",
    impl: "",
    abut: "",
    icrown: "",
    ortho: "Not Covered",
    notes: "",
    procedures: DEFAULT_PROCEDURES.map((row) => ({ ...row })),
  };
}

export function blankProcedures(rows: readonly ProcedureRow[]): ProcedureRow[] {
  return rows.map((row) => ({ ...row, pct: "", freq: "", history: "" }));
}

export function createFreshRecord(now = new Date()): VoiFormValues {
  const record = createDefaultRecord(now);
  return { ...record, procedures: blankProcedures(record.procedures) };
}
