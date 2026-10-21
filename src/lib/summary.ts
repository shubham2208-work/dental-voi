import type { VoiFormValues } from "../types";
import type { FieldDef } from "./field-types";
import { SUMMARY_FIELDS } from "./fields";
import { formatDate, formatMoney } from "./normalize";

export function toSummary(values: VoiFormValues): string {
  const lines = ["Dental VOI", ""];
  for (const field of SUMMARY_FIELDS) {
    lines.push(`${field.label}: ${displayValue(field, values)}`);
  }
  lines.push("", "Procedures", "Code | Covered % | Procedure | Frequency | History");
  for (const row of values.procedures) {
    lines.push([row.code, row.pct, row.name, row.freq, row.history].join(" | "));
  }
  return lines.join("\n");
}

function displayValue(field: FieldDef, values: VoiFormValues): string {
  if (field.kind === "money") return formatMoney(values[field.name]);
  if (field.kind === "date") return formatDate(values[field.name]);
  return values[field.name];
}
