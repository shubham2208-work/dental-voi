export function normalizeLabel(input: string): string {
  return input
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeDate(raw: string, now = new Date()): string | null {
  const value = raw.trim();
  if (!value) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return validIso(iso[1], iso[2], iso[3]);

  const mdy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(value);
  if (mdy) {
    const year = mdy[3].length === 2 ? expandYear(mdy[3], now) : mdy[3];
    return validIso(year, mdy[1], mdy[2]);
  }

  if (!/[a-z]/i.test(value)) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  return validIso(String(date.getFullYear()), String(date.getMonth() + 1), String(date.getDate()));
}

function expandYear(yy: string, now: Date): string {
  const year = Number(yy);
  const pivot = now.getFullYear() % 100;
  return String(year <= pivot ? 2000 + year : 1900 + year);
}

function validIso(year: string, month: string, day: string): string | null {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function formatDate(value: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!iso) return value;
  return `${iso[2]}/${iso[3]}/${iso[1]}`;
}

export function normalizeMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

export function formatMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function normalizePercent(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const compact = trimmed.toLowerCase().replace(/[.\s]/g, "");
  if (compact === "n/a" || compact === "na") return "N/A";
  if (compact === "notcovered" || compact === "excluded") return "Not Covered";

  const match = /(\d{1,3}(?:\.\d+)?)(\s*(?:%|percent))?/i.exec(trimmed);
  if (!match || match.index === undefined) return null;
  const hasMarker = Boolean(match[2]);
  const leading = trimmed.slice(0, match.index).trim();
  const leftover = trimmed.slice(match.index + match[0].length).trim();
  if (leading) return null;
  if (leftover && !hasMarker) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num) || num < 0 || num > 1000) return null;
  const rounded = Math.round(num * 100) / 100;
  return `${Number.isInteger(rounded) ? String(rounded) : String(rounded)}%`;
}

export function normalizeFrequency(raw: string): string | null {
  const value = raw
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/\byr\b/g, "year")
    .replace(/\byrs\b/g, "years")
    .trim();
  if (!value) return null;
  if (value === "not covered" || value === "excluded") return "Not Covered";
  if (
    value === "unlimited" ||
    value === "no limit" ||
    value === "no limitation" ||
    value === "no frequency limitation" ||
    value === "no freq limitation"
  ) {
    return "Unlimited";
  }
  if (value === "no frequency" || value === "no freq") return "No Frequency";

  const quad = /^(\d+)\s*x?\s*(?:\/|\s)?\s*(?:per\s+)?quad(?:rant)?\s*(?:\/|per|every|in)\s*(\d+)\s*(?:months?|mo)$/.exec(value);
  if (quad?.[1] && quad[2]) return perQuad(Number(quad[1]), Number(quad[2]));
  const onceQuad = /^once\s+per\s+quad(?:rant)?\s+per\s+(\d+)\s*(?:months?|mo)$/.exec(value);
  if (onceQuad?.[1]) return perQuad(1, Number(onceQuad[1]));

  let match = /^(\d+)\s*x?\s*(?:per|every|in)\s*(\d+)\s*months?$/.exec(value);
  if (!match) match = /^(\d+)\s*x?\s*(?:per|every|in)\s*(\d+)\s*mo$/.exec(value);
  if (match) return everyMonths(Number(match[1]), Number(match[2]));

  match = /^(\d+)\s*x\s*\/?\s*(\d+)\s*months?$/.exec(value);
  if (!match) match = /^(\d+)\s*x\s*\/?\s*(\d+)\s*mo$/.exec(value);
  if (match) return everyMonths(Number(match[1]), Number(match[2]));

  match = /^every\s*(\d+)\s*months?$/.exec(value);
  if (match) return everyMonths(1, Number(match[1]));

  match = /^(\d+)\s*x?\s*(?:per|every|in)\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(Number(match[1]), Number(match[2]));

  match = /^(\d+)\s*x\s*every\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(Number(match[1]), Number(match[2]));

  match = /^(\d+)\s*in\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(Number(match[1]), Number(match[2]));

  match = /^(\d+)\s*x\s*\/\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(Number(match[1]), Number(match[2]));

  match = /^(\d+)\s*x\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(Number(match[1]), Number(match[2]));

  match = /^every\s*(\d+)\s*years?$/.exec(value);
  if (match) return everyYears(1, Number(match[1]));

  match = /^(\d+)\s*x\s*\/?\s*lifetime$/.exec(value);
  if (match) return timesLifetime(Number(match[1]));
  if (value === "lifetime") return "1x/Lifetime";

  match = /^(\d+)\s*x?\s*(?:per|every|a)\s*(?:calendar|benefit)\s*years?$/.exec(value);
  if (match) return perYear(Number(match[1]));
  match = /^(\d+)\s*x\s*\/\s*year$/.exec(value);
  if (match) return perYear(Number(match[1]));
  match = /^(\d+)\s*x\s*per\s*year$/.exec(value);
  if (match) return perYear(Number(match[1]));
  match = /^(\d+)\s*per\s*year$/.exec(value);
  if (match) return perYear(Number(match[1]));
  match = /^(\d+)\s*times?\s*(?:per|a)\s*year$/.exec(value);
  if (match) return perYear(Number(match[1]));
  if (value === "once a year" || value === "once per year" || value === "once per calendar year" || value === "once per benefit year") {
    return "1x/Year";
  }
  if (value === "twice a year" || value === "twice per year" || value === "twice per calendar year") return "2x/Year";
  return null;
}

