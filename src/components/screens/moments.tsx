"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { MomentResult } from "@/app/now/actions";
import { HQIcon } from "@/components/hq/icon";
import { HQButton, HQCallout, HQSafetyBanner } from "@/components/hq/primitives";
import { HQLayer } from "@/components/hq/layers";
import type { DetailLevel } from "@/lib/experience/depth";
import { BREATH, CALM_TOOLS, FEELINGS, GROUNDING_STEPS, toolsFor, type CalmTool, type Feeling } from "@/lib/moments/calm";
import { ENERGY, MINUTES, MOVE_SAFETY, PLACES, pickMoves, type Energy, type MoveOption, type Place } from "@/lib/moments/movement";

type Complete = (input: { kind: "move" | "calm" | "food"; moveId?: string; minutes?: number }) => Promise<MomentResult>;

export type SourceLine = { id: string; organization: string; url: string };

/* ───────── Shared ───────── */

function Segment<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="hq-segment">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={String(option.id)}>
          <input type="radio" name={name} checked={value === option.id} onChange={() => onChange(option.id)} />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

/** The reward moment: a warm line, the XP, and where to go next. */
export function WinCard({ result, again, againLabel }: { result: MomentResult; again: () => void; againLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div ref={ref} tabIndex={-1} className="hq-win" role="status">
      <span className="hq-win__mark" aria-hidden>
        <HQIcon name="spark" size={28} />
      </span>
      <p className="hq-win__line">{result.message}</p>
      {result.xp > 0 ? <p className="hq-win__xp">+{result.xp} XP</p> : <p className="hq-micro" style={{ margin: 0 }}>Already counted today — it still helps.</p>}
      <div className="hq-stack" style={{ gap: 8, width: "100%" }}>
        <Link href="/today" className="hq-btn hq-btn--primary hq-btn--block">
          Back to Today
        </Link>
        <HQButton variant="quiet" block onClick={again}>
          {againLabel}
        </HQButton>
      </div>
    </div>
  );
}

function Sources({ ids, sources }: { ids: string[]; sources: Record<string, SourceLine> }) {
  const unique = [...new Set(ids)].map((id) => sources[id]).filter(Boolean);
  if (unique.length === 0) return null;
  return (
    <p className="hq-micro" style={{ margin: 0 }}>
      Based on{" "}
      {unique.map((source, index) => (
        <span key={source.id}>
          {index > 0 ? ", " : ""}
          <a href={source.url}>{source.organization}</a>
        </span>
      ))}
    </p>
  );
}

