import { describe, expect, it } from "vitest";
import type { ScalarKey } from "../types";
import { createDefaultRecord } from "./defaults";
import { applyExtract, describeExtract, extractText, findProcedureRow } from "./extract";
import { normalizeDate } from "./normalize";
import { SAMPLE_TEXT } from "./sample";

const aliases: { line: string; key: ScalarKey; value: string | number }[] = [
  { line: "Patient Name: Sam", key: "pat", value: "Sam" },
  { line: "Pt Name: Sam", key: "pat", value: "Sam" },
  { line: "Patient ID: PT1", key: "patid", value: "PT1" },
  { line: "Chart: C9", key: "patid", value: "C9" },
  { line: "DOB: 01/02/2012", key: "patdob", value: "2012-01-02" },
  { line: "Date of Birth: 01/02/2012", key: "patdob", value: "2012-01-02" },
  { line: "Patient Date of Birth: 01/02/2012", key: "patdob", value: "2012-01-02" },
  { line: "Subscriber: Jane", key: "sub", value: "Jane" },
  { line: "Member: Jane", key: "sub", value: "Jane" },
  { line: "Policyholder: Jane", key: "sub", value: "Jane" },
  { line: "Insured: Jane", key: "sub", value: "Jane" },
  { line: "Member ID: M1", key: "subid", value: "M1" },
  { line: "Sub ID: S1", key: "subid", value: "S1" },
  { line: "Subscriber ID: S1", key: "subid", value: "S1" },
  { line: "Subscriber DOB: 03/15/1980", key: "subdob", value: "1980-03-15" },
  { line: "Insurance: Delta", key: "ins", value: "Delta" },
  { line: "Payer: Delta", key: "ins", value: "Delta" },
  { line: "Payor: Delta", key: "ins", value: "Delta" },
  { line: "Carrier: Delta", key: "ins", value: "Delta" },
  { line: "Payer ID: 12", key: "payor", value: "12" },
  { line: "Group Number: G1", key: "grp", value: "G1" },
  { line: "Group Name: Acme", key: "grpn", value: "Acme" },
  { line: "Employer: Acme", key: "grpn", value: "Acme" },
  { line: "Effective Date: 2026-01-01", key: "eff", value: "2026-01-01" },
  { line: "Annual Max: $1,500", key: "max", value: 1500 },
  { line: "In-Network Max: $1,500", key: "max", value: 1500 },
  { line: "Max Remaining: $10", key: "maxr", value: 10 },
  { line: "Remaining: $10", key: "maxr", value: 10 },
  { line: "Family Deductible: $15", key: "famd", value: 15 },
  { line: "Individual Deductible: $5", key: "indd", value: 5 },
  { line: "Deductible: $50", key: "indd", value: 50 },
  { line: "Ortho Max: $9", key: "orthomax", value: 9 },
  { line: "Ortho Deductible: $1", key: "orthod", value: 1 },
  { line: "Deductible Met: YES", key: "dedmet", value: "YES" },
  { line: "Basic Waiting Period: 6 months", key: "bwait", value: "6 months" },
  { line: "Major Waiting Period: NONE", key: "mwait", value: "NONE" },
  { line: "Missing Tooth Clause: none", key: "mtc", value: "NONE" },
  { line: "Preventative: 100%", key: "prev", value: "100%" },
  { line: "Preventive: 90%", key: "prev", value: "90%" },
  { line: "Basic: 80", key: "basic", value: "80%" },
  { line: "Major: 50%", key: "major", value: "50%" },
  { line: "Perio: 80%", key: "perio", value: "80%" },
  { line: "Endo: 80%", key: "endo", value: "80%" },
  { line: "Oral Surgery: 70%", key: "osurg", value: "70%" },
  { line: "Implants: 50%", key: "impl", value: "50%" },
  { line: "Implant Abutment: 50%", key: "abut", value: "50%" },
  { line: "Implant Crowns: 60%", key: "icrown", value: "60%" },
  { line: "Ortho: Not Covered", key: "ortho", value: "Not Covered" },
  { line: "Ortho: excluded", key: "ortho", value: "Not Covered" },
  { line: "Completed By: Alex", key: "by", value: "Alex" },
  { line: "Verified By: Alex", key: "by", value: "Alex" },
  { line: "Date: 10/19/2026", key: "date", value: "2026-10-19" },
  { line: "Notes: hello", key: "notes", value: "hello" },
  { line: "Office Name: Smile", key: "office", value: "Smile" },
  { line: "Benefit Year: Fiscal", key: "byear", value: "Fiscal" },
];

