import type { Metadata } from "next";
import { HQGlyph } from "@/components/hq/icon";
import { HQCallout, HQEmptyState, HQPath, stepsToNodes } from "@/components/hq/primitives";
import { JournalTabs, groupByDay } from "@/components/screens/journal-tabs";
import { RestForm } from "@/components/screens/log-forms";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { questPeriod } from "@/lib/gamification/quest-period";
import { usCalendarDate } from "@/lib/health/calendar";
import { sleepNightsTarget } from "@/lib/profile/profile";
import { logHabit } from "../engage/actions";
import { encouragement } from "@/lib/moments/encouragement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Rest · HealthQuest" };

export default async function HabitsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const habits = (await getDemoStore()).listHabits(user.id);
  const monday = questPeriod(usCalendarDate(new Date().toISOString()));
  const nights = habits.filter((habit) => habit.sleepHours !== null && questPeriod(habit.loggedOn) === monday).length;
  const target = sleepNightsTarget(user.profile);
  const days = groupByDay(habits, (habit) => habit.loggedOn);

  return (
    <main className="hq-main" data-width="wide">
      <div className="hq-log-screen">
        <header className="hq-page-head">
          <p className="hq-label">Journal</p>
          <h1 className="hq-onboard__question">How did you rest?</h1>
          <p className="hq-secondary">Every field is optional. These notes are your own record — not points, and not a diagnosis.</p>
        </header>

        <JournalTabs current="/habits" />

        <div className="hq-stack" style={{ gap: 24 }}>
          <section className="hq-surface hq-stack" style={{ gap: 10 }} aria-labelledby="nights-title">
            <h2 id="nights-title" className="hq-label" style={{ margin: 0 }}>
              Sleep quest: {Math.min(nights, target)} of {target} nights noted
            </h2>
            <HQPath
              surface="surface"
              label={`${Math.min(nights, target)} of ${target} nights with sleep noted this week`}
              nodes={stepsToNodes(Math.min(nights, target), target)}
              showLabels={false}
            />
            <p className="hq-micro" style={{ margin: 0 }}>
              A few nights is enough to start noticing your own pattern.
            </p>
          </section>

          {params.saved ? (
            <div role="status">
              <HQCallout tone="positive" title={encouragement("rest", `${monday}:${habits.length}`)}>
                Saved as your own record.
              </HQCallout>
            </div>
          ) : null}
          {params.error ? (
            <div role="alert">
              <HQCallout tone="caution">Sleep is 0 to 24 hours. Stress and mood, if you add them, are 1 to 5.</HQCallout>
            </div>
          ) : null}

          <RestForm action={logHabit} />
        </div>

        <section className="hq-log-history hq-section" aria-labelledby="recent-rest">
          <h2 id="recent-rest" className="hq-section-title">
            Recent notes
          </h2>
          {habits.length === 0 ? (
            <HQEmptyState title="Notes appear here when you add one." body="Even one number, like last night's sleep, is useful." />
          ) : (
            <ul className="hq-log-list">
              {days.map((group) => (
                <li key={group.day}>
                  <p className="hq-log-day">{group.label}</p>
                  <ul className="hq-log-list">
                    {group.items.map((habit) => (
                      <li key={habit.id} className="hq-log-item" style={{ gridTemplateColumns: "auto 1fr" }}>
                        <HQGlyph name="moon" tone="night" />
                        <span className="hq-secondary" style={{ margin: 0 }}>
                          {[
                            habit.sleepHours !== null ? `Slept ${habit.sleepHours} h` : null,
                            habit.waterCups !== null ? `${habit.waterCups} cups of water` : null,
                            habit.stressRating !== null ? `Stress ${habit.stressRating}/5` : null,
                            habit.moodRating !== null ? `Mood ${habit.moodRating}/5` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Note saved"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
