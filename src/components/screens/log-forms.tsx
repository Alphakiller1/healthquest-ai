"use client";

import { useRef } from "react";
import { HQButton, HQField } from "@/components/hq/primitives";

type FormAction = (formData: FormData) => void | Promise<void>;

/** One-tap values that fill a field; the person can still type anything. */
function Presets({ values, suffix, onPick }: { values: (string | number)[]; suffix?: string; onPick: (value: string) => void }) {
  return (
    <div className="hq-recent" role="group" aria-label="Quick values">
      {values.map((value) => (
        <button key={value} type="button" onClick={() => onPick(String(value))}>
          {value}
          {suffix ?? ""}
        </button>
      ))}
    </div>
  );
}

/** Movement in a few taps: pick or type the activity, tap a duration, tap how it felt. */
export function MoveForm({ action, recent }: { action: FormAction; recent: string[] }) {
  const activity = useRef<HTMLInputElement>(null);
  const minutes = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="hq-log-form">
      {recent.length > 0 ? (
        <div className="hq-stack" style={{ gap: 8 }}>
          <span className="hq-label">Recent</span>
          <Presets values={recent} onPick={(value) => { if (activity.current) activity.current.value = value; }} />
        </div>
      ) : null}
      <HQField label="Activity" htmlFor="activityType" hint="A walk, chores, dancing, stretching — it all counts.">
        <input ref={activity} id="activityType" name="activityType" required autoComplete="off" className="hq-input" placeholder="walk" />
      </HQField>
      <HQField label="Minutes" htmlFor="durationMinutes">
        <input ref={minutes} id="durationMinutes" name="durationMinutes" type="number" inputMode="numeric" min={1} max={600} required className="hq-input" />
      </HQField>
      <Presets values={[10, 20, 30, 45, 60]} suffix=" min" onPick={(value) => { if (minutes.current) minutes.current.value = value; }} />
      <fieldset className="hq-segment">
        <legend>How it felt to you</legend>
        {["easy", "moderate", "hard"].map((level) => (
          <label key={level}>
            <input type="radio" name="intensity" value={level} required />
            {level}
          </label>
        ))}
      </fieldset>
      <HQButton type="submit" variant="primary" block icon="check">
        Save movement
      </HQButton>
    </form>
  );
}

/** Rest notes: every field optional, ratings as taps rather than typed numbers. */
export function RestForm({ action }: { action: FormAction }) {
  const sleep = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="hq-log-form">
      <HQField label="Sleep hours" htmlFor="sleepHours" hint="Last night, roughly.">
        <input ref={sleep} id="sleepHours" name="sleepHours" type="number" inputMode="decimal" min={0} max={24} step="0.5" className="hq-input" />
      </HQField>
      <Presets values={[5, 6, 7, 8, 9]} suffix=" h" onPick={(value) => { if (sleep.current) sleep.current.value = value; }} />
      <HQField label="Water, cups" htmlFor="waterCups">
        <input id="waterCups" name="waterCups" type="number" inputMode="numeric" min={0} max={40} className="hq-input" />
      </HQField>
      <Scale name="stressRating" legend="Stress today" low="Calm" high="Very stressed" />
      <Scale name="moodRating" legend="Mood today" low="Low" high="Great" />
      <HQButton type="submit" variant="primary" block icon="check">
        Save notes
      </HQButton>
    </form>
  );
}

function Scale({ name, legend, low, high }: { name: string; legend: string; low: string; high: string }) {
  return (
    <div className="hq-stack" style={{ gap: 6 }}>
      <fieldset className="hq-segment">
        <legend>
          {legend} <span className="hq-micro">(optional)</span>
        </legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value}>
            <input type="radio" name={name} value={value} aria-label={`${value} of 5${value === 1 ? `, ${low}` : value === 5 ? `, ${high}` : ""}`} />
            {value}
          </label>
        ))}
      </fieldset>
      <div className="hq-cluster hq-micro" style={{ justifyContent: "space-between" }} aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
