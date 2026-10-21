import { describe, expect, it } from "vitest";
import { blankProcedures, createDefaultRecord, createFreshRecord } from "./defaults";
import {
  formatDate,
  formatMoney,
  normalizeDate,
  normalizeFrequency,
  normalizeLabel,
  normalizeMissingTooth,
  normalizeMoney,
  normalizePercent,
  normalizeWaiting,
  optionsWithValue,
} from "./normalize";
import { FREQ_OPTIONS, PCT_OPTIONS } from "../types";
import { toSummary } from "./summary";

const NOW = new Date(2026, 5, 15);

describe("normalizeLabel", () => {
  it("strips punctuation used on the sheet", () => {
    expect(normalizeLabel("Sub. D.O.B")).toBe("sub dob");
    expect(normalizeLabel("Sub. ID #")).toBe("sub id");
    expect(normalizeLabel("In-Network Max")).toBe("in network max");
    expect(normalizeLabel("Group #")).toBe("group");
  });
});

describe("normalizeDate", () => {
  it("accepts the sheet date formats and stores ISO", () => {
    expect(normalizeDate("10/19/2026", NOW)).toBe("2026-10-19");
    expect(normalizeDate("01-02-26", NOW)).toBe("2026-01-02");
    expect(normalizeDate("03-15-80", NOW)).toBe("1980-03-15");
    expect(normalizeDate("07-04-12", NOW)).toBe("2012-07-04");
    expect(normalizeDate("2026-01-01", NOW)).toBe("2026-01-01");
    expect(normalizeDate("October 19, 2026", NOW)).toBe("2026-10-19");
  });

  it("displays stored dates as MM/DD/YYYY", () => {
    expect(formatDate("2026-10-21")).toBe("10/21/2026");
    expect(formatDate("1980-03-15")).toBe("03/15/1980");
    expect(formatDate("Teeth #: 14")).toBe("Teeth #: 14");
    expect(formatDate("")).toBe("");
  });

  it("rejects impossible dates", () => {
    expect(normalizeDate("02/31/2026", NOW)).toBeNull();
    expect(normalizeDate("13/40/2026", NOW)).toBeNull();
    expect(normalizeDate("not a date", NOW)).toBeNull();
  });
});

describe("normalizeMoney", () => {
  it("strips currency formatting", () => {
    expect(normalizeMoney("$1,500.00")).toBe(1500);
    expect(normalizeMoney("$1,200.50")).toBe(1200.5);
    expect(normalizeMoney("$0")).toBe(0);
    expect(normalizeMoney("50")).toBe(50);
  });

  it("rejects values that are not amounts", () => {
    expect(normalizeMoney("")).toBeNull();
    expect(normalizeMoney("abc")).toBeNull();
    expect(normalizeMoney("-$5")).toBeNull();
  });

  it("displays amounts as dollars and cents", () => {
    expect(formatMoney(1500)).toBe("$1,500.00");
    expect(formatMoney(1200.5)).toBe("$1,200.50");
    expect(formatMoney(null)).toBe("");
  });
});

describe("normalizePercent", () => {
  it("canonicalizes covered, excluded, and n/a", () => {
    expect(normalizePercent("80")).toBe("80%");
    expect(normalizePercent("80%")).toBe("80%");
    expect(normalizePercent("100 percent")).toBe("100%");
    expect(normalizePercent("35%")).toBe("35%");
    expect(normalizePercent("not covered")).toBe("Not Covered");
    expect(normalizePercent("excluded")).toBe("Not Covered");
    expect(normalizePercent("N/A")).toBe("N/A");
    expect(normalizePercent("n.a.")).toBe("N/A");
  });
});

