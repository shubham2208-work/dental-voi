export const PCT_OPTIONS = [
  "100%",
  "90%",
  "80%",
  "70%",
  "60%",
  "50%",
  "40%",
  "30%",
  "25%",
  "20%",
  "10%",
  "0%",
  "Not Covered",
  "N/A",
] as const;

export const PCT_STEP_OPTIONS = ["5%", "15%", "25%", "35%", "45%", "55%", "65%", "75%", "85%", "95%"] as const;

export const WAIT_OPTIONS = ["3 months", "6 months", "9 months", "12 months", "NONE"] as const;

export const MTC_OPTIONS = ["NONE", "YES"] as const;

export const FREQ_OPTIONS = [
  "No Frequency",
  "Unlimited",
  "1x/6Mo",
  "1x/12Mo",
  "2x/12Mo",
  "1x/Year",
  "2x/Year",
  "3x/Year",
  "4x/Year",
  "1x/24Mo",
  "1x/2Years",
  "1x/36Mo",
  "1x/3Years",
  "1x/48Mo",
  "1x/4Years",
  "1x/60Mo",
  "1x/5Years",
  "1x/84Mo",
  "1x/7Years",
  "1x/8Years",
  "1x/120Mo",
  "1x/10Years",
  "1x/Quad/24Mo",
  "1x/Lifetime",
  "2x/Lifetime",
  "Not Covered",
] as const;

export type PctId =
  | "prev"
  | "basic"
  | "major"
  | "perio"
  | "endo"
  | "osurg"
  | "impl"
  | "abut"
  | "icrown"
  | "ortho";

export type MoneyId = "max" | "maxr" | "famd" | "indd" | "orthomax" | "orthod";

export type TextId =
  | "date"
  | "by"
  | "office"
  | "ins"
  | "sub"
  | "payor"
  | "pat"
  | "subid"
  | "patid"
  | "subdob"
  | "patdob"
  | "grp"
  | "grpn"
  | "eff"
  | "bwait"
  | "mwait"
  | "mtc"
  | "notes";

export type ScalarKey = TextId | PctId | MoneyId | "byear" | "dedmet";

export interface ProcedureRow {
  code: string;
  name: string;
  pct: string;
  freq: string;
  history: string;
  teeth: boolean;
}

export interface VoiFormValues {
  date: string;
  by: string;
  office: string;
  ins: string;
  sub: string;
  payor: string;
  pat: string;
  subid: string;
  patid: string;
  subdob: string;
  patdob: string;
  grp: string;
  grpn: string;
  byear: "Calendar" | "Fiscal" | "";
  max: number | null;
  maxr: number | null;
  famd: number | null;
  indd: number | null;
  orthomax: number | null;
  orthod: number | null;
  dedmet: "YES" | "NO" | "";
  eff: string;
  bwait: string;
  mwait: string;
  mtc: string;
  prev: string;
  basic: string;
  major: string;
  perio: string;
  endo: string;
  osurg: string;
  impl: string;
  abut: string;
  icrown: string;
  ortho: string;
  notes: string;
  procedures: ProcedureRow[];
}

export type VoiPatch = Partial<Omit<VoiFormValues, "procedures">>;
