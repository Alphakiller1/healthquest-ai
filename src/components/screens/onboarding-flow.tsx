"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChoice, HQPath } from "@/components/hq/primitives";
import { DETAIL_LEVELS } from "@/lib/experience/depth";
import {
  ACTIVITY_BASELINES,
  BUDGETS,
  EATING_PATTERNS,
  SLEEP_TYPICAL,
  SMOKING,
  movementTarget,
  sleepNightsTarget,
  type HealthProfile,
} from "@/lib/profile/profile";

type Option = { id: string; label: string };
type ContextOption = Option & { educationOnly: boolean };
type FormAction = (formData: FormData) => void | Promise<void>;
type Mode = "quick" | "full";

type StepId = "welcome" | "age" | "goals" | "move" | "sleep" | "food" | "topics" | "family" | "smoking" | "detail" | "review";

const STEP_NAMES: Record<StepId, string> = {
  welcome: "Welcome",
  age: "About you",
  goals: "Focus",
  move: "Movement",
  sleep: "Sleep",
  food: "Food",
  topics: "Health topics",
  family: "Family history",
  smoking: "Smoking",
  detail: "Detail",
  review: "Review",
};

const OPTIONAL: ReadonlySet<StepId> = new Set(["move", "sleep", "food", "topics", "family", "smoking", "detail"]);

const GOAL_SYMBOLS: Record<string, HQIconName> = {
  understand_nutrition: "bowl",
  move_more: "motion",
  sleep_better: "moon",
  affordable_meals: "leaf",
  prepare_for_visit: "question",
};

function pathFor(mode: Mode | null): StepId[] {
  if (mode === "full") return ["welcome", "age", "goals", "move", "sleep", "food", "topics", "family", "smoking", "detail", "review"];
  return ["welcome", "age", "goals", "review"];
}