describe("extractText aliases", () => {
  it.each(aliases)("maps $line", ({ line, key, value }) => {
    const result = extractText(line, []);
    expect(result.patch[key]).toEqual(value);
    expect(result.unrecognized).toEqual([]);
  });

  it("prefers the more specific label", () => {
    const text = [
      "Deductible Met: YES",
      "Individual Deductible: $50",
      "Sub DOB: 01/02/1980",
      "DOB: 03/04/2012",
      "Ortho Max: $1000",
      "In-Network Max: $1500",
      "Basic Waiting Period: NONE",
      "Basic: 80%",
      "Major Waiting Period: 6 months",
      "Major: 50%",
      "Implant Crowns: 60%",
      "Implants: 50%",
    ].join("\n");
    const { patch } = extractText(text, []);
    expect(patch.dedmet).toBe("YES");
    expect(patch.indd).toBe(50);
    expect(patch.subdob).toBe("1980-01-02");
    expect(patch.patdob).toBe("2012-03-04");
    expect(patch.orthomax).toBe(1000);
    expect(patch.max).toBe(1500);
    expect(patch.ortho).toBeUndefined();
    expect(patch.bwait).toBe("NONE");
    expect(patch.basic).toBe("80%");
    expect(patch.mwait).toBe("6 months");
    expect(patch.major).toBe("50%");
    expect(patch.icrown).toBe("60%");
    expect(patch.impl).toBe("50%");
  });
});

describe("subscriber name and id", () => {
  it("reads subscriber name, sub name, and a subscriber number", () => {
    const named = extractText("Subscriber Name: Jane Doe\nSub Name: Janet Doe\nSubscriber #: SUB999", []);
    expect(named.patch.sub).toBe("Janet Doe");
    expect(named.patch.subid).toBe("SUB999");
    expect(extractText("Sub #: S1", []).patch.subid).toBe("S1");
  });

  it("reads both fields when they share one line", () => {
    const result = extractText("Subscriber Name: Jane Doe Subscriber ID: SUB999", []);
    expect(result.patch.sub).toBe("Jane Doe");
    expect(result.patch.subid).toBe("SUB999");
    expect(result.unrecognized).toEqual([]);
  });

  it("reads a label on one line and the value on the next", () => {
    const result = extractText(["Subscriber Name", "Jane Doe", "Subscriber ID", "SUB999"].join("\n"), []);
    expect(result.patch.sub).toBe("Jane Doe");
    expect(result.patch.subid).toBe("SUB999");
    expect(result.unrecognized).toEqual([]);
  });

  it("reads a subscriber block whose name and id are child lines", () => {
    const result = extractText(["Subscriber", "Name: Jane Doe", "ID: SUB999", "DOB: 03/15/1980"].join("\n"), []);
    expect(result.patch.sub).toBe("Jane Doe");
    expect(result.patch.subid).toBe("SUB999");
    expect(result.patch.subdob).toBe("1980-03-15");
    expect(result.patch.patdob).toBeUndefined();
    expect(result.unrecognized).toEqual([]);
  });

  it("keeps a following patient dob on the patient", () => {
    const result = extractText(
      ["Subscriber: Jane Doe", "ID: SUB999", "DOB: 03/15/1980", "Patient: Sam Doe", "DOB: 01/02/2012"].join("\n"),
      [],
    );
    expect(result.patch.sub).toBe("Jane Doe");
    expect(result.patch.subid).toBe("SUB999");
    expect(result.patch.subdob).toBe("1980-03-15");
    expect(result.patch.pat).toBe("Sam Doe");
    expect(result.patch.patdob).toBe("2012-01-02");
  });

  it("reads a copied sheet header row", () => {
    const result = extractText("Subscriber Name\tSubscriber ID\tPatient Name\nJane Doe\tSUB999\tSam Doe", []);
    expect(result.patch.sub).toBe("Jane Doe");
    expect(result.patch.subid).toBe("SUB999");
    expect(result.patch.pat).toBe("Sam Doe");
    expect(result.unrecognized).toEqual([]);
  });

  it("reads glued labels and values separated by wide spaces", () => {
    const glued = extractText("SubscriberName: Jane Doe\nSubscriberID: SUB999", []);
    expect(glued.patch.sub).toBe("Jane Doe");
    expect(glued.patch.subid).toBe("SUB999");
    const spaced = extractText("Subscriber Name    Jane Doe", []);
    expect(spaced.patch.sub).toBe("Jane Doe");
    expect(spaced.unrecognized).toEqual([]);
  });

  it("does not treat a bare id as the subscriber id", () => {
    const result = extractText("ID: SUB999", []);
    expect(result.patch.subid).toBeUndefined();
    expect(result.unrecognized).toEqual(["ID: SUB999"]);
  });
});

