import { describe, expect, it } from "vitest";
import { computePatientKey, normalizeKeyPart, patientKeyInput } from "./patientKey";

describe("patientKey", () => {
  it("normalizes casing and whitespace", () => {
    expect(normalizeKeyPart("  Main  Street  ")).toBe("main street");
    expect(patientKeyInput("Office A", "PT-1001")).toBe(patientKeyInput("office a", "pt-1001"));
  });

  it("produces stable hashes for the same office and patid", async () => {
    const a = await computePatientKey("Smile Dental", "PT1001");
    const b = await computePatientKey("smile dental", "pt1001");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