function ageOn(birthDate: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const tm = today.getMonth() + 1;
  const td = today.getDate();
  return today.getFullYear() - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

type Summary = {
  goals: string[];
  moveGoal: number;
  sleepNights: number;
  budget?: string;
  eating: string[];
  gentle: boolean;
  topics: string[];
  educationOnly: boolean;
  family: number;
  detail: string;
};

/**
 * Onboarding is where people build the profile that shapes everything else.
 * One question per screen, each with why it's asked and what it changes.
 * Quick start takes a minute; "Make it mine" takes about four. Everything
 * beyond age, focus, and consent can be skipped, and a skipped step is removed
 * from the form so it saves nothing. A review shows the effect before anything
 * is stored.
 */
export function OnboardingFlow({
  action,
  goals,
  contexts,
  family,
  error,
}: {
  action: FormAction;
  goals: Option[];
  contexts: ContextOption[];
  family: Option[];
  error?: boolean;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<Set<StepId>>(new Set());
  const [problem, setProblem] = useState<string | null>(error ? "Some answers need another look. Please check them and try again." : null);
  const [tooYoung, setTooYoung] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [edHistory, setEdHistory] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  /** Set when a step was opened from the review's Edit link: Continue goes back to the review. */
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const path = useMemo(() => pathFor(mode), [mode]);
  const step = path[index];
  const contextById = useMemo(() => new Map(contexts.map((context) => [context.id, context])), [contexts]);
  const goalLabels = useMemo(() => new Map(goals.map((goal) => [goal.id, goal.label])), [goals]);

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function go(next: number) {
    setProblem(null);
    const target = path[next];
    // Arriving on a skipped step (Back, or after an edit) brings it back, empty, rather than a blank screen.
    if (skipped.has(target)) {
      setSkipped((current) => {
        const copy = new Set(current);
        copy.delete(target);
        return copy;
      });
    }
    if (target === "review") {
      setSummary(readSummary());
      setEditing(false);
    }
    setIndex(next);
    focusHeading();
  }

  const reviewIndex = path.indexOf("review");

  function choose(nextMode: Mode) {
    setMode(nextMode);
    setIndex(1);
    focusHeading();
  }

  function jumpTo(id: StepId) {
    const target = path.indexOf(id);
    if (target < 0) return;
    setSkipped((current) => {
      const copy = new Set(current);
      copy.delete(id);
      return copy;
    });
    setProblem(null);
    setEditing(true);
    setIndex(target);
    focusHeading();
  }

  function skip() {
    setSkipped((current) => new Set(current).add(step));
    go(editing ? reviewIndex : index + 1);
  }

  function readSummary(): Summary {
    const data = formRef.current ? new FormData(formRef.current) : new FormData();
    const profile: HealthProfile = {
      activityBaseline: (data.get("activityBaseline") as HealthProfile["activityBaseline"]) || undefined,
      weeklyMovementGoal: data.get("weeklyMovementGoal") ? Number(data.get("weeklyMovementGoal")) : undefined,
      sleepTypical: (data.get("sleepTypical") as HealthProfile["sleepTypical"]) || undefined,
    };
    const topicIds = data.getAll("contexts").map(String);
    return {
      goals: data.getAll("goals").map((id) => goalLabels.get(String(id)) ?? String(id)),
      moveGoal: movementTarget(profile),
      sleepNights: sleepNightsTarget(profile),
      budget: BUDGETS.find((item) => item.id === data.get("budget"))?.label,
      eating: data.getAll("eatingPatterns").map((id) => EATING_PATTERNS.find((item) => item.id === id)?.label ?? String(id)),
      gentle: data.get("gentleFoodMode") === "on" || topicIds.includes("eating_disorder_history"),
      topics: topicIds.map((id) => contextById.get(id)?.label ?? id),
      educationOnly: topicIds.some((id) => contextById.get(id)?.educationOnly),
      family: data.getAll("familyHistory").length,
      detail: DETAIL_LEVELS.find((item) => item.id === (data.get("detailLevel") || "auto"))?.label ?? "Grow with me",
    };
  }

  function next() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    if (step === "age") {
      const input = form.elements.namedItem("birthDate") as HTMLInputElement;
      const age = ageOn(input.value);
      if (age === null) {
        setProblem("Add your birth date to continue.");
        input.focus();
        return;
      }
      if (age < 18) {
        // Stop here: nothing else is asked. The server enforces this too.
        setTooYoung(true);
        focusHeading();
        return;
      }
      if (age > 120) {
        setProblem("Check the year in your birth date.");
        input.focus();
        return;
      }
    }
    if (step === "goals" && data.getAll("goals").length === 0) {
      setProblem("Choose at least one. You can change it any time.");
      return;
    }
    go(editing ? reviewIndex : index + 1);
  }

  const mounted = (id: StepId) => path.includes(id) && !skipped.has(id);
  const suggestedGoal = ACTIVITY_BASELINES.find((item) => item.id === baseline)?.target ?? 1;
  const shownGoal = weeklyGoal ?? suggestedGoal;

  if (tooYoung) {
    return (
      <div className="hq-onboard">
        <h1 className="hq-onboard__question" ref={headingRef} tabIndex={-1}>
          HealthQuest is for adults
        </h1>
        <p className="hq-secondary">
          This version is for people 18 and older in the United States. Nothing you entered has been saved.
        </p>
        <p className="hq-secondary">
          If you have questions about your health, a parent, school nurse, or doctor is a good person to ask. If you ever
          feel unsafe, you can call or text <a href="tel:988">988</a>.
        </p>
        <Link href="/" className="hq-btn">
          Back to the start
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="hq-onboard" noValidate={step !== "review"}>
      {step !== "welcome" ? (
        <div className="hq-onboard__progress">
          <button type="button" className="hq-icon-btn" onClick={() => go(index - 1)} aria-label="Back">
            <HQIcon name="chevron-left" />
          </button>
          <HQPath
            size="sm"
            showLabels={false}
            label={`Step ${index} of ${path.length - 1}: ${STEP_NAMES[step]}`}
            nodes={path.slice(1).map((id, position) => ({
              state: position + 1 < index ? (skipped.has(id) ? "rest" : "done") : position + 1 === index ? "current" : "todo",
              label: STEP_NAMES[id],
            }))}
          />
          <span className="hq-micro hq-numeric" aria-hidden>
            {index}/{path.length - 1}
          </span>
        </div>
      ) : null}

      {problem ? (
        <div role="alert">
          <HQCallout tone="caution">{problem}</HQCallout>
        </div>
      ) : null}

      <Step id="welcome" current={step} headingRef={headingRef} question="Let's set up HealthQuest for you">
        <p className="hq-secondary" style={{ margin: 0 }}>
          HealthQuest helps you understand food, movement, sleep, and everyday habits — in plain language, from reviewed
          public-health sources. It doesn&rsquo;t diagnose or replace your doctor.
        </p>
        <ul className="hq-onboard__promises">
          <li>
            <HQIcon name="shield" size={18} />
            <span>You choose what to share. Almost every question can be skipped.</span>
          </li>
          <li>
            <HQIcon name="leaf" size={18} />
            <span>Your answers shape what you see — never a score or a grade.</span>
          </li>
          <li>
            <HQIcon name="book" size={18} />
            <span>Your data isn&rsquo;t sold. You can see, export, or delete it any time.</span>
          </li>
        </ul>
        <p className="hq-micro" style={{ margin: 0 }}>
          Want bigger text? Tap <strong>Aa</strong> at the top of the screen.
        </p>
        <div className="hq-stack" style={{ gap: 10 }}>
          <span className="hq-label">How much would you like to set up now?</span>
          <button type="button" className="hq-move-option" onClick={() => choose("full")}>
            <span className="hq-move-option__name">Make it mine · about 4 minutes</span>
            <span className="hq-micro">A few more questions so quests, lessons, and answers fit you from day one.</span>
            <HQIcon name="arrow-right" size={18} />
          </button>
          <button type="button" className="hq-move-option" onClick={() => choose("quick")}>
            <span className="hq-move-option__name">Quick start · about 1 minute</span>
            <span className="hq-micro">Just the essentials. Add more whenever you like.</span>
            <HQIcon name="arrow-right" size={18} />
          </button>
        </div>
      </Step>

      <Step
        id="age"
        current={step}
        headingRef={headingRef}
        question="When were you born?"
        why="HealthQuest is for adults 18 and older in the United States. Your birth date is used only to confirm that."
        changes="Nothing else. It isn't used to personalize anything."
      >
        <label className="hq-field">
          <span className="hq-field__label">Birth date</span>
          <input className="hq-input" type="date" name="birthDate" required autoComplete="bday" />
        </label>
      </Step>

      <Step
        id="goals"
        current={step}
        headingRef={headingRef}
        question="What would you like to work on?"
        why="So the first quests, lessons, and suggestions are about what matters to you."
        changes="The order of your quests, lessons, and suggested questions. Choose as many as you like."
      >
        <div className="hq-onboard__choices">
          {goals.map((goal) => (
            <HQChoice key={goal.id} name="goals" value={goal.id} label={goal.label} icon={GOAL_SYMBOLS[goal.id] ?? "spark"} />
          ))}
        </div>
      </Step>

      {mounted("move") ? (
        <Step
          id="move"
          current={step}
          headingRef={headingRef}
          question="How often do you move now?"
          why="So your weekly movement goal starts where you are. Nobody starts behind."
          changes="Your weekly movement quest. You can change the goal any week."
        >
          <div className="hq-onboard__choices">
            {ACTIVITY_BASELINES.map((option) => (
              <label key={option.id} className="hq-choice">
                <HQIcon name="motion" />
                <span className="hq-choice__label">
                  {option.label}
                  <span className="hq-choice__hint">{option.hint}</span>
                </span>
                <input
                  type="radio"
                  name="activityBaseline"
                  value={option.id}
                  onChange={() => {
                    setBaseline(option.id);
                    setWeeklyGoal(null);
                  }}
                />
              </label>
            ))}
          </div>
          {baseline ? (
            <fieldset className="hq-segment">
              <legend>Your weekly goal: sessions of any movement</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input type="radio" name="weeklyMovementGoal" value={n} checked={shownGoal === n} onChange={() => setWeeklyGoal(n)} />
                  {n}
                </label>
              ))}
            </fieldset>
          ) : null}
        </Step>
      ) : null}

      {mounted("sleep") ? (
        <Step
          id="sleep"
          current={step}
          headingRef={headingRef}
          question="How much do you usually sleep?"
          why="Sleep notes are more useful when they start from your usual pattern."
          changes="Short or uneven sleep makes the sleep quest a little longer and moves sleep lessons up."
        >
          <div className="hq-onboard__choices">
            {SLEEP_TYPICAL.map((option) => (
              <HQChoice key={option.id} type="radio" name="sleepTypical" value={option.id} label={option.label} icon="moon" />
            ))}
          </div>
        </Step>
      ) : null}

      {mounted("food") ? (
        <Step
          id="food"
          current={step}
          headingRef={headingRef}
          question="A few things about food"
          why="So food tips fit your budget and what you eat, and so food talk feels comfortable for you."
          changes="Which food tips come first, which foods are left out, and whether calories are ever mentioned."
        >
          <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
            <legend className="hq-field__label" style={{ marginBottom: 4 }}>
              How is your grocery budget?
            </legend>
            {BUDGETS.map((option) => (
              <HQChoice key={option.id} type="radio" name="budget" value={option.id} label={option.label} hint={option.hint} />
            ))}
          </fieldset>
          <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
            <legend className="hq-field__label" style={{ margin: "8px 0 4px" }}>
              Anything you don&rsquo;t eat? (optional)
            </legend>
            {EATING_PATTERNS.map((option) => (
              <HQChoice key={option.id} name="eatingPatterns" value={option.id} label={option.label} />
            ))}
          </fieldset>
          <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
            <legend className="hq-field__label" style={{ margin: "8px 0 4px" }}>
              How should HealthQuest talk about food?
            </legend>
            <HQChoice type="radio" name="gentleFoodMode" value="off" label="Show nutrition details" hint="Nutrients from USDA data when available" icon="book" />
            <HQChoice type="radio" name="gentleFoodMode" value="on" label="Gentle Food Mode" hint="No calorie or weight talk, no food scoring" icon="leaf" />
          </fieldset>
        </Step>
      ) : null}

      {mounted("topics") ? (
        <Step
          id="topics"
          current={step}
          headingRef={headingRef}
          question="Is there anything you'd like HealthQuest to keep in mind?"
          why="Some topics get more relevant lessons. Others are complex enough that HealthQuest keeps to general education, so it never oversteps. Choosing none is completely fine."
          changes="Which lessons and answers you see first, and how personal HealthQuest's suggestions are."
        >
          <div className="hq-onboard__choices">
            {contexts.map((context) => (
              <label key={context.id} className="hq-choice">
                <span aria-hidden />
                <span className="hq-choice__label">
                  {context.label}
                  {context.educationOnly ? <span className="hq-choice__hint">General education only</span> : null}
                </span>
                <input
                  type="checkbox"
                  name="contexts"
                  value={context.id}
                  onChange={(event) => {
                    if (context.id === "eating_disorder_history") setEdHistory(event.target.checked);
                  }}
                />
              </label>
            ))}
          </div>
          {edHistory ? (
            <HQCallout tone="neutral" icon="leaf">
              Thank you for telling us. Gentle Food Mode will stay on: no calorie or weight talk, no food scoring, and food
              tips stay general.
            </HQCallout>
          ) : null}
        </Step>
      ) : null}

      {mounted("family") ? (
        <Step
          id="family"
          current={step}
          headingRef={headingRef}
          question="Any of these in close biological relatives?"
          why="Family history is useful context to bring to a clinician. HealthQuest never turns it into a risk number."
          changes="Family-history lessons come first. Only the category is stored, never anyone's name."
        >
          <div className="hq-onboard__choices">
            {family.map((item) => (
              <HQChoice key={item.id} name="familyHistory" value={item.id} label={item.label} icon="heart" />
            ))}
          </div>
        </Step>
      ) : null}

      {mounted("smoking") ? (
        <Step
          id="smoking"
          current={step}
          headingRef={headingRef}
          question="Do you smoke?"
          why="It's one of the health factors people can influence."
          changes="It appears in My Health Factors. Nothing else uses it."
        >
          <div className="hq-onboard__choices">
            {SMOKING.map((option) => (
              <HQChoice key={option.id} type="radio" name="smoking" value={option.id} label={option.label} />
            ))}
          </div>
        </Step>
      ) : null}

      {mounted("detail") ? (
        <Step
          id="detail"
          current={step}
          headingRef={headingRef}
          question="How would you like things explained?"
          why="Some people want the key point; others want every number. Both are welcome here."
          changes="How much opens up on each screen. You can always tap to see more."
        >
          <div className="hq-onboard__choices">
            {DETAIL_LEVELS.map((option) => (
              <HQChoice
                key={option.id}
                type="radio"
                name="detailLevel"
                value={option.id}
                label={option.label}
                hint={option.hint}
                defaultChecked={option.id === "auto"}
              />
            ))}
          </div>
        </Step>
      ) : null}

      <Step id="review" current={step} headingRef={headingRef} question="Here's how HealthQuest will work for you">
        {summary ? (
          <ul className="hq-onboard__review">
            <ReviewRow icon="spark" label="Focus" value={summary.goals.join(", ") || "Not set"} onEdit={() => jumpTo("goals")} />
            {mode === "full" ? (
              <>
                <ReviewRow
                  icon="motion"
                  label="Movement quest"
                  value={`${summary.moveGoal} ${summary.moveGoal === 1 ? "session" : "sessions"} a week`}
                  onEdit={() => jumpTo("move")}
                />
                <ReviewRow icon="moon" label="Sleep quest" value={`${summary.sleepNights} nights of notes`} onEdit={() => jumpTo("sleep")} />
                <ReviewRow
                  icon="bowl"
                  label="Food"
                  value={
                    [summary.budget ? `${summary.budget} budget` : null, summary.eating.join(", ") || null, summary.gentle ? "Gentle Food Mode" : null]
                      .filter(Boolean)
                      .join(" · ") || "Not set"
                  }
                  onEdit={() => jumpTo("food")}
                />
                <ReviewRow
                  icon="leaf"
                  label="Health topics"
                  value={summary.topics.length ? `${summary.topics.join(", ")}${summary.educationOnly ? " (general education)" : ""}` : "None, so lessons stay general"}
                  onEdit={() => jumpTo("topics")}
                />
                <ReviewRow icon="heart" label="Family history" value={summary.family ? `${summary.family} noted` : "Not set"} onEdit={() => jumpTo("family")} />
                <ReviewRow icon="book" label="Detail" value={summary.detail} onEdit={() => jumpTo("detail")} />
              </>
            ) : (
              <li className="hq-micro" style={{ padding: "8px 0" }}>
                You can add movement, sleep, food, and more any time in <strong>You → Health profile</strong>.
              </li>
            )}
          </ul>
        ) : null}

        <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
          <legend className="hq-field__label" style={{ marginBottom: 4 }}>
            Before we begin, please agree to these
          </legend>
          <HQChoice name="aiConsent" required icon="compass" label="Relevant text I submit to the assistant may be processed by a third-party AI provider." />
          <HQChoice name="healthDataConsent" required icon="shield" label="HealthQuest may store the health and wellness details I choose to enter." />
          <HQChoice name="privacyAccepted" required icon="shield" label="HealthQuest does not sell health data." hint="Our privacy commitment" />
          <HQChoice name="termsAccepted" required icon="book" label="HealthQuest provides education, not medical advice, diagnosis, or treatment." />
        </fieldset>
      </Step>

      {step !== "welcome" ? (
        <div className="hq-onboard__actions">
          {step === "review" ? (
            <HQButton type="submit" variant="primary" trailingIcon="arrow-right">
              Begin my HealthQuest
            </HQButton>
          ) : (
            <HQButton type="button" variant="primary" trailingIcon={editing ? "check" : "arrow-right"} onClick={next}>
              {editing ? "Back to review" : "Continue"}
            </HQButton>
          )}
          {OPTIONAL.has(step) ? (
            <HQButton type="button" variant="quiet" onClick={skip}>
              Skip
            </HQButton>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function Step({
  id,
  current,
  question,
  why,
  changes,
  headingRef,
  children,
}: {
  id: StepId;
  current: StepId;
  question: string;
  why?: string;
  changes?: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  const active = id === current;
  return (
    <fieldset className="hq-onboard__step" hidden={!active} aria-labelledby={`step-${id}-q`}>
      <h1 className="hq-onboard__question" id={`step-${id}-q`} ref={active ? headingRef : undefined} tabIndex={-1}>
        {question}
      </h1>
      {why || changes ? (
        <details className="hq-onboard__why">
          <summary>
            <HQIcon name="info" size={16} />
            Why we ask
          </summary>
          {why ? <p style={{ margin: "0 0 6px" }}>{why}</p> : null}
          {changes ? (
            <p style={{ margin: "0 0 4px" }}>
              <strong>What this changes:</strong> {changes}
            </p>
          ) : null}
        </details>
      ) : null}
      {children}
    </fieldset>
  );
}

function ReviewRow({ icon, label, value, onEdit }: { icon: HQIconName; label: string; value: string; onEdit: () => void }) {
  return (
    <li className="hq-onboard__review-row">
      <HQIcon name={icon} size={18} />
      <span>
        <span className="hq-micro" style={{ display: "block" }}>
          {label}
        </span>
        <span className="hq-onboard__review-value">{value}</span>
      </span>
      <HQButton type="button" variant="quiet" size="sm" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}>
        Edit
      </HQButton>
    </li>
  );
}
