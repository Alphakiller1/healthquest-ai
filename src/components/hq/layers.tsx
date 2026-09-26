import type { ReactNode } from "react";
import { startsOpen, type Depth, type DetailLevel } from "@/lib/experience/depth";
import { HQIcon } from "./icon";

/**
 * A deeper layer of a screen. Built on <details>, so it works with a
 * keyboard, a screen reader, and without JavaScript. The person's detail
 * level decides whether it starts open; it is always one tap away.
 */
export function HQLayer({
  depth,
  level,
  label,
  hint,
  children,
}: {
  depth: Exclude<Depth, 1>;
  level: DetailLevel;
  /** Says what opening it gives you: "Why this matters", "See the numbers", "Sources". */
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <details className="hq-layer" data-depth={depth} open={startsOpen(level, depth)}>
      <summary>
        <span className="hq-layer__mark" aria-hidden>
          <HQIcon name={depth === 2 ? "plus" : "book"} size={16} />
        </span>
        <span className="hq-layer__label">
          {label}
          {hint ? <span className="hq-layer__hint">{hint}</span> : null}
        </span>
        <HQIcon name="chevron-right" size={18} className="hq-layer__chevron" />
      </summary>
      <div className="hq-layer__body">{children}</div>
    </details>
  );
}

/**
 * The contract every screen starts with: where you are, the question the
 * screen answers, and one sentence on why it's here. An optional note
 * explains the screen to someone seeing it for the first time.
 */
export function HQScreenHeader({
  eyebrow,
  title,
  purpose,
  about,
  back,
  serif = true,
}: {
  eyebrow: string;
  title: string;
  purpose?: string;
  /** "What is this?" — shown collapsed, for anyone new to the screen. */
  about?: string;
  back?: ReactNode;
  serif?: boolean;
}) {
  return (
    <header className="hq-page-head">
      {back}
      <p className="hq-label">{eyebrow}</p>
      <h1 className={serif ? "hq-onboard__question" : "hq-title"}>{title}</h1>
      {purpose ? <p className="hq-secondary">{purpose}</p> : null}
      {about ? (
        <details className="hq-about">
          <summary>
            <HQIcon name="info" size={16} />
            What is this?
          </summary>
          <p>{about}</p>
        </details>
      ) : null}
    </header>
  );
}
