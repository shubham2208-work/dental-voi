import { useState, type FormEvent } from "react";
import type { PatientSummary } from "../lib/api/types";

type SearchMode = "name_dob" | "member_id";

export function PatientSearchPanel({
  onSearch,
  onPickPatient,
  onClose,
  busy,
  status,
  patientChoices,
}: {
  onSearch: (query: { mode: SearchMode; pat?: string; patdob?: string; subid?: string }) => void;
  onPickPatient: (patient: PatientSummary) => void;
  onClose: () => void;
  busy: boolean;
  status: string;
  patientChoices: PatientSummary[] | null;
}) {
  const [mode, setMode] = useState<SearchMode>("name_dob");
  const [pat, setPat] = useState("");
  const [patdob, setPatdob] = useState("");
  const [subid, setSubid] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "member_id") {
      onSearch({ mode, subid });
      return;
    }
    onSearch({ mode, pat, patdob });
  }

  return (
    <section aria-label="Search patients" className="ticket-panel no-print">
      <div className="ticket-paste-head">
        <h2 id="search-drawer-title">Search patient</h2>
        <button type="button" onClick={onClose} className="ticket-btn">
          Close
        </button>
      </div>
      <form onSubmit={submit} className="ticket-paste">
        <fieldset className="ticket-search-mode">
          <legend className="ticket-help">Search by</legend>
          <label>
            <input
              type="radio"
              name="search-mode"
              checked={mode === "name_dob"}
              onChange={() => setMode("name_dob")}
            />
            Patient name + DOB
          </label>
          <label>
            <input
              type="radio"
              name="search-mode"
              checked={mode === "member_id"}
              onChange={() => setMode("member_id")}
            />
            Member / Sub. ID
          </label>
        </fieldset>

        {mode === "name_dob" ? (
          <>
            <label className="ticket-field-label" htmlFor="search-pat">
              Patient name
            </label>
            <input
              id="search-pat"
              className="ticket-control"
              value={pat}
              onChange={(event) => setPat(event.target.value)}
              autoComplete="off"
            />
            <label className="ticket-field-label" htmlFor="search-patdob">
              Patient DOB
            </label>
            <input
              id="search-patdob"
              type="date"
              className="ticket-control"
              value={patdob}
              onChange={(event) => setPatdob(event.target.value)}
            />
          </>
        ) : (
          <>
            <label className="ticket-field-label" htmlFor="search-subid">
              Sub. ID #
            </label>
            <input
              id="search-subid"
              className="ticket-control"
              value={subid}
              onChange={(event) => setSubid(event.target.value)}
              autoComplete="off"
            />
          </>
        )}

        <div className="ticket-actions-inline">
          <button type="submit" className="ticket-btn ticket-btn-primary" disabled={busy}>
            {busy ? "Searching…" : "Search"}
          </button>
        </div>

        <p aria-live="polite" className="ticket-status">
          {status}
        </p>

        {patientChoices && patientChoices.length > 1 ? (
          <div className="ticket-picker-block">
            <p className="ticket-help">Multiple patients match. Select one:</p>
            <ul className="ticket-picker-list">
              {patientChoices.map((patient) => (
                <li key={patient.id}>
                  <button type="button" className="ticket-picker-item" onClick={() => onPickPatient(patient)}>
                    <span className="ticket-picker-item__main">{patient.pat || "Unknown name"}</span>
                    <span className="ticket-picker-item__meta">
                      ID {patient.patid || "—"} · DOB {patient.patdob ?? "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </section>
  );
}
