import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { HQIcon, type HQIconName } from "./icon";

type ButtonVariant = "primary" | "secondary" | "quiet" | "emergency" | "emergency-outline";

function buttonClass(variant: ButtonVariant, size?: "sm", block?: boolean) {
  return [
    "hq-btn",
    variant === "secondary" ? "" : `hq-btn--${variant}`,
    size === "sm" ? "hq-btn--sm" : "",
    block ? "hq-btn--block" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonOptions = {
  variant?: ButtonVariant;
  size?: "sm";
  block?: boolean;
  icon?: HQIconName;
  trailingIcon?: HQIconName;
};

export function HQButton({
  variant = "secondary",
  size,
  block,
  icon,
  trailingIcon,
  children,
  className,
  type = "button",
  ...rest
}: ButtonOptions & ComponentProps<"button">) {
  return (
    <button type={type} className={`${buttonClass(variant, size, block)} ${className ?? ""}`} {...rest}>
      {icon ? <HQIcon name={icon} /> : null}
      {children}
      {trailingIcon ? <HQIcon name={trailingIcon} /> : null}
    </button>
  );
}

export function HQButtonLink({
  variant = "secondary",
  size,
  block,
  icon,
  trailingIcon,
  children,
  className,
  ...rest
}: ButtonOptions & ComponentProps<typeof Link>) {
  return (
    <Link className={`${buttonClass(variant, size, block)} ${className ?? ""}`} {...rest}>
      {icon ? <HQIcon name={icon} /> : null}
      {children}
      {trailingIcon ? <HQIcon name={trailingIcon} /> : null}
    </Link>
  );
}

/* ───────── Surfaces ───────── */

export function HQSurface({
  variant = "base",
  as: Tag = "div",
  pad,
  className,
  children,
  ...rest
}: {
  variant?: "base" | "raised" | "soft" | "accent" | "sun" | "safety";
  as?: "div" | "section" | "article" | "aside";
  pad?: number;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"div">, "children">) {
  const variantClass = variant === "base" ? "" : `hq-surface--${variant}`;
  return (
    <Tag
      className={`hq-surface ${variantClass} ${className ?? ""}`}
      style={pad !== undefined ? ({ "--hq-surface-pad": `${pad}px` } as CSSProperties) : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function HQSection({
  title,
  action,
  children,
  id,
  className,
}: {
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section className={`hq-section ${className ?? ""}`} aria-labelledby={headingId} id={id}>
      <div className="hq-section__head">
        <h2 className="hq-section-title" id={headingId}>
          {title}
        </h2>
        {action ? (
          <Link className="hq-section__action" href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/* ───────── XP and chips ───────── */

export function HQXp({
  value,
  reward,
  reveal,
  className,
}: {
  value: number;
  /** A reward still to be earned renders as "+40" in sun ink. */
  reward?: boolean;
  reveal?: boolean;
  className?: string;
}) {
  const formatted = new Intl.NumberFormat("en-US").format(value);
  return (
    <span
      className={`hq-xp ${reward ? "hq-xp--reward" : ""} ${className ?? ""}`}
      data-reveal={reveal ? "true" : undefined}
    >
      <HQIcon name="spark" className="hq-xp__spark" size={reward ? 14 : 16} />
      <span className="hq-sr-only">{reward ? "Earn " : ""}</span>
      {reward ? `+${formatted}` : formatted}
      <span className={reward ? "" : "hq-sr-only"}> XP</span>
    </span>
  );
}

export function HQChip({
  tone,
  icon,
  children,
}: {
  tone?: "brand" | "sun" | "info";
  icon?: HQIconName;
  children: ReactNode;
}) {
  return (
    <span className="hq-chip" data-tone={tone}>
      {icon ? <HQIcon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}

/* ───────── The Path ───────── */

export type PathNodeState = "done" | "current" | "todo" | "rest";

export type PathNode = {
  state: PathNodeState;
  label?: string;
  /** Screen-reader description of this stop, e.g. "Monday, active". */
  description?: string;
  /** Content beside the node in the vertical orientation. */
  body?: ReactNode;
  /** Animate this node arriving (a Level 2 moment). */
  arrived?: boolean;
};

/**
 * The signature progress element. Nodes connect with a soft arc: walked
 * segments are solid, the road ahead is dotted. A skipped day is a rest,
 * drawn as a quiet dot, never as a broken line.
 */
export function HQPath({
  nodes,
  label,
  size = "md",
  orientation = "horizontal",
  showLabels = true,
  surface,
  className,
}: {
  nodes: PathNode[];
  label: string;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  showLabels?: boolean;
  /** Token name of the background the path sits on, so hollow nodes cover the line. */
  surface?: "canvas" | "surface" | "raised" | "soft" | "brand-soft";
  className?: string;
}) {
  const bg = surface
    ? surface === "brand-soft"
      ? "var(--hq-brand-soft)"
      : `var(--hq-bg-${surface})`
    : undefined;
  return (
    <ol
      className={`hq-path ${className ?? ""}`}
      data-size={size}
      data-orientation={orientation}
      aria-label={label}
      style={bg ? ({ "--hq-path-bg": bg } as CSSProperties) : undefined}
    >
      {nodes.map((node, index) => {
        const previous = nodes[index - 1];
        const walked =
          previous &&
          (previous.state === "done" || previous.state === "rest") &&
          (node.state === "done" || node.state === "current");
        return (
          <li
            key={index}
            className="hq-path__step"
            data-state={node.state}
            data-arrived={node.arrived ? "true" : undefined}
            aria-current={node.state === "current" ? "step" : undefined}
          >
            {index > 0 && orientation === "horizontal" ? (
              <svg
                className="hq-path__link"
                data-state={walked ? "walked" : "ahead"}
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M0 7 Q50 0 100 7" />
              </svg>
            ) : null}
            <span className="hq-path__node" aria-hidden>
              {node.state === "done" && size !== "sm" ? <HQIcon name="check" /> : null}
            </span>
            <span className="hq-sr-only">{node.description ?? `${node.label ?? `Step ${index + 1}`}, ${STATE_WORDS[node.state]}`}</span>
            {orientation === "vertical" ? (
              <div className="hq-path__body">{node.body ?? node.label}</div>
            ) : showLabels && node.label ? (
              <span className="hq-path__label" aria-hidden>
                {node.label}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

const STATE_WORDS: Record<PathNodeState, string> = {
  done: "done",
  current: "you are here",
  todo: "ahead",
  rest: "rest",
};

/** Builds nodes for "n of total" progress. */
export function stepsToNodes(done: number, total: number, labels?: string[]): PathNode[] {
  return Array.from({ length: total }, (_, index) => ({
    state: index < done ? "done" : index === done ? "current" : "todo",
    label: labels?.[index],
  }));
}

/* ───────── Callouts ───────── */

export function HQCallout({
  tone = "info",
  icon,
  title,
  children,
}: {
  tone?: "info" | "positive" | "caution" | "neutral" | "sun";
  icon?: HQIconName;
  title?: string;
  children: ReactNode;
}) {
  const fallback: Record<string, HQIconName> = {
    info: "info",
    positive: "check",
    caution: "caution",
    neutral: "info",
    sun: "spark",
  };
  return (
    <div className="hq-callout" data-tone={tone} role={tone === "caution" ? "note" : undefined}>
      <HQIcon name={icon ?? fallback[tone]} />
      <div>
        {title ? <p className="hq-callout__title">{title}</p> : null}
        <div className="hq-callout__body">{children}</div>
      </div>
    </div>
  );
}

/** Reserved for real safety messages. The only loud red in HealthQuest. */
export function HQSafetyBanner({
  message,
  actions,
}: {
  message: string;
  actions: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <section className="hq-safety" role="alert" aria-live="assertive">
      <p className="hq-safety__head">
        <HQIcon name="phone" size={22} />
        <span>{message}</span>
      </p>
      <div className="hq-safety__actions">
        {actions.map((action) => (
          <a
            key={action.href}
            className={`hq-btn ${action.primary ? "hq-btn--emergency" : "hq-btn--emergency-outline"}`}
            href={action.href}
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────── Empty and loading ───────── */

export function HQEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="hq-empty">
      <svg className="hq-empty__mark" viewBox="0 0 56 40" aria-hidden>
        <path
          d="M6 32c10 0 10-12 22-12s12-12 22-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="0.5 6"
          strokeLinecap="round"
        />
        <circle className="start" cx="6" cy="32" r="4.5" />
        <circle cx="50" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div>
        <p className="hq-empty__title">{title}</p>
        {body ? <p className="hq-empty__body">{body}</p> : null}
        {action ? (
          <div className="hq-empty__action">
            <HQButtonLink href={action.href} size="sm" trailingIcon="arrow-right">
              {action.label}
            </HQButtonLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The one looping animation: three waypoints taking turns. */
export function HQLoader({ label = "Loading" }: { label?: string }) {
  return (
    <span className="hq-loader" role="status">
      <span className="hq-loader__dot" />
      <span className="hq-loader__line" />
      <span className="hq-loader__dot" />
      <span className="hq-loader__line" />
      <span className="hq-loader__dot" />
      <span className="hq-sr-only">{label}</span>
    </span>
  );
}

export function HQSkeleton({ width = "100%", height = 16, radius }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <span
      className="hq-skeleton"
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

/* ───────── Fields ───────── */

export function HQField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="hq-field">
      <label className="hq-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint ? (
        <p className="hq-field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function HQChoice({
  type = "checkbox",
  name,
  value,
  label,
  hint,
  icon,
  defaultChecked,
  required,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value?: string;
  label: ReactNode;
  hint?: string;
  icon?: HQIconName;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="hq-choice">
      {icon ? <HQIcon name={icon} /> : <span aria-hidden />}
      <span className="hq-choice__label">
        {label}
        {hint ? <span className="hq-choice__hint">{hint}</span> : null}
      </span>
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} required={required} />
    </label>
  );
}
