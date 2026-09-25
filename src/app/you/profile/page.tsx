import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChoice } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { HEALTH_CONTEXTS, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { profileTopics } from "@/lib/profile/personalize";
import {
  ACTIVITY_BASELINES,
  BUDGETS,
  EATING_PATTERNS,
  SLEEP_TYPICAL,
  SMOKING,
  movementTarget,
  sleepNightsTarget,
} from "@/lib/profile/profile";
import { saveProfile } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Health profile · HealthQuest" };

const GOAL_ICONS: Record<string, HQIconName> = {
  understand_nutrition: "bowl",
  move_more: "motion",
  sleep_better: "moon",
  affordable_meals: "leaf",
  prepare_for_visit: "question",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const profile = user.profile ?? {};
  const contexts = user.healthContextIds ?? [];
  const gentleLocked = shouldRecommendGentleFoodMode(contexts);
  const topics = profileTopics(user).slice(0, 4);
  const moveGoal = movementTarget(user.profile);
  // Open only the first unanswered core question; everything else waits for a tap.
  const firstOpen =
    ([
      ["focus", user.goals.length > 0],
      ["activity", Boolean(profile.activityBaseline)],
      ["sleep", Boolean(profile.sleepTypical)],
      ["budget", Boolean(profile.budget)],
    ] as const).find(([, answered]) => !answered)?.[0] ?? null;

  return (
    <main className="hq-main">
      <div className="hq-settings">
        <header className="hq-page-head">
          <Link href="/you" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> You
          </Link>
          <h1 className="hq-title">Your health profile</h1>
          <p className="hq-secondary">
            Everything here is optional and shapes what HealthQuest shows you. It never becomes a score, and you can
            change or clear it any time.
          </p>
        </header>

        {params.saved ? (
          <div role="status">
            <HQCallout tone="positive" title="Profile saved">
              Your quests, lessons, and answers now follow these choices.
            </HQCallout>
          </div>
        ) : null}

        <section className="hq-surface hq-surface--accent hq-stack" aria-labelledby="shaping" style={{ gap: 10 }}>
          <h2 id="shaping" className="hq-section-title" style={{ margin: 0 }}>
            Your profile is shaping
          </h2>
          <ul className="hq-stack" style={{ gap: 8, margin: 0, paddingLeft: 0, listStyle: "none" }}>
            <Effect icon="motion">
              Movement quest: {moveGoal} {moveGoal === 1 ? "session" : "sessions"} a week
            </Effect>
            <Effect icon="moon">Sleep quest: {sleepNightsTarget(user.profile)} nights of notes</Effect>
            {topics.length > 0 ? (
              topics.map((topic) => (
                <Effect key={topic.topic} icon="spark">
                  <strong style={{ textTransform: "capitalize" }}>{topic.topic}</strong> comes first in lessons and answers, because {topic.reason}
                </Effect>
              ))
            ) : (
              <Effect icon="spark">Lessons and answers stay general until you choose a focus below.</Effect>
            )}
          </ul>
        </section>

        <form action={saveProfile} className="hq-stack" style={{ gap: 0 }}>
          <Section firstOpen={firstOpen}
            id="focus"
            current={GOAL_OPTIONS.filter((goal) => user.goals.includes(goal.id)).length ? `${user.goals.length} chosen` : undefined}
            title="What would you like to work on?"
            changes="Orders your quests, lessons, and suggested questions."
          >
            {params.error === "goals" ? (
              <div role="alert">
                <HQCallout tone="caution">Keep at least one focus.</HQCallout>
              </div>
            ) : null}
            {GOAL_OPTIONS.map((goal) => (
              <HQChoice
                key={goal.id}
                name="goals"
                value={goal.id}
                label={goal.label}
                icon={GOAL_ICONS[goal.id]}
                defaultChecked={user.goals.includes(goal.id)}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen}
            id="activity"
            current={ACTIVITY_BASELINES.find((item) => item.id === profile.activityBaseline)?.label ? `${ACTIVITY_BASELINES.find((item) => item.id === profile.activityBaseline)?.label} · ${moveGoal}/week` : undefined}
            title="How often do you move now?"
            changes="Sizes your weekly movement quest to where you are — no one is behind."
          >
            {ACTIVITY_BASELINES.map((option) => (
              <HQChoice
                key={option.id}
                type="radio"
                name="activityBaseline"
                value={option.id}
                label={option.label}
                hint={option.hint}
                defaultChecked={profile.activityBaseline === option.id}
              />
            ))}
            <fieldset className="hq-segment" style={{ marginTop: 8 }}>
              <legend>Your weekly movement goal</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input type="radio" name="weeklyMovementGoal" value={n} defaultChecked={moveGoal === n} />
                  {n}
                </label>
              ))}
            </fieldset>
            <p className="hq-micro" style={{ margin: 0 }}>
              Sessions a week. Choose what feels doable — you can change it any week.
            </p>
          </Section>

          <Section firstOpen={firstOpen} id="sleep" current={SLEEP_TYPICAL.find((item) => item.id === profile.sleepTypical)?.label} title="How much do you usually sleep?" changes="Short or uneven sleep makes the sleep quest a little longer and moves sleep lessons up.">
            {SLEEP_TYPICAL.map((option) => (
              <HQChoice
                key={option.id}
                type="radio"
                name="sleepTypical"
                value={option.id}
                label={option.label}
                defaultChecked={profile.sleepTypical === option.id}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen} id="budget" current={BUDGETS.find((item) => item.id === profile.budget)?.label} title="How is your grocery budget?" changes="A tighter budget puts affordable meals first in quests, lessons, and answers.">
            {BUDGETS.map((option) => (
              <HQChoice
                key={option.id}
                type="radio"
                name="budget"
                value={option.id}
                label={option.label}
                hint={option.hint}
                defaultChecked={profile.budget === option.id}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen} id="eating" current={profile.eatingPatterns?.length ? profile.eatingPatterns.map((id) => EATING_PATTERNS.find((item) => item.id === id)?.label).join(", ") : profile.updatedAt ? "No restrictions" : undefined} title="Anything you don't eat?" changes="Answers leave out foods you don't eat.">
            {EATING_PATTERNS.map((option) => (
              <HQChoice
                key={option.id}
                name="eatingPatterns"
                value={option.id}
                label={option.label}
                defaultChecked={profile.eatingPatterns?.includes(option.id)}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen}
            id="topics"
            current={contexts.length ? `${contexts.length} chosen` : profile.updatedAt ? "None chosen" : undefined}
            title="Health topics you'd like HealthQuest to keep in mind"
            changes="Shapes which lessons and answers you see. Some topics get general education only, so HealthQuest never oversteps."
          >
            {HEALTH_CONTEXTS.map((context) => (
              <HQChoice
                key={context.id}
                name="contexts"
                value={context.id}
                label={context.label}
                hint={context.mode === "education_only" ? "General education only" : undefined}
                defaultChecked={contexts.includes(context.id)}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen} id="smoking" current={SMOKING.find((item) => item.id === profile.smoking)?.label} title="Do you smoke?" changes="Shown in My Health Factors as something you can influence. Nothing else uses it.">
            {SMOKING.map((option) => (
              <HQChoice
                key={option.id}
                type="radio"
                name="smoking"
                value={option.id}
                label={option.label}
                defaultChecked={profile.smoking === option.id}
              />
            ))}
          </Section>

          <Section firstOpen={firstOpen} id="reading" current={[user.gentleFoodMode || gentleLocked ? "Gentle Food Mode" : null, user.plainLanguage ? "Plain language" : null].filter(Boolean).join(", ") || (profile.updatedAt ? "Standard" : undefined)} title="How should HealthQuest talk to you?" changes="Changes how lessons and food notes are written.">
            <HQChoice
              name="gentleFoodMode"
              label="Gentle Food Mode"
              hint={gentleLocked ? "Stays on for a topic you chose" : "No calorie or weight talk, no food scoring"}
              icon="leaf"
              defaultChecked={user.gentleFoodMode || gentleLocked}
            />
            <HQChoice
              name="plainLanguage"
              label="Plain language first"
              hint="Lessons lead with the takeaway"
              icon="book"
              defaultChecked={user.plainLanguage === true}
            />
          </Section>

          <div className="hq-profile-save">
            <HQButton type="submit" variant="primary" icon="check">
              Save profile
            </HQButton>
          </div>
        </form>

        <p className="hq-micro" style={{ margin: 0 }}>
          Your profile is stored with your account, included in your data export, and deleted with your account. It is
          never sold or used for ads. Family history lives in{" "}
          <Link href="/health-factors">My health factors</Link>.
        </p>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  changes,
  current,
  firstOpen,
  children,
}: {
  firstOpen: string | null;
  id: string;
  title: string;
  changes: string;
  /** The saved answer, shown on the closed header. */
  current?: string;
  children: ReactNode;
}) {
  return (
    <details id={id} className="hq-profile-section" open={id === firstOpen}>
      <summary>
        <span className="hq-profile-section__title">{title}</span>
        <span className="hq-profile-section__current">{current ?? "Not set"}</span>
        <HQIcon name="chevron-right" size={18} />
      </summary>
      <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
        <legend className="hq-sr-only">{title}</legend>
        <p className="hq-micro hq-cluster" style={{ margin: "0 0 4px", gap: 6, flexWrap: "nowrap", alignItems: "flex-start" }}>
          <HQIcon name="info" size={14} />
          {changes}
        </p>
        {children}
      </fieldset>
    </details>
  );
}

function Effect({ icon, children }: { icon: HQIconName; children: ReactNode }) {
  return (
    <li className="hq-cluster" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
      <span style={{ color: "var(--hq-brand-ink)", marginTop: 2 }}>
        <HQIcon name={icon} size={18} />
      </span>
      <span className="hq-secondary" style={{ margin: 0 }}>
        {children}
      </span>
    </li>
  );
}