describe("Smile Loft sheet paste", () => {
  const sheet = [
    "Smile Loft Dental VOI Form",
    "Date:\t10/16/2025\tCompleted By:\tshubham\tAffinity",
    "Insurance Name\tuhc\tSubscriber:\tsubtest\tPayor ID\t\t560",
    "Patient Name\ttestname\tSub. ID #:\t\t\t1234",
    "Patient ID\t234\tSub. D.O.B:\t\t01/01/1998",
    "Patient DOB\t01/01/2002\tGroup #:\t\t00903",
    "Group Name\ttestgroup\tBenefit Year\tCalendar\tNotes: yrzys",
    "In Network Benefits",
    "In-Network Max\t$0.00\tFamily Deductible\t$0.00\tOrtho Max\t$0.00\tDeductible Met:\tNO",
    "Max Remaining\t$0.00\tIndividual Deductible\t$0.00\tOrtho Deductible\t$0.00",
    "Plan Limitations",
    "Effective Date:\t01/01/2024\tBasic Waiting Period\tNONE\tMajor Waiting Period\tNONE\tMissing Tooth Clause\tNONE",
    "Co-Insurance %\tCovered %\tCategory\t%\tCategory\t%",
    "Preventative\t100%\tPerio\t80%\tImplants\t50%\tOrtho\tNOT COVERED",
    "Basic\t80%\tEndo\t80%\tImplant Abutment\t50%",
    "Major\t50%\tOral Surgery\t80%\tImplant Crowns\t50%",
    "Code\tCovered %\tProcedure\tFrequency\tHistory / Last date of Service",
    "D0150\t100%\tComprehensive Exam\t2x/ Year",
    "D0210/ D0330\t100%\tFull Mouth Series / Panorex\t1x5Years",
    "D1110\t100%\tCleaning\t4x/Year",
    "D1351\t100%\tSealants\t1x3Years",
    "D2391\t80%\tComposite Filling\tNo Frequency\tTeeth #:",
    "D2740\t50%\tPorcelain Crown\t1x7Years\tTeeth #:",
    "D2950\t50%\tCore Build-Up\t1x60Mo\tTeeth #:",
    "D3330\t80%\tRoot Canal\t1xLifetime\tTeeth #:",
    "D4910\t80%\tPerio Maintenance\t4x/Year",
    "D4355\t80%\tFull Mouth Debridement\t1x3Years",
    "D4341\t80%\tScaling & Root Planning\t1x2Years",
  ].join("\n");

  it("fills subscriber name and id from the sheet grid", () => {
    const applied = applyExtract(createDefaultRecord(), sheet);
    expect(applied.next.date).toBe("2025-10-16");
    expect(applied.next.by).toBe("shubham");
    expect(applied.next.office).toBe("Affinity");
    expect(applied.next.ins).toBe("uhc");
    expect(applied.next.sub).toBe("subtest");
    expect(applied.next.subid).toBe("1234");
    expect(applied.next.payor).toBe("560");
    expect(applied.next.pat).toBe("testname");
    expect(applied.next.patid).toBe("234");
    expect(applied.next.subdob).toBe("1998-01-01");
    expect(applied.next.patdob).toBe("2002-01-01");
    expect(applied.next.grp).toBe("00903");
    expect(applied.next.grpn).toBe("testgroup");
    expect(applied.next.byear).toBe("Calendar");
    expect(applied.next.notes).toBe("yrzys");
    expect(applied.next.max).toBe(0);
    expect(applied.next.dedmet).toBe("NO");
    expect(applied.next.eff).toBe("2024-01-01");
    expect(applied.next.bwait).toBe("NONE");
    expect(applied.next.ortho).toBe("Not Covered");
    expect(applied.next.basic).toBe("80%");
    expect(applied.next.impl).toBe("50%");
    expect(applied.next.procedures[0]?.freq).toBe("2x/Year");
    expect(applied.next.procedures[3]?.freq).toBe("1x/5Years");
    expect(applied.next.procedures[5]?.freq).toBe("1x/3Years");
    expect(applied.next.procedures[7]?.freq).toBe("No Frequency");
    expect(applied.next.procedures[7]?.history).toBe("");
    expect(applied.next.procedures[8]?.freq).toBe("1x/7Years");
    expect(applied.next.procedures[9]?.freq).toBe("1x/60Mo");
    expect(applied.next.procedures[11]?.freq).toBe("1x/Lifetime");
    expect(applied.next.procedures[15]?.freq).toBe("1x/2Years");
    expect(applied.unrecognized).not.toContain("Subscriber:\tsubtest");
  });
});

