# Dental VOI Form: Insurance Verification Tool and Extractor

> Project brief for Cursor. Read this whole file before writing code.

## 1. Overview

A web app used by an RCM (revenue cycle management) company to record **Verification of Insurance (VOI)** for dental patients. It replaces an existing Google Sheet ("Smile Loft Dental VOI Form").

Core features:

1. A form that mirrors every field of the sheet.
2. **Percentage and frequency cells are dropdowns**, not free text.
3. An **Extract** button: the user pastes existing patient or insurance text (from the old sheet, an email or a portal) and the matching form fields are filled in automatically.
4. Staff review the filled fields (highlighted), edit them, then save or export the record.

The working client lives in this folder (Vite, React, TypeScript). Google Sheets, auth, and Claude extraction are phase 2 and are not implemented yet.

## 2. Suggested stack

- Vite + React + TypeScript
- Tailwind CSS
- `react-hook-form` + `zod` for form state and validation
- Extraction logic as a pure TypeScript module (`src/lib/extract.ts`) with unit tests (Vitest)
- Backend (phase 2): small serverless API for Google Sheets read/write and optional Claude-powered extraction. **API keys never go in client code.**

## 3. Data model

Field ids on `VoiFormValues` in `src/types.ts` match the brief: `date`, `by`, `office`, `ins`, `sub`, `payor`, `pat`, `subid`, `patid`, `subdob`, `patdob`, `grp`, `grpn`, `byear`, `max`, `maxr`, `famd`, `indd`, `orthomax`, `orthod`, `dedmet`, `eff`, `bwait`, `mwait`, `mtc`, `prev`, `basic`, `major`, `perio`, `endo`, `osurg`, `impl`, `abut`, `icrown`, `ortho`, `notes`, and `procedures`.

Procedure rows also store `name` and `teeth` so the sheet's procedure label and the `Teeth #:` placeholder can render. Those are not renamed field ids.

`Pct` and `Freq` dropdowns use the lists in the brief. Extracted values outside those lists are added as options.

Add `id`, `createdAt`, `updatedAt` and `status` (`Pending | Verified | Inactive | Needs follow-up`) when persistence is added.

## 4. Form layout (mirror the sheet)

Sections in order, each with a blue header bar:

1. **Patient and insurance**
2. **In-network benefits**
3. **Plan limitations**
4. **Co-insurance %**
5. **Notes**
6. **Procedures table:** Code, Covered %, Procedure, Frequency, History / Last date of service

Default procedure rows match the sheet sample, including `D0210/ D0330`. **Blank table values** clears every percentage and frequency.

Defaults: Deductible Met = NO, waiting/clause fields = NONE, Ortho = Not Covered. Percent and frequency selects start with an empty Select option.

## 5. Extract feature

Parse `Label: value`, tab-separated `Label<TAB>Value` (several pairs per row), and `Category 80%` lines. Alias order is specific-before-general. CDT lines update the matching procedure row, and `D0210/ D0330` matches either code. Dates are stored as ISO. Money is stored as a number and shown as `$1,500.00`. Out-of-list percents and frequencies are kept. Extracted fields are highlighted until edited. One bad line does not fail the extract.

## 6. Actions

- **Copy summary**
- **Print or save as PDF** (print CSS hides the extract panel and buttons)
- **Reset form** (confirm, then defaults)
- Phase 2: **Save to Google Sheet** and **Search / open past records**

## 7. Google Sheets integration (phase 2)

Not built. One row per verification, columns matching field ids. Procedures as `p_D1110_pct`, `p_D1110_freq`, `p_D1110_hist`, or a second tab keyed by record id. Credentials stay server-side.

## 8. Privacy and compliance

This app handles patient health information (PHI):

- Use dummy data in development and tests. Never commit real patient data.
- Production needs HTTPS, authenticated users with roles, audit logging, and a BAA with any hosting or AI vendor that sees PHI.
- Do not log pasted text or form contents. Do not store PHI in `localStorage`.

## 9. Milestones

1. Scaffold Vite + React + TS; port the form with all dropdowns; unit-test the normalizers. **Done.**
2. Port extraction (`extract.ts`) with tests for each alias, date, money, percent and frequency format. **Done.**
3. Highlighting, Copy summary, Print CSS, Blank table values, Reset. **Done.**
4. Google Sheets save and load.
5. Auth, record list and search, status tracking.
6. Optional Claude-powered extraction endpoint (`POST /api/extract`), with this rule-based parser as the offline fallback. Validate JSON with zod before filling the form.

## 10. Acceptance criteria

- Every sheet field exists with the same label and order.
- Each percentage and frequency cell is a dropdown; out-of-list extracted values are added automatically.
- Pasting the sample text and selecting Extract fills the matching fields and highlights them.
- Works at 375px width (the procedures table scrolls horizontally) and in dark mode.
- All fields are labeled for screen readers; focus is visible; the form is usable by keyboard only.

## 11. Rules for Cursor

- TypeScript strict mode; no `any` in the extraction module.
- Keep parsing logic pure and covered by tests; do not put regexes inside components.
- Do not hard-code secrets; read them from environment variables on the server only.
- Do not rename field ids from the data model without updating the alias map and the Sheets column mapping.
- Prefer small, focused commits per milestone.
