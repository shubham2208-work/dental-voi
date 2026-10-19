export function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function patientKeyInput(office: string, patid: string): string {
  return `${normalizeKeyPart(office)}|${normalizeKeyPart(patid)}`;
}

export async function computePatientKey(office: string, patid: string): Promise<string> {
  const input = patientKeyInput(office, patid);
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