describe("extractText lines", () => {
  it("keeps UHC when the co-insurance heading follows the insurance name", () => {
    const text = [
      "Insurance Name\tUHC\tSubscriber:\tsubtest\tPayor ID\t\t560",
      "Co-Insurance %\tCovered %\tCategory\t%",
      "Preventative\t100%\tPerio\t80%",
      "Coinsurance: 80%",
    ].join("\n");
    const result = extractText(text, []);
    expect(result.patch.ins).toBe("UHC");
    expect(result.patch.payor).toBe("560");
    expect(result.patch.prev).toBe("100%");
  });

  it("reads several tab-separated pairs from one sheet row", () => {
    const result = extractText("Patient Name\tSam Doe\tPatient DOB\t01/02/2012\tInsurance\tDelta Dental", []);
    expect(result.patch.pat).toBe("Sam Doe");
    expect(result.patch.patdob).toBe("2012-01-02");
    expect(result.patch.ins).toBe("Delta Dental");
    expect(result.unrecognized).toEqual([]);
  });

  it("keeps going when one line cannot be parsed", () => {
    const result = extractText("DOB: 13/40/2026\nPatient Name: Sam\n@@@", []);
    expect(result.patch.pat).toBe("Sam");
    expect(result.patch.patdob).toBeUndefined();
    expect(result.unrecognized).toEqual(["DOB: 13/40/2026", "@@@"]);
  });

  it("does not treat a patient id that looks like a CDT code as a procedure", () => {
    const result = extractText("Patient ID: D1234", []);
    expect(result.patch.patid).toBe("D1234");
    expect(result.procedures).toEqual([]);
  });

  it("ignores blank lines and does not throw", () => {
    expect(() => extractText(":::\n@@@\n\nD1110 100% 4x/Year", ["D1110"])).not.toThrow();
    const result = extractText("\n\nPatient Name: Sam\n\n", []);
    expect(result.patch.pat).toBe("Sam");
    expect(result.unrecognized).toEqual([]);
  });

  it("matches either code on the combined film row", () => {
    const rows = ["D0150", "D0210/ D0330", "D1110"];
    expect(findProcedureRow(rows, ["D0330"])).toBe(1);
    expect(findProcedureRow(rows, ["D0210"])).toBe(1);
    const result = extractText("D0330 100% 1x/5Years", rows);
    expect(result.procedures[0]?.codes).toEqual(["D0330"]);
    expect(result.procedures[0]?.freq).toBe("1x/5Years");
  });
});

