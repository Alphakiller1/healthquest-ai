import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HQGlyph, type HQIconName } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChoice, HQSection } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { usCalendarDate } from "@/lib/health/calendar";
import { FAMILY_HISTORY_CATEGORIES } from "@/lib/health/family-history";
import { HEALTH_CONTEXTS, resolveCoachingMode } from "@/lib/health/contexts";
import { wellnessLog } from "@/lib/health/trends";
import { ACTIVITY_BASELINES, EATING_PATTERNS, SLEEP_TYPICAL } from "@/lib/profile/profile";
import { weeklyReflection } from "@/lib/profile/personalize";
import { saveFamilyHistory } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My health factors · HealthQuest" };

function ageFrom(birthDate: string | null, today: string): number | null {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export default async function HealthFactorsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const store = await getDemoStore();
  const today = usCalendarDate(new Date().toISOString());
  const profile = user.profile ?? {};
  const week = weeklyReflection(store, user, today);
  const age = ageFrom(user.birthDate, today);
  const history = new Set(user.familyHistoryCategories ?? []);
  const contexts = HEALTH_CONTEXTS.filter((context) => (user.healthContextIds ?? []).includes(context.id));
  const educationOnly = resolveCoachingMode(user.healthContextIds ?? []) === "education_only";
  const days = wellnessLog({
    today,
    meals: store.listMeals(user.id),
    activities: store.listActivities(user.id),
    habits: store.listHabits(user.id),
  });
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const label = <T extends { id: string; label: string }>(list: readonly T[], id?: string) => list.find((item) => item.id === id)?.label;

  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 36, maxWidth: "42rem" }}>
        <header className="hq-page-head">
          <p className="hq-label">You</p>
          <h1 className="hq-title">My health factors</h1>
          <p className="hq-secondary">
            What shapes health, and what you&rsquo;ve logged. No risk estimate, no health score, no prediction — those need
            a clinician and a validated tool.
          </p>
        </header>

        <HQSection title="Things you can influence" id="influence">
          <ul className="hq-log-list">
            <Factor icon="motion" tone="brand" title="Movement" learn="/learn/activity">
              {label(ACTIVITY_BASELINES, profile.activityBaseline)
                ? `You said you move ${label(ACTIVITY_BASELINES, profile.activityBaseline)?.toLowerCase()}. `
                : ""}
              {week.movementSessions > 0
                ? `This week: ${week.movementSessions} ${week.movementSessions === 1 ? "session" : "sessions"}, ${week.movementMinutes} minutes.`
                : "No movement logged this week yet."}
            </Factor>
            <Factor icon="moon" tone="night" title="Sleep" learn="/learn/sleep">
              {label(SLEEP_TYPICAL, profile.sleepTypical) ? `Usually ${label(SLEEP_TYPICAL, profile.sleepTypical)?.toLowerCase()}. ` : ""}
              {week.averageSleep !== null
                ? `This week you noted ${week.sleepNights} ${week.sleepNights === 1 ? "night" : "nights"}, averaging ${week.averageSleep} hours.`
                : "No sleep notes this week yet."}
            </Factor>
            <Factor icon="bowl" tone="sun" title="Eating patterns" learn="/learn/food-labels">
              {profile.eatingPatterns?.length
                ? `${profile.eatingPatterns.map((id) => label(EATING_PATTERNS, id)).join(", ")}. `
                : ""}
              {user.gentleFoodMode ? "Gentle Food Mode is on, so meal notes skip calorie talk. " : ""}
              Labels show saturated fat, sodium, and fiber for one serving.
            </Factor>
            <Factor icon="leaf" title="Smoking">
              {profile.smoking === "current"
                ? "You said you smoke now. It's one of the factors you can influence, and a clinician can talk through options with you."
                : profile.smoking === "former"
                  ? "You said you used to smoke. That's worth mentioning at checkups."
                  : profile.smoking === "never"
                    ? "You said you've never smoked."
                    : "Smoking is a factor people can influence, if it applies to you."}
            </Factor>
          </ul>
          <Link className="hq-section__action" href="/you/profile">
            Update these in your health profile
          </Link>
        </HQSection>

        <HQSection title="Things you can't change" id="fixed">
          <ul className="hq-log-list">
            <Factor icon="sun" title="Age">
              {age !== null ? `${age}. ` : ""}Age is part of how clinicians think about health; it isn&rsquo;t something to fix.
            </Factor>
            <Factor icon="heart" title="Family history" learn="/learn/family-history">
              {history.size > 0
                ? `You noted ${history.size} ${history.size === 1 ? "category" : "categories"}. It's context for a clinician, not a prediction.`
                : "Optional. A note of conditions in close relatives helps at a visit."}
            </Factor>
          </ul>

          <details className="hq-profile-section" open={params.saved === "1"}>
            <summary>
              <span className="hq-profile-section__title">Family history note</span>
              <span className="hq-profile-section__current">{history.size ? `${history.size} noted` : "Not set"}</span>
            </summary>
            <form action={saveFamilyHistory} className="hq-stack" style={{ gap: 8, paddingBottom: 20 }}>
              <p className="hq-micro" style={{ margin: 0 }}>
                Categories only — relatives&rsquo; names are never stored, and it never becomes a percentage.
              </p>
              {params.saved === "1" ? (
                <div role="status">
                  <HQCallout tone="positive">Saved.</HQCallout>
                </div>
              ) : null}
              {FAMILY_HISTORY_CATEGORIES.map((category) => (
                <HQChoice key={category.id} name="categories" value={category.id} label={category.label} defaultChecked={history.has(category.id)} />
              ))}
              <HQButton type="submit" variant="primary" icon="check">
                Save family history note
              </HQButton>
            </form>
          </details>
        </HQSection>

        <HQSection title="Topics you're exploring" id="topics">
          {contexts.length === 0 ? (
            <p className="hq-secondary" style={{ margin: 0 }}>
              None chosen. Lessons and answers stay general.
            </p>
          ) : (
            <div className="hq-cluster">
              {contexts.map((context) => (
                <span key={context.id} className="hq-chip" data-tone={context.mode === "education_only" ? "info" : "brand"}>
                  {context.label}
                </span>
              ))}
            </div>
          )}
          {educationOnly ? (
            <p className="hq-micro" style={{ margin: 0 }}>
              One of these keeps HealthQuest to general education, so it never builds a plan around it.
            </p>
          ) : null}
          <Link className="hq-section__action" href="/you/profile#topics">
            Change topics
          </Link>
        </HQSection>

        <HQSection title="The last 7 days" id="log">
          <p className="hq-micro" style={{ margin: 0 }}>
            Counts of what you entered. An empty day just means nothing was logged — it isn&rsquo;t a grade.
          </p>
          <ul className="hq-log-list" aria-label="Meals, movement, and sleep logged in the last 7 days">
            {[...days].reverse().map((day) => (
              <li key={day.date} className="hq-log-item" style={{ gridTemplateColumns: "6.5rem 1fr" }}>
                <span className="hq-label">{dayLabel.format(new Date(`${day.date}T12:00:00Z`))}</span>
                <span className="hq-secondary" style={{ margin: 0 }}>
                  {[
                    day.meals ? `${day.meals} ${day.meals === 1 ? "meal" : "meals"}` : null,
                    day.movementMinutes ? `${day.movementMinutes} min moving` : null,
                    day.sleepHours !== null ? `${day.sleepHours} h sleep` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        </HQSection>

        <p className="hq-micro" style={{ margin: 0 }}>
          Clinicians use validated tools, such as the ASCVD risk estimator, that need lab results and measurements.
          HealthQuest doesn&rsquo;t run them, so it never shows you a risk number.
        </p>
      </div>
    </main>
  );
}

function Factor({
  icon,
  tone,
  title,
  learn,
  children,
}: {
  icon: HQIconName;
  tone?: "brand" | "sun" | "night";
  title: string;
  learn?: string;
  children: ReactNode;
}) {
  return (
    <li className="hq-log-item" style={{ alignItems: "start", gridTemplateColumns: "auto 1fr" }}>
      <HQGlyph name={icon} tone={tone} />
      <span className="hq-stack" style={{ gap: 2 }}>
        <span className="hq-log-item__title">{title}</span>
        <span className="hq-secondary" style={{ margin: 0 }}>
          {children}
        </span>
        {learn ? (
          <Link className="hq-section__action" href={learn} style={{ padding: "6px 0" }}>
            Read the lesson
          </Link>
        ) : null}
      </span>
    </li>
  );
}