function perYear(times: number): string | null {
  if (!Number.isInteger(times) || times <= 0 || times > 52) return null;
  if (times === 1) return "1x/Year";
  if (times === 2) return "2x/Year";
  if (times === 3) return "3x/Year";
  if (times === 4) return "4x/Year";
  return `${times}x/Year`;
}

function everyYears(times: number, years: number): string | null {
  if (!Number.isInteger(times) || !Number.isInteger(years) || times <= 0 || years <= 0 || years > 100) {
    return null;
  }
  if (times === 1 && years === 2) return "1x/2Years";
  if (times === 1 && years === 3) return "1x/3Years";
  if (times === 1 && years === 5) return "1x/5Years";
  if (times === 1 && years === 7) return "1x/7Years";
  return `${times}x/${years}Years`;
}

function everyMonths(times: number, months: number): string | null {
  if (!Number.isInteger(times) || !Number.isInteger(months) || times <= 0 || months <= 0 || months > 240) {
    return null;
  }
  if (times === 1 && months === 60) return "1x/60Mo";
  return `${times}x/${months}Mo`;
}

function timesLifetime(times: number): string | null {
  if (!Number.isInteger(times) || times <= 0 || times > 20) return null;
  return times === 1 ? "1x/Lifetime" : `${times}x/Lifetime`;
}

function perQuad(times: number, months: number): string | null {
  if (!Number.isInteger(times) || !Number.isInteger(months) || times <= 0 || months <= 0 || months > 240) {
    return null;
  }
  if (times === 1 && months === 24) return "1x/Quad/24Mo";
  return `${times}x/Quad/${months}Mo`;
}

export function normalizeBenefitYear(raw: string): "Calendar" | "Fiscal" | null {
  const label = normalizeLabel(raw);
  if (/^cal(endar)?\b/.test(label)) return "Calendar";
  if (/^fis(cal)?\b/.test(label)) return "Fiscal";
  return null;
}

export function normalizeWaiting(raw: string): string {
  const label = normalizeLabel(raw);
  if (label === "none" || label === "no waiting" || label === "no wait" || label === "na" || label === "n a") {
    return "NONE";
  }
  const months = /^(\d+)\s*(?:months?|mos?)$/.exec(label);
  if (months) {
    const count = Number(months[1]);
    if (count === 3 || count === 6 || count === 9 || count === 12) return `${count} months`;
  }
  return raw.trim();
}

export function normalizeMissingTooth(raw: string): string {
  const label = normalizeLabel(raw);
  if (label === "yes" || label === "y") return "YES";
  if (label === "none" || label === "no" || label === "n" || label === "na" || label === "n a") return "NONE";
  return raw.trim();
}

export function normalizeYesNo(raw: string): "YES" | "NO" | null {
  const label = normalizeLabel(raw);
  if (label === "yes" || label === "y") return "YES";
  if (label === "no" || label === "n") return "NO";
  return null;
}

export function optionsWithValue(base: readonly string[], value: string): string[] {
  if (value !== "" && !base.includes(value)) return [value, ...base];
  return [...base];
}
