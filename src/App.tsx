import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExtractPanel } from "./components/ExtractPanel";
import { FieldsGrid, ResetEpochContext } from "./components/Fields";
import { ProceduresTable } from "./components/ProceduresTable";
import { Section } from "./components/Section";
import { HighlightProvider } from "./highlight";
import { applyExtract } from "./lib/extract";
import { BENEFIT_FIELDS, COIN_FIELDS, LIMIT_FIELDS, NOTES_FIELD, PATIENT_FIELDS } from "./lib/fields";
import { blankProcedures, createFreshRecord } from "./lib/defaults";
import { SAMPLE_TEXT } from "./lib/sample";
import { voiSchema } from "./lib/schema";
import { hasRecordedHistory, missingPrintFields, NO_HISTORY_PROMPT, PRINT_SUCCESS, printBlockMessage } from "./lib/printReady";
import { toSummary } from "./lib/summary";
import type { VoiFormValues } from "./types";

const COVERED_ORDER = ["pat", "patid", "sub", "subid", "patdob", "subdob", "grp", "grpn"] as const;
const RECORD_ORDER = ["office", "by", "ins", "payor", "date", "byear"] as const;
const SCREEN_TITLE = "Dental VOI Form";

function printTitle(patient: string) {
  const name = patient.trim();
  return name ? `${name} Dental VOI Form` : SCREEN_TITLE;
}

function fieldsInOrder(order: readonly string[]) {
  return order
    .map((name) => PATIENT_FIELDS.find((field) => field.name === name))
    .filter((field): field is (typeof PATIENT_FIELDS)[number] => Boolean(field));
}

const COVERED_FIELDS = fieldsInOrder(COVERED_ORDER);
const RECORD_FIELDS = fieldsInOrder(RECORD_ORDER);