describe("applyExtract", () => {
  it("fills the sample and highlights the matched cells", () => {
    const applied = applyExtract(createDefaultRecord(), SAMPLE_TEXT);
    expect(applied.next.pat).toBe("Sam Doe");
    expect(applied.next.office).toBe("Smile Loft Dental");
    expect(applied.next.by).toBe("Alex Rivera");
    expect(applied.next.date).toBe("2026-10-19");
    expect(applied.next.patdob).toBe(normalizeDate("07-04-12"));
    expect(applied.next.subdob).toBe("1980-03-15");
    expect(applied.next.subid).toBe("SUB999");
    expect(applied.next.max).toBe(1500);
    expect(applied.next.maxr).toBe(1200.5);
    expect(applied.next.orthod).toBe(0);
    expect(applied.next.basic).toBe("80%");
    expect(applied.next.major).toBe("50%");
    expect(applied.next.byear).toBe("Calendar");
    expect(applied.next.dedmet).toBe("NO");
    expect(applied.next.mwait).toBe("12 months");
    expect(applied.next.procedures).toHaveLength(17);
    expect(applied.next.procedures[3]?.freq).toBe("1x/5Years");
    expect(applied.next.procedures[4]?.history).toBe("2026-01-15");
    expect(applied.next.procedures[5]?.freq).toBe("1x/3Years");
    expect(applied.next.procedures[7]?.freq).toBe("No Frequency");
    expect(applied.next.procedures[7]?.history).toBe("Teeth #: 14");
    expect(applied.next.procedures[8]?.freq).toBe("1x/7Years");
    expect(applied.next.procedures[9]?.freq).toBe("1x/60Mo");
    expect(applied.next.procedures[9]?.history).toBe("Teeth #: 3");
    expect(applied.next.procedures[11]?.freq).toBe("1x/Lifetime");
    expect(applied.next.procedures[11]?.history).toBe("Teeth #: 19");
    expect(applied.next.procedures[14]?.freq).toBe("1x/3Years");
    expect(applied.unrecognized).toEqual(["Call the carrier about the missing claim from last year"]);
    expect(applied.highlighted).toContain("pat");
    expect(applied.highlighted).toContain("procedures.3.pct");
    expect(applied.highlighted).toContain("procedures.4.history");
    expect(applied.message).toBe(describeExtract(applied.highlighted.length, 1));
    expect(applied.message).toContain("Review the amber fields.");
  });

  it("keeps percentages and frequencies that are not in the dropdown lists", () => {
    const applied = applyExtract(createDefaultRecord(), "Basic: 35%\nD1110 80% 1x/18Mo");
    expect(applied.next.basic).toBe("35%");
    expect(applied.next.procedures[4]?.freq).toBe("1x/18Mo");
    expect(applied.next.procedures[4]?.pct).toBe("80%");
  });

  it("reads common dental plan frequencies", () => {
    const applied = applyExtract(
      createDefaultRecord(),
      ["D1110 100% 1 per 6 months", "D4341 80% 1 per quadrant per 24 months", "D2391 80% unlimited"].join("\n"),
    );
    expect(applied.next.procedures[4]?.freq).toBe("1x/6Mo");
    expect(applied.next.procedures[15]?.freq).toBe("1x/Quad/24Mo");
    expect(applied.next.procedures[7]?.freq).toBe("Unlimited");
  });

  it("appends a procedure row when the code is new", () => {
    const applied = applyExtract(createDefaultRecord(), "D9999 40% 1x/Year");
    expect(applied.next.procedures).toHaveLength(18);
    expect(applied.next.procedures[17]).toMatchObject({ code: "D9999", pct: "40%", freq: "1x/Year" });
  });
});
