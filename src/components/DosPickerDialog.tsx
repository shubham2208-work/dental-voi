import type { VisitSummary } from "../lib/api/types";

function formatDos(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function DosPickerDialog({
  open,
  patientLabel,
  visits,
  onSelect,
  onClose,
}: {
  open: boolean;
  patientLabel: string;
  visits: VisitSummary[];
  onSelect: (visitId: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="ticket-drawer-backdrop" aria-label="Close visit picker" onClick={onClose} />
      <div className="ticket-drawer" role="dialog" aria-modal="true" aria-labelledby="dos-picker-title">
        <section className="ticket-panel no-print">
          <div className="ticket-paste-head">
            <h2 id="dos-picker-title">Select date of service</h2>
            <button type="button" onClick={onClose} className="ticket-btn">
              Close
            </button>
          </div>
          <div className="ticket-paste">
            <p className="ticket-help">
              {patientLabel ? `${patientLabel} — ` : ""}
              choose which saved visit to open.
            </p>
            <ul className="ticket-picker-list">
              {visits.map((visit) => (
                <li key={visit.visit_id}>
                  <button
                    type="button"
                    className="ticket-picker-item"
                    onClick={() => onSelect(visit.visit_id)}
                  >
                    <span className="ticket-picker-item__main">{formatDos(visit.date_of_service)}</span>
                    <span className="ticket-picker-item__meta">Updated {formatUpdated(visit.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
