import type { CSSProperties, ReactNode } from "react";

/*
 * The HealthQuest symbol set. One 24px grid, one 1.75 stroke, round joins.
 * Drawn for this product so every symbol shares the same slightly human curve.
 */

const SYMBOLS = {
  // Signature
  path: (
    <>
      <path d="M5.5 18.5c3.6 0 3.4-4.3 6.5-6.5s2.9-6.5 6.5-6.5" />
      <circle cx="5.5" cy="18.5" r="2" data-fill="" />
      <circle cx="12" cy="12" r="1.6" data-fill="" />
      <circle cx="18.5" cy="5.5" r="2.25" />
    </>
  ),
  spark: <path d="M12 3.5c.6 4.6 3.3 7.3 8 8-4.7.7-7.4 3.4-8 8-.6-4.6-3.3-7.3-8-8 4.7-.7 7.4-3.4 8-8Z" data-fill="" />,
  "spark-outline": <path d="M12 3.5c.6 4.6 3.3 7.3 8 8-4.7.7-7.4 3.4-8 8-.6-4.6-3.3-7.3-8-8 4.7-.7 7.4-3.4 8-8Z" />,
  marker: (
    <>
      <path d="M6.5 20.5V4" />
      <path d="M6.5 4.5h10.2c.5 0 .8.6.5 1L15 8.3l2.2 2.8c.3.4 0 1-.5 1H6.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2Z" />
    </>
  ),

  // Wellness vocabulary
  leaf: (
    <>
      <path d="M5.5 18.5C5.5 10.5 10 5.8 18.5 5.5c0 8.4-4.8 13-13 13Z" />
      <path d="M5.5 18.5 13 11" />
    </>
  ),
  heart: (
    <>
      <path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />
      <path d="M7.5 12.5h2.2l1.2-2.2 2.1 4.4 1.2-2.2h2.3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5.5 6v5.6c0 4.1 2.8 7.3 6.5 8.9 3.7-1.6 6.5-4.8 6.5-8.9V6L12 3.5Z" />
      <path d="m9.3 12 1.9 1.9 3.6-3.7" />
    </>
  ),
  book: (
    <>
      <path d="M12 7c-1.9-1.4-4.3-2-7.5-2v12.5c3.2 0 5.6.6 7.5 2 1.9-1.4 4.3-2 7.5-2V5c-3.2 0-5.6.6-7.5 2Z" />
      <path d="M12 7v12.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 3.5v1.75M12 18.75v1.75M20.5 12h-1.75M5.25 12H3.5M18 6l-1.2 1.2M7.2 16.8 6 18M18 18l-1.2-1.2M7.2 7.2 6 6" />
    </>
  ),
  today: (
    <>
      <path d="M3.5 18h17" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M12 7.5v2.2M5.7 10.7l1.5 1.5M18.3 10.7l-1.5 1.5" />
    </>
  ),
  moon: <path d="M18.8 14.6A7.5 7.5 0 0 1 9.4 5.2a7.5 7.5 0 1 0 9.4 9.4Z" />,
  drop: <path d="M12 3.8s-6 6.3-6 10.5a6 6 0 0 0 12 0c0-4.2-6-10.5-6-10.5Z" />,
  motion: (
    <>
      <path d="M4 18.5c1.8-6 6-9.2 12-9.2" />
      <path d="m13.5 6 3.2 3.3-3.2 3.2" />
      <circle cx="5" cy="9" r="1.75" />
    </>
  ),
  bowl: (
    <>
      <path d="M4 11.5h16a8 8 0 0 1-16 0Z" />
      <path d="M9.5 7.8c0-1.1 1-1.5 1-2.6M14 7.8c0-1.1 1-1.5 1-2.6" />
    </>
  ),
  journal: (
    <>
      <path d="M7 3.5h10.5a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M9 3.5v17M12 8.5h3.5M12 11.5h3.5" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
  question: (
    <>
      <path d="M5.5 5.5h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H11l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <path d="M10.2 9.4a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.3" />
      <circle cx="12" cy="14.6" r=".9" data-fill="" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),

  // Interface
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  "arrow-right": <path d="M5 12h14m-5-5 5 5-5 5" />,
  "arrow-up": <path d="M12 19V5m-6 6 6-6 6 6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r=".9" data-fill="" />
    </>
  ),
  caution: (
    <>
      <path d="M10.3 4.8 3.8 16.5a2 2 0 0 0 1.7 3h13a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.4" r=".9" data-fill="" />
    </>
  ),
  phone: <path d="M6.6 4.5h2.2l1.4 3.6-1.8 1.2a9.5 9.5 0 0 0 4.3 4.3l1.2-1.8 3.6 1.4v2.2a2 2 0 0 1-2.1 2A13.5 13.5 0 0 1 4.6 6.6a2 2 0 0 1 2-2.1Z" />,
  skip: <path d="M5 12h9.5m-3.5-4 4 4-4 4M19 6.5v11" />,
  settings: (
    <>
      <path d="M4.5 7.5h9M17.5 7.5h2M4.5 16.5h2M10.5 16.5h9" />
      <circle cx="15.5" cy="7.5" r="2" />
      <circle cx="8.5" cy="16.5" r="2" />
    </>
  ),
  moonsun: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" data-fill="" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type HQIconName = keyof typeof SYMBOLS;

export const ICON_NAMES = Object.keys(SYMBOLS) as HQIconName[];

export function HQIcon({
  name,
  size,
  label,
  className,
}: {
  name: HQIconName;
  size?: number;
  /** Give a label only when the icon carries meaning that no nearby text states. */
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ? `hq-icon ${className}` : "hq-icon"}
      style={size ? ({ "--hq-icon-size": `${size}px` } as CSSProperties) : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {SYMBOLS[name]}
    </svg>
  );
}

export function HQGlyph({
  name,
  tone,
  size,
}: {
  name: HQIconName;
  tone?: "brand" | "sun" | "info" | "night";
  size?: number;
}) {
  return (
    <span
      className="hq-glyph"
      data-tone={tone}
      style={size ? ({ "--hq-glyph-size": `${size}px` } as CSSProperties) : undefined}
      aria-hidden
    >
      <HQIcon name={name} />
    </span>
  );
}
