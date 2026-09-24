import Link from "next/link";
import type { CSSProperties } from "react";
import { HQGlyph, HQIcon, type HQIconName } from "./icon";
import { HQXp } from "./primitives";

export type LessonCardData = {
  id: string;
  title: string;
  minutes: number;
  rewardXp: number;
  completed?: boolean;
  /** One line on why this lesson was picked, e.g. "Pairs with your sleep quest". */
  reason?: string;
};

/** Today's one learning opportunity. Editorial, warm, a single tap target. */
export function HQLessonFeature({ lesson, href }: { lesson: LessonCardData; href: string }) {
  return (
    <Link className="hq-lesson-feature" href={href}>
      <HQGlyph name="book" />
      <div>
        <span className="hq-label hq-tint-sun" style={{ color: "var(--hq-sun-ink)" }}>
          {lesson.reason ?? "One thing to learn"}
        </span>
        <p className="hq-lesson-feature__title">{lesson.title}</p>
        <span className="hq-cluster hq-micro" style={{ "--hq-cluster-gap": "12px" } as CSSProperties}>
          <span className="hq-cluster" style={{ "--hq-cluster-gap": "4px" } as CSSProperties}>
            <HQIcon name="clock" size={14} />
            {lesson.minutes} min read
          </span>
          <HQXp value={lesson.rewardXp} reward />
        </span>
      </div>
    </Link>
  );
}

/** A lesson in a list. Completed lessons keep their place with a done node. */
export function HQLessonRow({ lesson, href }: { lesson: LessonCardData; href: string }) {
  return (
    <Link className="hq-lesson-row" href={href}>
      <span
        className="hq-path__node"
        data-lesson-node
        style={
          lesson.completed
            ? ({ background: "var(--hq-brand)", boxShadow: "none", width: 24, height: 24, color: "var(--hq-on-brand)" } as CSSProperties)
            : ({ width: 24, height: 24, background: "transparent" } as CSSProperties)
        }
        aria-hidden
      >
        {lesson.completed ? <HQIcon name="check" size={14} /> : null}
      </span>
      <span>
        <span className="hq-lesson-row__title">{lesson.title}</span>
        <span className="hq-micro" style={{ display: "block" }}>
          {lesson.minutes} min{lesson.completed ? " · Read" : ""}
        </span>
      </span>
      {lesson.completed ? (
        <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
      ) : (
        <HQXp value={lesson.rewardXp} reward />
      )}
    </Link>
  );
}

export type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "brand" | "sun";

/**
 * Achievement mark. A softened octagon with a double rule: a memento, not a
 * trophy. Tier colours describe participation only.
 */
export function HQAchievementBadge({
  title,
  detail,
  symbol,
  tier = "brand",
  locked,
  reveal,
  size,
}: {
  title: string;
  detail?: string;
  symbol: HQIconName;
  tier?: Tier;
  locked?: boolean;
  reveal?: boolean;
  size?: number;
}) {
  const tierColor =
    tier === "brand" ? "var(--hq-brand)" : tier === "sun" ? "var(--hq-sun)" : `var(--hq-tier-${tier})`;
  return (
    <div
      className="hq-badge"
      data-locked={locked ? "true" : undefined}
      data-reveal={reveal ? "true" : undefined}
      style={
        {
          ...(locked ? {} : { "--hq-tier": tierColor }),
          ...(size ? { "--hq-badge-size": `${size}px` } : {}),
        } as CSSProperties
      }
    >
      <span className="hq-badge__medal">
        <svg className="hq-badge__frame" viewBox="0 0 64 64" aria-hidden>
          <path className="frame-fill frame-ring" d={OCTAGON(30)} />
          <path className="frame-inner" d={OCTAGON(25)} />
        </svg>
        <HQIcon name={locked ? "path" : symbol} />
      </span>
      <span className="hq-badge__title">{title}</span>
      {detail ? <span className="hq-badge__detail">{detail}</span> : null}
      {locked ? <span className="hq-sr-only">Not yet earned.</span> : null}
    </div>
  );
}

/** Rounded octagon centred in a 64 box. */
function OCTAGON(r: number) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 8) * (2 * i + 1);
    return [32 + r * Math.cos(angle), 32 + r * Math.sin(angle)] as const;
  });
  const soft = 0.18;
  let d = "";
  points.forEach((point, i) => {
    const prev = points[(i + 7) % 8];
    const next = points[(i + 1) % 8];
    const a = [point[0] + (prev[0] - point[0]) * soft, point[1] + (prev[1] - point[1]) * soft];
    const b = [point[0] + (next[0] - point[0]) * soft, point[1] + (next[1] - point[1]) * soft];
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${point[0].toFixed(2)} ${point[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  });
  return `${d}Z`;
}