export default function App() {
  const methods = useForm<VoiFormValues>({
    defaultValues: createFreshRecord(),
    resolver: zodResolver(voiSchema),
  });
  const { getValues, reset, setValue, watch } = methods;
  const office = watch("office");
  const patient = watch("pat");
  const printedName = printTitle(patient);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [highlighted, setHighlighted] = useState<ReadonlySet<string>>(() => new Set());
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  const extractToggleRef = useRef<HTMLButtonElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const drawerWasOpen = useRef(false);

  const markEdited = useCallback((path: string) => {
    setHighlighted((current) => {
      if (!current.has(path)) return current;
      const next = new Set(current);
      next.delete(path);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      if (drawerWasOpen.current) extractToggleRef.current?.focus();
      return;
    }
    drawerWasOpen.current = true;
    pasteRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function onExtract() {
    const applied = applyExtract(getValues(), text);
    reset(applied.next, { keepFieldsRef: true });
    setHighlighted(new Set(applied.highlighted));
    setStatus(applied.message);
    setDrawerOpen(false);
  }

  function onBlank() {
    const rows = blankProcedures(getValues("procedures"));
    setValue("procedures", rows);
    setHighlighted((current) => {
      const next = new Set(current);
      rows.forEach((_, index) => {
        next.delete(`procedures.${index}.pct`);
        next.delete(`procedures.${index}.freq`);
        next.delete(`procedures.${index}.history`);
      });
      return next;
    });
    setStatus("Cleared percentages, frequencies, and history.");
  }

  const startFresh = useCallback(() => {
    reset(createFreshRecord(), { keepFieldsRef: true });
    setResetEpoch((epoch) => epoch + 1);
    setHighlighted(new Set());
    setText("");
    setDrawerOpen(false);
  }, [reset]);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) startFresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [startFresh]);

  function onReset() {
    if (!window.confirm("Start a new form?")) return;
    startFresh();
    setStatus("Started a new form.");
  }

  async function onCopy() {
    const summary = toSummary(getValues());
    try {
      await navigator.clipboard.writeText(summary);
      setStatus("Summary copied.");
      return;
    } catch {
      const area = document.createElement("textarea");
      area.value = summary;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      setStatus(copied ? "Summary copied." : "Could not copy. This browser blocked clipboard access.");
    }
  }

  useEffect(() => {
    function applyPrintTitle() {
      document.title = printTitle(getValues("pat"));
    }
    function restoreTitle() {
      document.title = SCREEN_TITLE;
    }
    window.addEventListener("beforeprint", applyPrintTitle);
    window.addEventListener("afterprint", restoreTitle);
    return () => {
      window.removeEventListener("beforeprint", applyPrintTitle);
      window.removeEventListener("afterprint", restoreTitle);
      document.title = SCREEN_TITLE;
    };
  }, [getValues]);

  function onPrint() {
    const values = getValues();
    const missing = missingPrintFields(values);
    if (missing.length > 0) {
      setStatus(printBlockMessage(missing));
      return;
    }
    if (!hasRecordedHistory(values) && !window.confirm(NO_HISTORY_PROMPT)) return;
    document.title = printTitle(values.pat);
    window.print();
    window.alert(PRINT_SUCCESS);
  }

  function onTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dental-voi-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <HighlightProvider value={{ highlighted, markEdited }}>
      <ResetEpochContext.Provider value={resetEpoch}>
      <FormProvider {...methods}>
        <a className="skip-link" href="#voi-form">
          Skip to form
        </a>
        <div className="ticket-app">
          <aside className="ticket-rail no-print">
            <div className="rail-body">
              <div className="rail-tools">
                <button
                  ref={extractToggleRef}
                  type="button"
                  className="ticket-btn ticket-btn-primary"
                  aria-expanded={drawerOpen}
                  aria-controls="extract-drawer"
                  onClick={() => setDrawerOpen((open) => !open)}
                >
                  Extract
                </button>
                <button type="button" onClick={onTheme} className="ticket-btn" aria-pressed={dark}>
                  {dark ? "Light mode" : "Dark mode"}
                </button>
              </div>
            </div>
            {drawerOpen ? (
              <>
                <button type="button" className="ticket-drawer-backdrop" aria-label="Close extract" onClick={() => setDrawerOpen(false)} />
                <div
                  id="extract-drawer"
                  className="ticket-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="extract-drawer-title"
                >
                  <ExtractPanel
                    text={text}
                    status={status}
                    textareaRef={pasteRef}
                    onText={setText}
                    onSample={() => setText(SAMPLE_TEXT)}
                    onClear={() => {
                      setText("");
                      setStatus("");
                    }}
                    onExtract={onExtract}
                    onClose={() => setDrawerOpen(false)}
                  />
                </div>
              </>
            ) : null}
          </aside>
          <div className="ticket-main">
            <header className="ticket-header">
              <div>
                <h1 className="ticket-title no-print">Dental VOI</h1>
                <h1 className="ticket-title ticket-print-title">{printedName}</h1>
                {office ? <p className="ticket-office">{office}</p> : null}
              </div>
            </header>
            <main className="ticket-work">
              <p className="ticket-note no-print">
                Use dummy data in this preview. Records stay in this session only and are cleared on refresh. Nothing is
                sent to a server.
              </p>
              {!drawerOpen && status ? (
                <p className="ticket-status no-print" aria-live="polite">
                  {status}
                </p>
              ) : null}
              <form id="voi-form" className="ticket-stack" autoComplete="off" onSubmit={(event) => event.preventDefault()}>
                <Section title="Office and insurance information">
                  <FieldsGrid fields={RECORD_FIELDS} />
                </Section>
                <Section title="Who is covered">
                  <FieldsGrid fields={COVERED_FIELDS} prominent={["pat"]} wide={["patid"]} />
                </Section>
                <Section title="In-network benefits">
                  <FieldsGrid fields={BENEFIT_FIELDS} />
                </Section>
                <Section title="Plan limitations">
                  <FieldsGrid fields={LIMIT_FIELDS} />
                </Section>
                <Section title="Co-insurance %">
                  <FieldsGrid fields={COIN_FIELDS} />
                </Section>
                <Section title="Notes">
                  <FieldsGrid fields={[NOTES_FIELD]} />
                </Section>
                <Section title="Procedures" wide>
                  <ProceduresTable />
                </Section>
                <div className="ticket-actions ticket-form-actions no-print">
                  <button type="button" onClick={() => void onCopy()} className="ticket-btn">
                    Copy summary
                  </button>
                  <button type="button" onClick={onPrint} className="ticket-btn">
                    Print or save as PDF
                  </button>
                  <button type="button" onClick={onBlank} className="ticket-btn">
                    Blank table values
                  </button>
                  <button type="button" onClick={onReset} className="ticket-btn ticket-btn-danger">
                    Reset form
                  </button>
                </div>
              </form>
            </main>
          </div>
        </div>
      </FormProvider>
      </ResetEpochContext.Provider>
    </HighlightProvider>
  );
}
