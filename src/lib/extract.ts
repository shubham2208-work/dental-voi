import type { MoneyId, PctId, ProcedureRow, TextId, VoiFormValues, VoiPatch } from "../types";
import {
  normalizeBenefitYear,
  normalizeDate,
  normalizeFrequency,
  normalizeLabel,
  normalizeMoney,
  normalizeMissingTooth,
  normalizePercent,
  normalizeWaiting,
  normalizeYesNo,
} from "./normalize";

type Alias =
  | { id: TextId; kind: "text" | "date" | "clause"; patterns: string[] }
  | { id: PctId; kind: "pct"; patterns: string[] }
  | { id: MoneyId; kind: "money"; patterns: string[] }
  | { id: "byear"; kind: "byear"; patterns: string[] }
  | { id: "dedmet"; kind: "yesno"; patterns: string[] };

interface Pair {
  label: string;
  value: string;
}

export interface ProcHit {
  codes: string[];
  pct: string | null;
  freq: string | null;
  history: string | null;
}

export interface ExtractOutcome {
  patch: VoiPatch;
  procedures: ProcHit[];
  unrecognized: string[];
}

export interface AppliedExtract {
  next: VoiFormValues;
  highlighted: string[];
  message: string;
  unrecognized: string[];
}

// More specific labels come first. "deductible met" must beat "deductible",
// "sub dob" must beat "dob", and "ortho max" must beat "max".
const ALIASES: readonly Alias[] = [
  {
    id: "subdob",
    kind: "date",
    patterns: ["subscriber date of birth", "subscriber dob", "sub dob", "member dob", "insured dob", "policyholder dob"],
  },
  {
    id: "patdob",
    kind: "date",
    patterns: ["patient date of birth", "patient dob", "pt dob", "date of birth", "dob"],
  },
  {
    id: "patid",
    kind: "text",
    patterns: ["patient id", "pt id", "patient chart", "chart number", "chart no", "chart id", "chart"],
  },
  {
    id: "subid",
    kind: "text",
    patterns: ["subscriber id", "subscriber number", "sub id", "member id", "member number", "insured id"],
  },
  { id: "payor", kind: "text", patterns: ["payor id", "payer id", "payorid"] },
  { id: "grpn", kind: "text", patterns: ["group name", "employer name", "employer"] },
  { id: "grp", kind: "text", patterns: ["group number", "group no", "group num", "grp", "group"] },
  { id: "dedmet", kind: "yesno", patterns: ["deductible met", "ded met", "deductible satisfied"] },
  {
    id: "orthomax",
    kind: "money",
    patterns: ["orthodontic maximum", "ortho maximum", "orthodontic max", "ortho lifetime max", "ortho max"],
  },
  { id: "orthod", kind: "money", patterns: ["orthodontic deductible", "ortho deductible", "ortho ded"] },
  { id: "famd", kind: "money", patterns: ["family deductible", "family ded"] },
  { id: "indd", kind: "money", patterns: ["individual deductible", "individual ded", "ind deductible", "deductible"] },
  {
    id: "maxr",
    kind: "money",
    patterns: ["maximum remaining", "max remaining", "remaining maximum", "remaining max", "annual remaining", "remaining"],
  },
  {
    id: "max",
    kind: "money",
    patterns: ["in network maximum", "in network max", "annual maximum", "annual max", "yearly max", "maximum", "max"],
  },
  { id: "eff", kind: "date", patterns: ["effective date", "eff date", "effective"] },
  { id: "bwait", kind: "clause", patterns: ["basic waiting period", "basic waiting", "bwait"] },
  { id: "mwait", kind: "clause", patterns: ["major waiting period", "major waiting", "mwait"] },
  { id: "mtc", kind: "clause", patterns: ["missing tooth clause", "missing tooth", "mtc"] },
  { id: "icrown", kind: "pct", patterns: ["implant crowns", "implant crown", "icrown"] },
  { id: "abut", kind: "pct", patterns: ["implant abutments", "implant abutment", "abutment"] },
  { id: "impl", kind: "pct", patterns: ["implants", "implant"] },
  { id: "osurg", kind: "pct", patterns: ["oral surgery", "oral surg", "osurg"] },
  { id: "perio", kind: "pct", patterns: ["periodontics", "periodontal", "perio"] },
  { id: "endo", kind: "pct", patterns: ["endodontics", "endodontic", "endo"] },
  { id: "prev", kind: "pct", patterns: ["preventative", "preventive", "prev"] },
  { id: "basic", kind: "pct", patterns: ["basic"] },
  { id: "major", kind: "pct", patterns: ["major"] },
  { id: "ortho", kind: "pct", patterns: ["orthodontics", "orthodontic", "ortho"] },
  { id: "byear", kind: "byear", patterns: ["benefit year", "plan year"] },
  { id: "by", kind: "text", patterns: ["completed by", "verified by"] },
  { id: "office", kind: "text", patterns: ["office name", "office", "location"] },
  { id: "pat", kind: "text", patterns: ["patient name", "pt name", "patient"] },
  {
    id: "sub",
    kind: "text",
    patterns: ["subscriber name", "sub name", "policyholder", "policy holder", "member name", "insured name", "subscriber", "insured", "member"],
  },
  {
    id: "ins",
    kind: "text",
    patterns: ["insurance name", "insurance company", "payer name", "payor name", "carrier name", "insurance", "carrier", "payer", "payor"],
  },
  { id: "date", kind: "date", patterns: ["verification date", "voi date", "date"] },
  { id: "notes", kind: "text", patterns: ["notes", "note", "comments", "comment"] },
];

