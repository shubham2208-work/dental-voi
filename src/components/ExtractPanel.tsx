import type { Ref } from "react";

export function ExtractPanel({
  text,
  status,
  onText,
  onSample,
  onClear,
  onExtract,
  onClose,
  textareaRef,
}: {
  text: string;
  status: string;
  onText: (value: string) => void;
  onSample: () => void;
  onClear: () => void;
  onExtract: () => void;
  onClose: () => void;
  textareaRef: Ref<HTMLTextAreaElement>;
}) {
  return (
    <section aria-label="Extract from text" className="ticket-panel no-print">
      <div className="ticket-paste-head">
        <h2 id="extract-drawer-title">Paste the sheet</h2>
        <button type="button" onClick={onClose} className="ticket-btn">
          Close
        </button>
      </div>
      <div className="ticket-paste">
        <p className="ticket-help">
          Paste a sheet row or portal text. Procedure defaults are sample values. Choose Blank table values first when
          you do not want to keep them.
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onText(event.target.value)}
          rows={12}
          spellCheck={false}
          className="ticket-control"
          placeholder="Subscriber: Jane Doe"
          aria-label="Paste patient or insurance text"
        />
        <div className="ticket-actions-inline">
          <button
            type="button"
            onClick={onExtract}
            disabled={text.trim() === ""}
            className="ticket-btn ticket-btn-primary"
          >
            Extract
          </button>
          <button type="button" onClick={onSample} className="ticket-btn">
            Load sample
          </button>
          <button type="button" onClick={onClear} className="ticket-btn">
            Clear text
          </button>
        </div>
        <p aria-live="polite" className="ticket-status">
          {status || "Matching fields turn amber until you edit them."}
        </p>
      </div>
    </section>
  );
}
