/**
 * One consistent line-icon set (24px grid, 1.75 stroke, round caps).
 * Icons are decorative by default and hidden from assistive technology;
 * every icon is always accompanied by a text label.
 */

export type IconName =
  | 'gauge'
  | 'calendar'
  | 'road'
  | 'pound'
  | 'check'
  | 'alert'
  | 'exceeded'
  | 'info'
  | 'chart'
  | 'calculator'
  | 'chevron'
  | 'target'
  | 'copy'
  | 'trash'
  | 'arrow-right';

const PATHS: Record<IconName, React.ReactNode> = {
  gauge: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M21 12a9 9 0 0 1-2.64 6.36" />
      <path d="m12 12 4-4" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  road: (
    <>
      <path d="M8 3 5 21M16 3l3 18" />
      <path d="M12 4v3M12 10.5v3M12 17v3" />
    </>
  ),
  pound: (
    <>
      <path d="M16 6.5A3.5 3.5 0 0 0 9 7v4.5" />
      <path d="M7 12h6" />
      <path d="M7 19h10" />
      <path d="M9 11.5V16a3 3 0 0 1-2 3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20.2h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  exceeded: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="m7 15 4-4.5 3 2.5 4.5-6" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7" />
    </>
  ),
  'arrow-right': <path d="M4 12h15m-6-6 6 6-6 6" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Supply only when the icon carries meaning no adjacent text provides. */
  title?: string;
}

export function Icon({ name, size = 20, className, title }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