const PREPARED = ALIASES.map((rule) => ({
  ...rule,
  patterns: rule.patterns.map(normalizeLabel).sort((a, b) => b.length - a.length),
}));

function containsPhrase(label: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^| )${escaped}(?: |$)`).test(label);
}

function sameCompact(left: string, right: string): boolean {
  const compactLeft = left.replace(/\s/g, "");
  const compactRight = right.replace(/\s/g, "");
  return compactLeft.length >= 4 && compactLeft === compactRight;
}

function isCoinsuranceLabel(normalized: string): boolean {
  return /(?:^| )co ?insurance(?: |$)/.test(normalized);
}

function matchAlias(label: string): Alias | null {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;
  // "Subscriber #" and "Sub #" lose the hash during normalization and would look like a name.
  if (/#/.test(label) && /^(?:sub|subscriber|member|insured)$/.test(normalized)) {
    return PREPARED.find((rule) => rule.id === "subid") ?? null;
  }
  for (const rule of PREPARED) {
    for (const pattern of rule.patterns) {
      const matched = normalized === pattern || containsPhrase(normalized, pattern) || sameCompact(normalized, pattern);
      // "Co-Insurance %" contains the word insurance, but it is the benefits heading.
      if (matched && !(rule.id === "ins" && isCoinsuranceLabel(normalized))) return rule;
    }
  }
  return null;
}

function isGenericChildLabel(label: string): boolean {
  const key = normalizeLabel(label);
  return key === "name" || key === "id" || key === "id number" || key === "number" || key === "dob" || key === "date of birth";
}

function acceptsLabel(label: string): boolean {
  return matchAlias(label) !== null || isGenericChildLabel(label);
}

function applyPair(patch: VoiPatch, pair: Pair): boolean {
  const rule = matchAlias(pair.label);
  if (!rule) return false;
  const raw = pair.value.trim();
  if (!raw) return false;

  switch (rule.kind) {
    case "text":
      patch[rule.id] = raw;
      return true;
    case "clause":
      if (rule.id === "bwait" || rule.id === "mwait") patch[rule.id] = normalizeWaiting(raw);
      else if (rule.id === "mtc") patch[rule.id] = normalizeMissingTooth(raw);
      else patch[rule.id] = raw;
      return true;
    case "date": {
      const iso = normalizeDate(raw);
      if (!iso) return false;
      patch[rule.id] = iso;
      return true;
    }
    case "pct": {
      const pct = normalizePercent(raw);
      if (!pct) return false;
      patch[rule.id] = pct;
      return true;
    }
    case "money": {
      const amount = normalizeMoney(raw);
      if (amount === null) return false;
      patch[rule.id] = amount;
      return true;
    }
    case "byear": {
      const year = normalizeBenefitYear(raw);
      if (!year) return false;
      patch.byear = year;
      return true;
    }
    case "yesno": {
      const answer = normalizeYesNo(raw);
      if (!answer) return false;
      patch.dedmet = answer;
      return true;
    }
  }
}

const FREQ_PATTERNS: readonly RegExp[] = [
  /\bno\s+freq(?:uency)?\s+limitation\b/i,
  /\bunlimited\b/i,
  /\bno\s+limit(?:ation)?\b/i,
  /\bno\s+freq(?:uency)?\b/i,
  /\b\d+\s*x?\s*(?:\/|\s)?\s*(?:per\s+)?quad(?:rant)?\s*(?:\/|per|every|in)\s*\d+\s*(?:months?|mo)\b/i,
  /\bonce\s+per\s+quad(?:rant)?\s+per\s+\d+\s*(?:months?|mo)\b/i,
  /\b\d+\s*x?\s*(?:per|every|in)\s*\d+\s*(?:months?|mo)\b/i,
  /\b\d+\s*x\s*\/?\s*\d+\s*months?\b/i,
  /\b\d+\s*x\s*\/?\s*\d+\s*mo\b/i,
  /\bevery\s+\d+\s+months?\b/i,
  /\b\d+\s*x?\s*(?:per|every|in)\s*\d+\s*years?\b/i,
  /\b\d+\s*x\s*every\s*\d+\s*years?\b/i,
  /\b\d+\s+in\s+\d+\s+years?\b/i,
  /\b\d+\s*x\s*\/\s*\d+\s*years?\b/i,
  /\b\d+\s*x\s*\d+\s*years?\b/i,
  /\bevery\s+\d+\s+years?\b/i,
  /\b\d+\s*x?\s*(?:per|every)\s*(?:calendar|benefit)\s*years?\b/i,
  /\b(?:once|twice)\s+(?:a|per)\s+(?:calendar|benefit)\s+years?\b/i,
  /\b\d+\s*x\s*\/\s*years?\b/i,
  /\b\d+\s*x\s*per\s*years?\b/i,
  /\b\d+\s+per\s+years?\b/i,
  /\b\d+\s+times?\s+per\s+years?\b/i,
  /\bonce\s+(?:a|per)\s+years?\b/i,
  /\btwice\s+(?:a|per)\s+years?\b/i,
  /\b\d+\s*x\s*\/?\s*lifetime\b/i,
  /\blifetime\b/i,
  /\bnot\s+covered\b/i,
  /\bexcluded\b/i,
];

export function findFrequency(line: string): string | null {
  for (const pattern of FREQ_PATTERNS) {
    const match = pattern.exec(line);
    if (!match) continue;
    const value = normalizeFrequency(match[0]);
    if (value) return value;
  }
  return null;
}

export function findPercent(line: string): string | null {
  const match = /\bnot\s+covered\b|\bexcluded\b|\bn\/a\b|\b\d{1,3}(?:\.\d+)?\s*(?:%|percent\b)/i.exec(line);
  if (!match) return null;
  return normalizePercent(match[0]);
}

function findHistory(line: string): string | null {
  const parts: string[] = [];
  const tooth = /\b(?:teeth|tooth)\s*(?:#|number|no\.?)?\s*:?\s*(\d{1,2}(?:\s*(?:,|&|and)\s*\d{1,2})*)/i.exec(line);
  if (tooth) parts.push(`Teeth #: ${tooth[1].replace(/\s+/g, " ").trim()}`);
  const date = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/.exec(line);
  if (date) {
    const iso = normalizeDate(date[1]);
    if (iso) parts.push(iso);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function cdtCodes(line: string): string[] {
  const codes: string[] = [];
  for (const match of line.matchAll(/\bD(\d{4})\b/gi)) {
    const code = `D${match[1]}`;
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function findProcedureRow(rows: readonly string[], wanted: readonly string[]): number {
  const targets = wanted.map((code) => code.toUpperCase());
  return rows.findIndex((row) => {
    const matched = row.toUpperCase().match(/D\d{4}/g);
    const have = matched ? [...matched] : [];
    return targets.some((code) => have.includes(code));
  });
}

function isProcedureLine(line: string): boolean {
  if (!/\bD\d{4}\b/i.test(line)) return false;
  if (line.includes("\t")) {
    const first = line.split("\t")[0]?.replace(/:\s*$/, "") ?? "";
    if (matchAlias(first)) return false;
  }
  const colon = /^([^:]+):/.exec(line);
  if (colon && matchAlias(colon[1] ?? "")) return false;
  return true;
}

function parseProcedure(line: string): ProcHit | null {
  const codes = cdtCodes(line);
  if (codes.length === 0) return null;
  const pct = findPercent(line);
  const freq = findFrequency(line);
  const history = findHistory(line);
  if (!pct && !freq && !history) return null;
  return { codes, pct, freq, history };
}

function sameProcedure(left: readonly string[], right: readonly string[], rows: readonly string[]): boolean {
  const leftIndex = findProcedureRow(rows, left);
  const rightIndex = findProcedureRow(rows, right);
  if (leftIndex >= 0 || rightIndex >= 0) return leftIndex === rightIndex;
  return [...left].sort().join(",") === [...right].sort().join(",");
}

function mergeProc(hits: ProcHit[], hit: ProcHit, rows: readonly string[]) {
  const index = hits.findIndex((existing) => sameProcedure(existing.codes, hit.codes, rows));
  if (index < 0) {
    hits.push(hit);
    return;
  }
  const previous = hits[index];
  if (!previous) return;
  hits[index] = {
    codes: previous.codes,
    pct: hit.pct ?? previous.pct,
    freq: hit.freq ?? previous.freq,
    history: hit.history ?? previous.history,
  };
}

function labeledCell(cell: string): { label: string; inline: string } | null {
  const colon = cell.indexOf(":");
  if (colon <= 0) return null;
  const label = cell.slice(0, colon).trim();
  if (!acceptsLabel(label)) return null;
  return { label, inline: cell.slice(colon + 1).trim() };
}

function nextValueIndex(cells: readonly string[], start: number): number | null {
  for (let index = start; index < cells.length; index += 1) {
    const cell = cells[index] ?? "";
    if (!cell) continue;
    if (labeledCell(cell) || acceptsLabel(cell.replace(/:\s*$/, ""))) return null;
    return index;
  }
  return null;
}

function pairsFromTabs(line: string): Pair[] {
  const cells = line.split("\t").map((cell) => cell.trim());
  const pairs: Pair[] = [];
  const consumed = new Set<number>();
  let index = 0;
  while (index < cells.length) {
    const cell = cells[index] ?? "";
    if (!cell || consumed.has(index)) {
      index += 1;
      continue;
    }
    const labeled = labeledCell(cell);
    if (labeled?.inline) {
      pairs.push({ label: labeled.label, value: labeled.inline });
      consumed.add(index);
      index += 1;
      continue;
    }
    const label = labeled ? labeled.label : cell.replace(/:\s*$/, "").trim();
    if (acceptsLabel(label)) {
      const valueIndex = nextValueIndex(cells, index + 1);
      if (valueIndex !== null) {
        pairs.push({ label, value: cells[valueIndex] ?? "" });
        consumed.add(index);
        consumed.add(valueIndex);
        index = valueIndex + 1;
        continue;
      }
    }
    index += 1;
  }

  // The sheet's top-right cell is the office name, with no label of its own.
  const onBannerRow = pairs.some((pair) => {
    const rule = matchAlias(pair.label);
    return rule?.id === "date" || rule?.id === "by";
  });
  if (onBannerRow) {
    const orphans = cells.filter((cell, cellIndex) => cell !== "" && !consumed.has(cellIndex));
    if (orphans.length === 1 && orphans[0] && !acceptsLabel(orphans[0].replace(/:\s*$/, ""))) {
      pairs.push({ label: "Office Name", value: orphans[0] });
    }
  }
  return pairs;
}

function cleanValue(value: string): string {
  return value.replace(/[;|]+$/, "").trim();
}

function isBoundaryLabel(label: string): boolean {
  const normalized = normalizeLabel(label);
  if (!normalized) return false;
  if (isGenericChildLabel(label)) return true;
  if (/#/.test(label) && /^(?:sub|subscriber|member|insured)$/.test(normalized)) return true;
  return PREPARED.some((rule) => rule.patterns.some((pattern) => normalized === pattern || sameCompact(normalized, pattern)));
}

function labelBeforeColon(before: string): { label: string; start: number } | null {
  const trimmedEnd = before.trimEnd();
  if (!trimmedEnd) return null;
  const words = trimmedEnd.split(/\s+/);
  const limit = Math.min(6, words.length);
  for (let size = limit; size >= 1; size -= 1) {
    const label = words.slice(words.length - size).join(" ");
    if (!isBoundaryLabel(label)) continue;
    const start = trimmedEnd.lastIndexOf(label);
    if (start < 0) continue;
    return { label, start };
  }
  return null;
}

function pairsFromInline(line: string): Pair[] | null {
  if (!line.includes(":")) return null;
  const marks: { start: number; colon: number; label: string }[] = [];
  let cursor = 0;
  while (cursor < line.length) {
    const colon = line.indexOf(":", cursor);
    if (colon < 0) break;
    const found = labelBeforeColon(line.slice(0, colon));
    if (!found || found.start < cursor) {
      cursor = colon + 1;
      continue;
    }
    marks.push({ start: found.start, colon, label: found.label });
    cursor = colon + 1;
  }
  if (marks.length === 0) return null;
  const pairs: Pair[] = [];
  for (let index = 0; index < marks.length; index += 1) {
    const current = marks[index];
    const next = marks[index + 1];
    if (!current) continue;
    const value = cleanValue(line.slice(current.colon + 1, next ? next.start : line.length));
    if (current.label && value) pairs.push({ label: current.label, value });
  }
  return pairs.length > 0 ? pairs : null;
}

function pairsFromWide(parts: readonly string[]): Pair[] | null {
  if (parts.length < 2) return null;
  const evenLabels =
    parts.length % 2 === 0 && parts.every((part, index) => index % 2 === 1 || acceptsLabel(part));
  if (evenLabels) {
    const pairs: Pair[] = [];
    for (let index = 0; index < parts.length; index += 2) {
      const label = parts[index] ?? "";
      const value = parts[index + 1] ?? "";
      if (label && value) pairs.push({ label, value });
    }
    return pairs.length > 0 ? pairs : null;
  }
  const label = parts[0] ?? "";
  if (!acceptsLabel(label)) return null;
  return [{ label, value: parts.slice(1).join(" ") }];
}

function pairsFromPlain(line: string): Pair[] {
  const inline = pairsFromInline(line);
  if (inline && inline.length > 0) return inline;

  const wide = line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const widened = pairsFromWide(wide);
  if (widened) return widened;

  const category =
    /^([A-Za-z][A-Za-z\s&/-]{0,40}?)\s+(\d{1,3}(?:\.\d+)?\s*%|not covered|excluded|n\/a)$/i.exec(line);
  if (!category) return [];
  return [{ label: category[1] ?? "", value: category[2] ?? "" }];
}

type Section = "subscriber" | "patient";

function sectionFromId(id: Alias["id"]): Section | null {
  if (id === "sub" || id === "subid") return "subscriber";
  if (id === "pat" || id === "patid") return "patient";
  return null;
}

function contextualLabel(section: Section | null, label: string): string {
  const key = normalizeLabel(label);
  if (section === "subscriber" && (key === "dob" || key === "date of birth")) return "subscriber dob";
  if (section === "patient" && (key === "dob" || key === "date of birth")) return "patient dob";
  if (!section || (key !== "name" && key !== "id" && key !== "id number" && key !== "number")) return label;
  const prefix = section === "subscriber" ? "subscriber" : "patient";
  return `${prefix} ${key === "name" ? "name" : "id"}`;
}

function bareSection(line: string): Section | null {
  if (line.includes("\t") || /:(?!\s*$)/.test(line)) return null;
  const key = normalizeLabel(line.replace(/:\s*$/, ""));
  if (key === "subscriber" || key === "insured" || key === "member" || key === "policyholder" || key === "policy holder") {
    return "subscriber";
  }
  if (key === "patient") return "patient";
  return null;
}

function exactAlias(label: string): boolean {
  const normalized = normalizeLabel(label);
  return PREPARED.some((rule) => rule.patterns.includes(normalized));
}

function loneLabel(line: string, section: Section | null): string | null {
  if (line.includes("\t") || /:(?!\s*$)/.test(line)) return null;
  const label = line.replace(/:\s*$/, "").trim();
  if (!label) return null;
  if (exactAlias(label) || bareSection(label)) return label;
  if (section && isGenericChildLabel(label)) return label;
  return null;
}

function isChildLine(line: string): boolean {
  const head = line.split(/[\t:]/)[0] ?? "";
  return isGenericChildLabel(head);
}

function isHeaderRow(cells: readonly string[]): boolean {
  const filled = cells.filter((cell) => cell !== "");
  if (filled.length < 2) return false;
  return filled.every((cell) => acceptsLabel(cell.replace(/:\s*$/, "")));
}

function zipHeader(headers: readonly string[], values: readonly string[]): Pair[] {
  const pairs: Pair[] = [];
  headers.forEach((header, index) => {
    const label = header.replace(/:\s*$/, "").trim();
    const value = (values[index] ?? "").trim();
    if (label && value) pairs.push({ label, value });
  });
  return pairs;
}

function nextContent(lines: readonly string[], index: number): { line: string; index: number } | null {
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]?.trim() ?? "";
    if (line) return { line, index: cursor };
  }
  return null;
}

function canTakeAsValue(line: string, section: Section | null): boolean {
  if (!line || line.includes("\t") || isProcedureLine(line) || isChildLine(line) || loneLabel(line, section)) return false;
  return pairsFromPlain(line).length === 0;
}

function consumePairs(
  patch: VoiPatch,
  pairs: readonly Pair[],
  section: Section | null,
): { matched: boolean; section: Section | null } {
  let matched = false;
  let current = section;
  for (const pair of pairs) {
    const label = contextualLabel(current, pair.label);
    if (!applyPair(patch, { label, value: pair.value })) continue;
    matched = true;
    const rule = matchAlias(label);
    const next = rule ? sectionFromId(rule.id) : null;
    if (next) current = next;
  }
  return { matched, section: current };
}

export function extractText(input: string, procedureCodes: readonly string[]): ExtractOutcome {
  const patch: VoiPatch = {};
  const procedures: ProcHit[] = [];
  const unrecognized: string[] = [];
  const lines = input.split(/\r?\n/);
  let section: Section | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (!line) continue;

    if (line.includes("\t")) {
      const cells = line.split("\t").map((cell) => cell.trim());
      if (isHeaderRow(cells)) {
        const upcoming = nextContent(lines, index);
        const upcomingCells = upcoming?.line.split("\t").map((cell) => cell.trim()) ?? [];
        if (upcoming && upcoming.line.includes("\t") && !isHeaderRow(upcomingCells)) {
          const consumed = consumePairs(patch, zipHeader(cells, upcomingCells), section);
          section = consumed.section;
          if (!consumed.matched) unrecognized.push(line);
          index = upcoming.index;
        } else {
          unrecognized.push(line);
        }
        continue;
      }
    }

    if (isProcedureLine(line)) {
      const hit = parseProcedure(line);
      if (!hit) unrecognized.push(line);
      else mergeProc(procedures, hit, procedureCodes);
      continue;
    }

    const labelOnly = loneLabel(line, section);
    const upcoming = nextContent(lines, index);
    if (labelOnly && upcoming) {
      const asSection = bareSection(labelOnly);
      if (asSection && isChildLine(upcoming.line)) {
        section = asSection;
        continue;
      }
      if (canTakeAsValue(upcoming.line, section)) {
        const consumed = consumePairs(patch, [{ label: labelOnly, value: upcoming.line }], section);
        if (consumed.matched) {
          section = consumed.section;
          index = upcoming.index;
          continue;
        }
      }
    }

    const pairs = line.includes("\t") ? pairsFromTabs(line) : pairsFromPlain(line);
    if (pairs.length === 0) {
      unrecognized.push(line);
      continue;
    }
    const consumed = consumePairs(patch, pairs, section);
    section = consumed.section;
    if (!consumed.matched) unrecognized.push(line);
  }

  return { patch, procedures, unrecognized };
}

export function describeExtract(filled: number, unrecognized: number): string {
  const lines = unrecognized === 1 ? "1 line not recognized" : `${unrecognized} lines not recognized`;
  if (filled === 0 && unrecognized > 0) return `No fields matched. ${lines}.`;
  if (filled === 0) return "No fields matched.";
  const fields = filled === 1 ? "Filled 1 field" : `Filled ${filled} fields`;
  if (unrecognized === 0) return `${fields}. Review the amber fields.`;
  return `${fields}; ${lines}. Review the amber fields.`;
}

export function applyExtract(current: VoiFormValues, text: string): AppliedExtract {
  const outcome = extractText(text, current.procedures.map((row) => row.code));
  const procedures = current.procedures.map((row) => ({ ...row }));
  const highlighted = Object.keys(outcome.patch);

  for (const hit of outcome.procedures) {
    let index = findProcedureRow(procedures.map((row) => row.code), hit.codes);
    if (index < 0) {
      index = procedures.length;
      procedures.push({
        code: hit.codes.join("/ "),
        name: "",
        pct: "",
        freq: "",
        history: "",
        teeth: false,
      });
    }
    const row: ProcedureRow = { ...(procedures[index] as ProcedureRow) };
    if (hit.pct !== null) {
      row.pct = hit.pct;
      highlighted.push(`procedures.${index}.pct`);
    }
    if (hit.freq !== null) {
      row.freq = hit.freq;
      highlighted.push(`procedures.${index}.freq`);
    }
    if (hit.history !== null) {
      row.history = hit.history;
      highlighted.push(`procedures.${index}.history`);
    }
    procedures[index] = row;
  }

  return {
    next: { ...current, ...outcome.patch, procedures },
    highlighted,
    message: describeExtract(highlighted.length, outcome.unrecognized.length),
    unrecognized: outcome.unrecognized,
  };
}
