"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChoice, HQPath } from "@/components/hq/primitives";
import { ACTIVITY_BASELINES, BUDGETS } from "@/lib/profile/profile";

type Option = { id: string; label: string };
type FormAction = (formData: FormData) => void | Promise<void>;

const GOAL_SYMBOLS: Record<string, HQIconName> = {
  understand_nutrition: "bowl",
  move_more: "motion",
  sleep_better: "moon",
  affordable_meals: "leaf",
  prepare_for_visit: "question",
};

const STEPS = ["About you", "Goals", "Food", "Routine", "Consent"] as const;

const ROUTINE_STEP = 3;

/**
 * One question per screen, with a reason for every question. All steps live
 * in one form so the existing server action receives exactly the same fields.
 */
export function OnboardingFlow({
  action,
  goals,
  error,
}: {
  action: FormAction;
  goals: Option[];
  error?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<string | null>(error ? "Some answers need another look. Start from the top." : null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function go(next: number) {
    setProblem(null);
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function validate(): boolean {
    const form = formRef.current;
    if (!form) return false;
    const data = new FormData(form);
    if (step === 0) {
      const input = form.elements.namedItem("birthDate") as HTMLInputElement;
      if (!input.value) {
        setProblem("Add your birth date to continue.");
        input.focus();
        return false;
      }
    }
    if (step === 1 && data.getAll("goals").length === 0) {
      setProblem("Choose at least one. You can change it any time.");
      return false;
    }
    return true;
  }

  const last = step === STEPS.length - 1;

  return (
    <form ref={formRef} action={action} className="hq-onboard" noValidate={!last}>
      <div className="hq-onboard__progress">
        {step > 0 ? (
          <button type="button" className="hq-icon-btn" onClick={() => go(step - 1)} aria-label="Back">
            <HQIcon name="chevron-left" />
          </button>
        ) : null}
        <HQPath
          size="sm"
          showLabels={false}
          label={`Setup progress: step ${step + 1} of ${STEPS.length}, ${STEPS[step]}`}
          nodes={STEPS.map((name, index) => ({
            state: index < step ? "done" : index === step ? "current" : "todo",
            label: name,
          }))}
        />
        <span className="hq-micro hq-numeric" aria-hidden>
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {problem ? (
        <div role="alert">
          <HQCallout tone="caution">{problem}</HQCallout>
        </div>
      ) : null}

      <Step index={0} step={step} headingRef={headingRef} question="First, when were you born?" why="HealthQuest is for adults 18 and older in the United States. We use your birth date only to confirm that.">
        <label className="hq-field">
          <span className="hq-field__label">Birth date</span>
          <input className="hq-input" type="date" name="birthDate" required autoComplete="bday" />
        </label>
      </Step>

      <Step index={1} step={step} headingRef={headingRef} question="What would you like to work on?" why="Your choices shape which quests and lessons you see first. Nothing is locked in.">
        <div className="hq-onboard__choices">
          {goals.map((goal) => (
            <HQChoice key={goal.id} name="goals" value={goal.id} label={goal.label} icon={GOAL_SYMBOLS[goal.id] ?? "spark"} />
          ))}
        </div>
      </Step>

      <Step index={2} step={step} headingRef={headingRef} question="How should HealthQuest talk about food?" why="Some people find numbers helpful, others don't. You can switch this any time in Settings. Health topics can be added later, after you have started.">
        <div className="hq-onboard__choices">
          <HQChoice type="radio" name="gentleFoodMode" value="off" defaultChecked label="Show nutrition details" hint="Nutrients from USDA data when available" icon="book" />
          <HQChoice type="radio" name="gentleFoodMode" value="on" label="Skip calorie details" hint="No calorie-focused feedback and no food scoring" icon="leaf" />
        </div>
      </Step>

      <Step
        index={ROUTINE_STEP}
        step={step}
        headingRef={headingRef}
        question="A little about your routine"
        why="Optional. It sizes your weekly quests to where you are now, so nobody starts behind. You can change it any time in your health profile."
      >
        <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
          <legend className="hq-field__label" style={{ marginBottom: 4 }}>How often do you move now?</legend>
          {ACTIVITY_BASELINES.map((option) => (
            <HQChoice key={option.id} type="radio" name="activityBaseline" value={option.id} label={option.label} hint={option.hint} />
          ))}
        </fieldset>
        <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
          <legend className="hq-field__label" style={{ margin: "8px 0 4px" }}>How is your grocery budget?</legend>
          {BUDGETS.map((option) => (
            <HQChoice key={option.id} type="radio" name="budget" value={option.id} label={option.label} hint={option.hint} />
          ))}
        </fieldset>
      </Step>

      <Step index={4} step={step} headingRef={headingRef} question="A few agreements before we begin" why="Each one is required so we can store what you log and explain it. You can export or delete your data in Settings.">
        <div className="hq-onboard__choices">
          <HQChoice name="aiConsent" required icon="compass" label="Relevant text I submit to the assistant may be processed by a third-party AI provider." />
          <HQChoice name="healthDataConsent" required icon="shield" label="HealthQuest may store the health and wellness details I choose to enter." />
          <HQChoice name="privacyAccepted" required icon="shield" label="HealthQuest does not sell health data." hint="Our privacy commitment" />
          <HQChoice name="termsAccepted" required icon="book" label="HealthQuest provides education, not medical advice, diagnosis, or treatment." />
        </div>
      </Step>

      <div className="hq-onboard__actions">
        {last ? (
          <HQButton type="submit" variant="primary" trailingIcon="arrow-right">
            Begin my HealthQuest
          </HQButton>
        ) : (
          <HQButton
            type="button"
            variant="primary"
            trailingIcon="arrow-right"
            onClick={() => {
              if (validate()) go(step + 1);
            }}
          >
            Continue
          </HQButton>
        )}
        {step === ROUTINE_STEP ? (
          <HQButton type="button" variant="quiet" onClick={() => go(step + 1)}>
            Skip
          </HQButton>
        ) : null}
      </div>
    </form>
  );
}

function Step({
  index,
  step,
  question,
  why,
  headingRef,
  children,
}: {
  index: number;
  step: number;
  question: string;
  why: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  const active = index === step;
  return (
    <fieldset className="hq-onboard__step" hidden={!active} aria-labelledby={`step-${index}-q`}>
      <h1 className="hq-onboard__question" id={`step-${index}-q`} ref={active ? headingRef : undefined} tabIndex={-1}>
        {question}
      </h1>
      <details className="hq-onboard__why">
        <summary>
          <HQIcon name="info" size={16} />
          Why we ask
        </summary>
        <p style={{ margin: "0 0 4px" }}>{why}</p>
      </details>
      {children}
    </fieldset>
  );
}
