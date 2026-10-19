export function normalizeSearchName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeSubid(subid: string): string {
  return subid.trim().toLowerCase();
}

/** Parse common date strings to ISO date or null. */
export function normalizeDateIso(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return value;

  const mdy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(value);
  if (mdy) {
    const year = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    const m = mdy[1].padStart(2, "0");
    const d = mdy[2].padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  return null;
}