describe("normalizeFrequency", () => {
  it("maps the portal phrases onto canonical values", () => {
    expect(normalizeFrequency("2x/year")).toBe("2x/Year");
    expect(normalizeFrequency("2 per year")).toBe("2x/Year");
    expect(normalizeFrequency("1x every 3 years")).toBe("1x/3Years");
    expect(normalizeFrequency("1 in 5 years")).toBe("1x/5Years");
    expect(normalizeFrequency("1x60Mo")).toBe("1x/60Mo");
    expect(normalizeFrequency("1x/60Mo")).toBe("1x/60Mo");
    expect(normalizeFrequency("1x lifetime")).toBe("1x/Lifetime");
    expect(normalizeFrequency("No Frequency")).toBe("No Frequency");
    expect(normalizeFrequency("1x/12Mo")).toBe("1x/12Mo");
    expect(normalizeFrequency("4x/Year")).toBe("4x/Year");
    expect(normalizeFrequency("1x/7Years")).toBe("1x/7Years");
    expect(normalizeFrequency("1x/2Years")).toBe("1x/2Years");
    expect(normalizeFrequency("1 per 6 months")).toBe("1x/6Mo");
    expect(normalizeFrequency("1 every 6 months")).toBe("1x/6Mo");
    expect(normalizeFrequency("2 per 12 months")).toBe("2x/12Mo");
    expect(normalizeFrequency("1 per 24 months")).toBe("1x/24Mo");
    expect(normalizeFrequency("1 per 36 months")).toBe("1x/36Mo");
    expect(normalizeFrequency("1x/84 months")).toBe("1x/84Mo");
    expect(normalizeFrequency("1 per 120 months")).toBe("1x/120Mo");
    expect(normalizeFrequency("1 every 4 years")).toBe("1x/4Years");
    expect(normalizeFrequency("1 every 8 years")).toBe("1x/8Years");
    expect(normalizeFrequency("1 every 10 years")).toBe("1x/10Years");
    expect(normalizeFrequency("2 per calendar year")).toBe("2x/Year");
    expect(normalizeFrequency("1 per benefit year")).toBe("1x/Year");
    expect(normalizeFrequency("2x lifetime")).toBe("2x/Lifetime");
    expect(normalizeFrequency("unlimited")).toBe("Unlimited");
    expect(normalizeFrequency("1 per quadrant per 24 months")).toBe("1x/Quad/24Mo");
    expect(normalizeFrequency("1x/quad/24 mo")).toBe("1x/Quad/24Mo");
  });
});

describe("normalizeWaiting", () => {
  it("maps sheet wording onto the waiting dropdown", () => {
    expect(normalizeWaiting("3 month")).toBe("3 months");
    expect(normalizeWaiting("6 months")).toBe("6 months");
    expect(normalizeWaiting("9 mos")).toBe("9 months");
    expect(normalizeWaiting("12 month")).toBe("12 months");
    expect(normalizeWaiting("none")).toBe("NONE");
    expect(normalizeWaiting("NONE")).toBe("NONE");
    expect(normalizeWaiting("18 months")).toBe("18 months");
  });
});

describe("normalizeMissingTooth", () => {
  it("maps sheet wording onto None or Yes", () => {
    expect(normalizeMissingTooth("none")).toBe("NONE");
    expect(normalizeMissingTooth("NO")).toBe("NONE");
    expect(normalizeMissingTooth("yes")).toBe("YES");
    expect(normalizeMissingTooth("Y")).toBe("YES");
  });
});

describe("optionsWithValue", () => {
  it("keeps listed values and prepends extracted ones that are not listed", () => {
    expect(optionsWithValue(PCT_OPTIONS, "80%")).toEqual([...PCT_OPTIONS]);
    expect(optionsWithValue(PCT_OPTIONS, "35%")).toEqual(["35%", ...PCT_OPTIONS]);
    expect(optionsWithValue(FREQ_OPTIONS, "1x/18Mo")).toEqual(["1x/18Mo", ...FREQ_OPTIONS]);
    expect(optionsWithValue(PCT_OPTIONS, "")).toEqual([...PCT_OPTIONS]);
  });
});

describe("defaults", () => {
  it("clears percentages, frequencies, and history", () => {
    const rows = createDefaultRecord(NOW).procedures.map((row, index) =>
      index === 0 ? { ...row, history: "2026-01-15" } : row,
    );
    const [first] = blankProcedures(rows);
    expect(first?.pct).toBe("");
    expect(first?.freq).toBe("");
    expect(first?.history).toBe("");
    expect(first?.code).toBe("D0150");
    expect(first?.name).toBe("Comprehensive Exam");
  });

  it("starts a visit with the same cleared table as reset", () => {
    const record = createFreshRecord(NOW);
    expect(record.procedures.every((row) => row.pct === "" && row.freq === "" && row.history === "")).toBe(true);
    expect(record.procedures[0]?.code).toBe("D0150");
    expect(record.dedmet).toBe("NO");
    expect(record.ortho).toBe("");
    expect(record.pat).toBe("");
    expect(record.notes).toBe("");
  });

  it("summarizes fields in sheet order", () => {
    const text = toSummary(createDefaultRecord(NOW));
    expect(text.indexOf("Insurance Name:")).toBeGreaterThan(-1);
    expect(text.indexOf("Patient Name:")).toBeGreaterThan(text.indexOf("Insurance Name:"));
    expect(text).toContain("Deductible Met: NO");
    expect(text).toContain("Ortho: Not Covered");
    expect(text).toContain("D1110 | 100% | Cleaning | 4x/Year |");
    expect(text).toContain("Date: 06/15/2026");
  });
});
