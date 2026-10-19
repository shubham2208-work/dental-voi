const ROWS = ["Eligibility", "Benefits", "Member ID"] as const;

export function VoiMark() {
  return (
    <div className="voi-mark no-print" aria-hidden="true">
      <div className="voi-card">
        <svg className="voi-person" viewBox="0 0 80 50" focusable="false">
          <path d="M18 50V31c0-14 8.5-23 22-23s22 9 22 23v19H50V34H30v16H18z" />
        </svg>
        <ul className="voi-rows">
          {ROWS.map((label) => (
            <li key={label} className="voi-row">
              <span>{label}</span>
              <i className="voi-bar" />
              <svg className="voi-check" viewBox="0 0 12 12" focusable="false">
                <path d="M2.2 6.2 4.8 8.8 9.8 3.2" />
              </svg>
            </li>
          ))}
        </ul>
      </div>
      <div className="voi-flow">
        <span className="voi-flow-label">
          VOI
          <br />
          FORM
        </span>
        <svg className="voi-arrow" viewBox="0 0 16 22" focusable="false">
          <path d="M8 1.5v14" />
          <path d="M3.2 11.2 8 16.2l4.8-5" />
          <path d="M3 20.2h10" />
        </svg>
      </div>
      <div className="voi-extract">
        <span className="voi-extract-label">Extract</span>
        <span className="voi-field">
          <span>plan: PPO</span>
        </span>
      </div>
    </div>
  );
}