/* ───────── Move ───────── */

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MoveFlow({
  complete,
  initialMinutes,
  claimSources,
  sources,
  level = "standard",
}: {
  complete: Complete;
  initialMinutes?: number;
  /** Simple shows the single best fit first, with the rest one tap away. */
  level?: DetailLevel;
  /** claim id → source id, so each option can show what it rests on. */
  claimSources: Record<string, string>;
  sources: Record<string, SourceLine>;
}) {
  const [place, setPlace] = useState<Place>("home");
  const [minutes, setMinutes] = useState<number>(MINUTES.includes(initialMinutes as (typeof MINUTES)[number]) ? (initialMinutes as number) : 5);
  const [energy, setEnergy] = useState<Energy>("some");
  const [chosen, setChosen] = useState<MoveOption | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MomentResult | null>(null);
  const [pending, startTransition] = useTransition();
  const options = pickMoves({ place, minutes, energy });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (remaining === 0 && running) setRunning(false);
  }, [remaining, running]);

  function start(option: MoveOption) {
    setChosen(option);
    setRemaining(minutes * 60);
    setRunning(false);
    setResult(null);
  }

  function finish() {
    if (!chosen) return;
    const elapsedMinutes = Math.max(1, Math.round((minutes * 60 - remaining) / 60)) || minutes;
    startTransition(async () => {
      setResult(await complete({ kind: "move", moveId: chosen.id, minutes: remaining === minutes * 60 ? minutes : elapsedMinutes }));
      setRunning(false);
    });
  }

  if (result) {
    return <WinCard result={result} again={() => { setResult(null); setChosen(null); }} againLabel="Find another" />;
  }

  if (chosen) {
    const total = minutes * 60;
    const progress = total ? 1 - remaining / total : 0;
    return (
      <section className="hq-stack" style={{ gap: 20 }} aria-labelledby="move-title">
        <button type="button" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0, border: 0, background: "none" }} onClick={() => setChosen(null)}>
          <HQIcon name="chevron-left" size={16} /> Other options
        </button>
        <h2 id="move-title" className="hq-title" style={{ margin: 0 }}>
          {chosen.name}
        </h2>
        <ol className="hq-answer__steps">
          {chosen.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="hq-timer" role="timer" aria-live="off" aria-label={`${formatClock(remaining)} left`}>
          <svg viewBox="0 0 120 120" aria-hidden className="hq-timer__ring">
            <circle cx="60" cy="60" r="52" className="hq-timer__track" />
            <circle cx="60" cy="60" r="52" className="hq-timer__fill" style={{ strokeDashoffset: 327 * (1 - progress) }} />
          </svg>
          <span className="hq-timer__clock">{formatClock(remaining)}</span>
        </div>
        <div className="hq-stack" style={{ gap: 8 }}>
          {remaining > 0 ? (
            <HQButton variant={running ? "secondary" : "primary"} block icon={running ? undefined : "arrow-right"} onClick={() => setRunning((value) => !value)}>
              {running ? "Pause" : remaining === total ? "Start" : "Keep going"}
            </HQButton>
          ) : null}
          <HQButton variant={remaining === 0 ? "primary" : "quiet"} block icon="check" onClick={finish} disabled={pending}>
            {remaining === 0 ? "Log it" : "I'm done — log it"}
          </HQButton>
        </div>
        <HQCallout tone="neutral" icon="shield">{MOVE_SAFETY}</HQCallout>
        <Sources ids={chosen.claimIds.map((id) => claimSources[id]).filter(Boolean)} sources={sources} />
      </section>
    );
  }

  return (
    <div className="hq-stack" style={{ gap: 20 }}>
      <Segment legend="Where are you?" name="place" value={place} options={PLACES} onChange={setPlace} />
      <Segment legend="How many minutes?" name="minutes" value={minutes} options={MINUTES.map((m) => ({ id: m as number, label: `${m}` }))} onChange={setMinutes} />
      <Segment legend="Energy right now" name="energy" value={energy} options={ENERGY} onChange={setEnergy} />
      <section className="hq-stack" style={{ gap: 10 }} aria-labelledby="options-title" aria-live="polite">
        <h2 id="options-title" className="hq-label" style={{ margin: 0 }}>
          Good fits
        </h2>
        {options.length === 0 ? (
          <HQCallout tone="neutral">Nothing fits that combination yet. Try a few more minutes or another place.</HQCallout>
        ) : level === "simple" && options.length > 1 ? (
          <>
            <MoveOptionButton option={options[0]} onPick={start} />
            <HQLayer depth={2} level={level} label={`More options (${options.length - 1})`}>
              {options.slice(1).map((option) => (
                <MoveOptionButton key={option.id} option={option} onPick={start} />
              ))}
            </HQLayer>
          </>
        ) : (
          options.map((option) => (
            <button key={option.id} type="button" className="hq-move-option" onClick={() => start(option)}>
              <span className="hq-move-option__name">{option.name}</span>
              <span className="hq-micro">
                {option.intensity === "easy" ? "Easy pace" : "A bit more effort"}
                {option.strength ? " · builds strength" : ""}
              </span>
              <HQIcon name="arrow-right" size={18} />
            </button>
          ))
        )}
      </section>
    </div>
  );
}

function MoveOptionButton({ option, onPick }: { option: MoveOption; onPick: (option: MoveOption) => void }) {
  return (
    <button type="button" className="hq-move-option" onClick={() => onPick(option)}>
      <span className="hq-move-option__name">{option.name}</span>
      <span className="hq-micro">
        {option.intensity === "easy" ? "Easy pace" : "A bit more effort"}
        {option.strength ? " · builds strength" : ""}
      </span>
      <HQIcon name="arrow-right" size={18} />
    </button>
  );
}

/* ───────── Calm ───────── */

function Breathe({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"ready" | "in" | "out" | "done">("ready");
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (phase === "ready" || phase === "done") return;
    const seconds = phase === "in" ? BREATH.inhaleSeconds : BREATH.exhaleSeconds;
    const timer = window.setTimeout(() => {
      if (phase === "in") setPhase("out");
      else if (round + 1 >= BREATH.rounds) setPhase("done");
      else {
        setRound((value) => value + 1);
        setPhase("in");
      }
    }, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, round]);

  return (
    <div className="hq-stack" style={{ gap: 20, alignItems: "center" }}>
      <div className="hq-breath" data-phase={phase} aria-hidden>
        <span className="hq-breath__circle" />
      </div>
      <p className="hq-title" style={{ margin: 0, textAlign: "center" }} aria-live="polite">
        {phase === "ready" ? "Ready when you are" : phase === "in" ? "Breathe in…" : phase === "out" ? "…and slowly out" : "Nicely done"}
      </p>
      <p className="hq-micro" style={{ margin: 0 }}>
        {phase === "done" ? "One minute of slower breathing." : `In for ${BREATH.inhaleSeconds}, out for ${BREATH.exhaleSeconds}. ${phase === "ready" ? "" : `Round ${round + 1} of ${BREATH.rounds}.`}`}
      </p>
      {phase === "ready" ? (
        <HQButton variant="primary" block onClick={() => setPhase("in")}>
          Start
        </HQButton>
      ) : (
        <HQButton variant={phase === "done" ? "primary" : "quiet"} block icon="check" onClick={onDone}>
          {phase === "done" ? "Finish" : "Finish early"}
        </HQButton>
      )}
    </div>
  );
}

