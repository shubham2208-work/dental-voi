import type { ReactNode } from "react";

type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className ?? "rail-icon"} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function ExtractIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3.75 2.25h5.1L12.25 5.6v8.15H3.75z" />
      <path d="M8.7 2.25V5.7h3.55" />
      <path d="M6 8.15h4.2M6 10.55h4.2" />
    </Icon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="7" cy="7" r="3.15" />
      <path d="M9.35 9.35 12.6 12.6" />
    </Icon>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="8" cy="8" r="2.35" />
      <path d="M8 1.7v1.7M8 12.6v1.7M1.7 8h1.7M12.6 8h1.7M3.45 3.45l1.2 1.2M11.35 11.35l1.2 1.2M3.45 12.55l1.2-1.2M11.35 4.65l1.2-1.2" />
    </Icon>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10.15 2.35A5.05 5.05 0 1 0 13.7 11.2 4.15 4.15 0 0 1 10.15 2.35z" />
    </Icon>
  );
}
