import { useState, type FormEvent } from "react";
import { ApiError, isBackendConfigured, verifyPin } from "../lib/api/client";

export function OfficePinGate({
  open,
  onSuccess,
  onClose,
}: {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!isBackendConfigured()) {
      setError("Backend is not configured. Add Supabase env vars.");
      return;
    }
    setBusy(true);
    try {
      await verifyPin(pin);
      setPin("");
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify PIN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="ticket-drawer-backdrop" aria-label="Close PIN dialog" onClick={onClose} />
      <div className="ticket-drawer" role="dialog" aria-modal="true" aria-labelledby="pin-dialog-title">
        <section className="ticket-panel no-print">
          <div className="ticket-paste-head">
            <h2 id="pin-dialog-title">Office PIN</h2>
            {onClose ? (
              <button type="button" onClick={onClose} className="ticket-btn">
                Close
              </button>
            ) : null}
          </div>
          <form onSubmit={(event) => void submit(event)} className="ticket-paste">
            <p className="ticket-help">Enter the shared office PIN to search and save demo patient records.</p>
            <label className="ticket-field-label" htmlFor="office-pin">
              PIN
            </label>
            <input
              id="office-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              className="ticket-control"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
            {error ? (
              <p className="ticket-status" role="alert">
                {error}
              </p>
            ) : null}
            <div className="ticket-actions-inline">
              <button type="submit" className="ticket-btn ticket-btn-primary" disabled={busy || pin.trim() === ""}>
                {busy ? "Checking…" : "Unlock"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
