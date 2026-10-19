import type { MoneyId, PctId, TextId } from "../types";

export type FieldDef =
  | { kind: "text" | "date" | "clause"; name: TextId; label: string }
  | { kind: "wait"; name: "bwait" | "mwait"; label: string }
  | { kind: "mtc"; name: "mtc"; label: string }
  | { kind: "money"; name: MoneyId; label: string }
  | { kind: "pct"; name: PctId; label: string }
  | { kind: "byear"; name: "byear"; label: string }
  | { kind: "yesno"; name: "dedmet"; label: string }
  | { kind: "notes"; name: "notes"; label: string };
