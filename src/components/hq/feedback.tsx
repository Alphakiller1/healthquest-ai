"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { HQIcon, type HQIconName } from "./icon";
import { HQAchievementBadge, type Tier } from "./learning";
import { HQButton } from "./primitives";

/**
 * Level 1 — micro recognition. A short, calm confirmation that leaves on its
 * own. Announced politely to screen readers.
 */
export function HQToast({
  message,
  xp,
  duration = 3200,
  onDone,
}: {
  message: string;
  xp?: number;
  duration?: number;
  onDone?: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const leave = window.setTimeout(() => setLeaving(true), duration);
    const remove = window.setTimeout(() => {
      setGone(true);
      onDone?.();
    }, duration + 260);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(remove);
    };
  }, [duration, onDone]);

  if (gone) return null;
  return (
    <div className="hq-toast-region" role="status" aria-live="polite">
      <div className="hq-toast" data-leaving={leaving ? "true" : undefined}>
        <span className="hq-toast__check" aria-hidden>
          <HQIcon name="check" />
        </span>
        <span>{message}</span>
        {xp ? <span className="hq-toast__xp">+{xp} XP</span> : null}
      </div>
    </div>
  );
}

/**
 * Level 3 — milestone. Reserved for quest completion, a level, or a lasting
 * achievement. A badge settles into place with a few sparks. No confetti rain.
 */
export function HQMilestone({
  open,
  title,
  body,
  badge,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  badge: { title: string; symbol: HQIconName; tier?: Tier };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="hq-milestone" aria-labelledby="hq-milestone-title" onClose={onClose}>
      {open ? (
        <>
          <div className="hq-milestone__stage" aria-hidden>
            {PARTICLES.map(([dx, dy], index) => (
              <span
                key={index}
                className="hq-milestone__particle"
                style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
              />
            ))}
            <HQAchievementBadge title="" symbol={badge.symbol} tier={badge.tier} reveal />
          </div>
          <p className="hq-label" style={{ marginBottom: 4 }}>
            {badge.title}
          </p>
          <h2 id="hq-milestone-title" className="hq-display" style={{ fontSize: "1.75rem" }}>
            {title}
          </h2>
          <p className="hq-secondary" style={{ margin: "8px 0 24px" }}>
            {body}
          </p>
          <HQButton variant="primary" block onClick={onClose} autoFocus>
            Continue
          </HQButton>
        </>
      ) : null}
    </dialog>
  );
}

const PARTICLES: [number, number][] = [
  [-62, -18], [-44, -48], [-10, -62], [30, -54], [58, -26], [64, 10], [-58, 22], [44, 40],
];

/** Button that plays the confirm press and shows a done state after a client action. */
export function HQConfirmButton({
  children,
  doneLabel,
  icon,
}: {
  children: ReactNode;
  doneLabel: string;
  icon?: HQIconName;
}) {
  const [done, setDone] = useState(false);
  return (
    <HQButton
      variant={done ? "secondary" : "primary"}
      icon={done ? "check" : icon}
      data-confirmed={done ? "true" : undefined}
      aria-pressed={done}
      onClick={() => setDone(true)}
    >
      {done ? doneLabel : children}
    </HQButton>
  );
}
