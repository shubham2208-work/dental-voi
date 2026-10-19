import { describe, expect, it } from "vitest";
import { blankProcedures, createDefaultRecord } from "./defaults";
import { hasRecordedHistory, missingPrintFields, printBlockMessage } from "./printReady";
import type { VoiFormValues } from "../types";

const NOW = new Date(2026, 5, 15);

function readyRecord(): VoiFormValues {
  const values = createDefaultRecord(NOW);
  values.by = "shubham";
  values.office = "Affinity";
  values.ins = "UHC";
  values.sub = "subtest";
  values.payor = "560";
  values.pat = "testname";
  values.subid = "1234";
  values.patid = "234";
  values.subdob = "1998-01-01";
  values.patdob = "2002-01-01";
  values.grp = "00903";
  values.grpn = "testgroup";
  values.byear = "Calendar";
  values.max = 0;
  values.maxr = 0;
  values.famd = 0;
  values.indd = 0;
  values.orthomax = 0;
  values.orthod = 0;
  values.eff = "2024-01-01";
  values.prev = "100%";
  values.basic = "80%";
  values.major = "50%";
  values.perio = "80%";
  values.endo = "80%";
  values.osurg = "80%";
  values.impl = "50%";
  values.abut = "50%";
  values.icrown = "50%";
  values.notes = "";
  values.procedures = values.procedures.map((row) => ({ ...row, history: "" }));
  return values;
}

describe("missingPrintFields", () => {
  it("allows a complete form when history and notes are blank", () => {
    expect(missingPrintFields(readyRecord())).toEqual([]);
  });

  it("treats zero dollars as a filled money field", () => {
    const values = readyRecord();
    values.max = 0;
    expect(missingPrintFields(values)).toEqual([]);
  });

  it("lists empty header, benefit, and co-insurance fields on a new form", () => {
    const missing = missingPrintFields(createDefaultRecord(NOW));
    expect(missing).toContain("Patient Name");
    expect(missing).toContain("Benefit Year");
    expect(missing).toContain("In-Network Max");
    expect(missing).toContain("Preventative");
    expect(missing).not.toContain("Notes");
    expect(missing).not.toContain("Deductible Met");
    expect(missing).not.toContain("Ortho");
    expect(missing.some((label) => label.startsWith("History"))).toBe(false);
    expect(missing.some((label) => label.startsWith("CDT code"))).toBe(false);
  });

  it("requires procedure percent and frequency after the table is blanked", () => {
    const values = readyRecord();
    values.procedures = blankProcedures(values.procedures);
    const missing = missingPrintFields(values);
    expect(missing).toContain("Covered percent for D0150");
    expect(missing).toContain("Frequency for D0150");
    expect(missing.some((label) => label.includes("History"))).toBe(false);
  });

  it("names a procedure row when its code is empty", () => {
    const values = readyRecord();
    values.procedures[0] = { ...values.procedures[0]!, code: "  ", name: "" };
    expect(missingPrintFields(values)).toEqual(["CDT code for row 1", "Procedure name for row 1"]);
  });
});

describe("hasRecordedHistory", () => {
  it("is false when every history cell is blank", () => {
    const values = readyRecord();
    values.procedures[3] = { ...values.procedures[3]!, history: "   " };
    expect(hasRecordedHistory(values)).toBe(false);
  });

  it("is true when one history cell has a value", () => {
    const values = readyRecord();
    values.procedures[7] = { ...values.procedures[7]!, history: "Teeth #: 14" };
    expect(hasRecordedHistory(values)).toBe(true);
  });
});

describe("printBlockMessage", () => {
  it("names the fields that still need a value", () => {
    expect(printBlockMessage(["Patient Name", "Preventative"])).toBe(
      "Print stays closed until these fields are filled: Patient Name, Preventative.",
    );
  });
});
