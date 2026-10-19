import type { ReactNode } from "react";

export function Section({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className="ticket-panel">
      <h2>{title}</h2>
      <div className={wide ? "ticket-wide" : "ticket-grid"}>{children}</div>
    </section>
  );
}