function Ground({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === GROUNDING_STEPS.length - 1;
  return (
    <div className="hq-stack" style={{ gap: 16 }}>
      <p className="hq-label" style={{ margin: 0 }}>
        {step + 1} of {GROUNDING_STEPS.length}
      </p>
      <p className="hq-onboard__question" style={{ fontSize: "1.5rem" }} aria-live="polite">
        {GROUNDING_STEPS[step]}
      </p>
      <p className="hq-micro" style={{ margin: 0 }}>Take your time. Say them in your head or out loud.</p>
      <HQButton variant="primary" block icon={last ? "check" : "arrow-right"} onClick={() => (last ? onDone() : setStep(step + 1))}>
        {last ? "Finish" : "Next"}
      </HQButton>
    </div>
  );
}

export function CalmFlow({
  complete,
  initialTool,
  claimSources,
  sources,
}: {
  complete: Complete;
  initialTool?: CalmTool;
  claimSources: Record<string, string>;
  sources: Record<string, SourceLine>;
}) {
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [tool, setTool] = useState<CalmTool | null>(initialTool ?? null);
  const [result, setResult] = useState<MomentResult | null>(null);
  const [pending, startTransition] = useTransition();

  function done() {
    startTransition(async () => setResult(await complete({ kind: "calm" })));
  }

  if (result) {
    return <WinCard result={result} again={() => { setResult(null); setTool(null); setFeeling(null); }} againLabel="Try something else" />;
  }

  if (tool) {
    const info = CALM_TOOLS[tool];
    return (
      <section className="hq-stack" style={{ gap: 20 }} aria-labelledby="tool-title">
        <button type="button" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0, border: 0, background: "none" }} onClick={() => setTool(null)}>
          <HQIcon name="chevron-left" size={16} /> Other ideas
        </button>
        <h2 id="tool-title" className="hq-title" style={{ margin: 0 }}>
          {info.title}
        </h2>
        {tool === "breathe" ? (
          <Breathe onDone={done} />
        ) : tool === "ground" ? (
          <Ground onDone={done} />
        ) : (
          <>
            <p className="hq-reading" style={{ margin: 0 }}>
              {info.summary}
            </p>
            {tool === "walk" ? (
              <Link href="/now/move?minutes=5" className="hq-btn hq-btn--block">
                Pick a 5-minute walk
              </Link>
            ) : null}
            <HQButton variant="primary" block icon="check" onClick={done} disabled={pending}>
              I did it
            </HQButton>
          </>
        )}
        <Sources ids={info.claimIds.map((id) => claimSources[id]).filter(Boolean)} sources={sources} />
      </section>
    );
  }

  return (
    <div className="hq-stack" style={{ gap: 20 }}>
      <fieldset className="hq-feelings">
        <legend className="hq-label">How are you feeling right now?</legend>
        {FEELINGS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="hq-feeling"
            data-kind={item.id === "unsafe" ? "unsafe" : undefined}
            aria-pressed={feeling === item.id}
            onClick={() => setFeeling(item.id)}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
      <p className="hq-micro" style={{ margin: 0 }}>Nothing you tap here is saved.</p>

      {feeling === "unsafe" ? (
        <HQSafetyBanner
          message="You don't have to go through this alone. You can call or text 988 to reach the Suicide & Crisis Lifeline any time, or chat at 988lifeline.org. If you're in immediate danger, call 911."
          actions={[
            { label: "Call 988", href: "tel:988", primary: true },
            { label: "Text 988", href: "sms:988", primary: true },
            { label: "Call 911", href: "tel:911" },
          ]}
        />
      ) : feeling ? (
        <section className="hq-stack" style={{ gap: 10 }} aria-labelledby="ideas-title" aria-live="polite">
          <h2 id="ideas-title" className="hq-label" style={{ margin: 0 }}>
            {feeling === "good" || feeling === "okay" ? "Keep it going" : "A few things that may help"}
          </h2>
          {toolsFor(feeling).map((id) => (
            <button key={id} type="button" className="hq-move-option" onClick={() => setTool(id)}>
              <span className="hq-move-option__name">{CALM_TOOLS[id].title}</span>
              <span className="hq-micro">{CALM_TOOLS[id].summary}</span>
              <HQIcon name="arrow-right" size={18} />
            </button>
          ))}
          <p className="hq-micro" style={{ margin: "4px 0 0" }}>
            If stress or low mood keeps getting in the way of daily life, it may be time to talk with a professional.
          </p>
        </section>
      ) : null}
    </div>
  );
}
