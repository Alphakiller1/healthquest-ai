import type { Metadata } from "next";
import Link from "next/link";
import { HQGlyph } from "@/components/hq/icon";
import { HQButton, HQCallout, HQEmptyState, HQPath, HQSafetyBanner, stepsToNodes } from "@/components/hq/primitives";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { JournalTabs, groupByDay } from "@/components/screens/journal-tabs";
import { MoveForm } from "@/components/screens/log-forms";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { questPeriod } from "@/lib/gamification/quest-period";
import { usCalendarDate } from "@/lib/health/calendar";
import { movementTarget } from "@/lib/profile/profile";
import { deleteActivity, logActivity } from "../engage/actions";
import { encouragement } from "@/lib/moments/encouragement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Movement · HealthQuest" };

export default async function MovePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; emergency?: string }> }) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const activities = (await getDemoStore()).listActivities(user.id);
  const monday = questPeriod(usCalendarDate(new Date().toISOString()));
  const thisWeek = activities.filter((item) => questPeriod(item.loggedOn) === monday).length;
  const goal = movementTarget(user.profile);
  const recent = [...new Set([...activities].reverse().map((item) => item.activityType.trim().toLowerCase()))].slice(0, 5);
  const days = groupByDay(activities, (item) => item.loggedOn);

  return (
    <main className="hq-main" data-width="wide">
      <div className="hq-log-screen">
        <header className="hq-page-head">
          <p className="hq-label">Journal</p>
          <h1 className="hq-onboard__question">What movement did you do?</h1>
          <p className="hq-secondary">Any movement you chose counts. HealthQuest doesn&rsquo;t estimate calories burned.</p>
        </header>

        <JournalTabs current="/move" />

        {params.emergency === "medical" ? (
          <div data-span="full">
            <HQSafetyBanner message={MEDICAL_EMERGENCY_MESSAGE} actions={[{ label: "Call 911", href: "tel:911", primary: true }]} />
          </div>
        ) : null}
        {params.emergency === "crisis" ? (
          <div data-span="full">
            <HQSafetyBanner
              message={CRISIS_MESSAGE}
              actions={[
                { label: "Call 988", href: "tel:988", primary: true },
                { label: "Text 988", href: "sms:988", primary: true },
                { label: "Call 911", href: "tel:911" },
              ]}
            />
          </div>
        ) : null}

        <div className="hq-stack" style={{ gap: 24 }}>
          <section className="hq-surface hq-stack" style={{ gap: 10 }} aria-labelledby="goal-title">
            <div className="hq-cluster" style={{ justifyContent: "space-between" }}>
              <h2 id="goal-title" className="hq-label" style={{ margin: 0 }}>
                Your weekly goal: {goal} {goal === 1 ? "session" : "sessions"}
              </h2>
              <Link className="hq-section__action" href="/you/profile#activity">
                Change
              </Link>
            </div>
            <HQPath
              size={goal > 4 ? "sm" : "md"}
              surface="surface"
              label={`${Math.min(thisWeek, goal)} of ${goal} sessions this week`}
              nodes={stepsToNodes(Math.min(thisWeek, goal), goal)}
              showLabels={false}
            />
            <p className="hq-micro" style={{ margin: 0 }}>
              {thisWeek >= goal
                ? `Goal reached this week${thisWeek > goal ? ` — ${thisWeek} sessions so far` : ""}. Extra movement still counts.`
                : `${Math.min(thisWeek, goal)} of ${goal} this week. You set this goal; change it any time.`}
            </p>
          </section>

          {params.saved ? (
            <div role="status">
              <HQCallout tone="positive" title={encouragement("activity", `${monday}:${activities.length}`)}>
                +10 XP for logging it. That&rsquo;s for showing up, not a fitness grade.
              </HQCallout>
            </div>
          ) : null}
          {params.error ? (
            <div role="alert">
              <HQCallout tone="caution">Add an activity, minutes above zero, and how it felt.</HQCallout>
            </div>
          ) : null}

          <MoveForm action={logActivity} recent={recent} />
        </div>

        <section className="hq-log-history hq-section" aria-labelledby="recent-moves">
          <h2 id="recent-moves" className="hq-section-title">
            Recent movement
          </h2>
          {activities.length === 0 ? (
            <HQEmptyState title="Your movement journey starts whenever you're ready." body="A walk, chores, a stretch — it all counts." />
          ) : (
            <ul className="hq-log-list">
              {days.map((group) => (
                <li key={group.day}>
                  <p className="hq-log-day">{group.label}</p>
                  <ul className="hq-log-list">
                    {group.items.map((item) => (
                      <li key={item.id} className="hq-log-item">
                        <HQGlyph name="motion" tone="brand" />
                        <span>
                          <span className="hq-log-item__title" style={{ textTransform: "capitalize" }}>
                            {item.activityType}
                          </span>
                          <span className="hq-micro" style={{ display: "block" }}>
                            {item.durationMinutes} min · felt {item.intensity}
                          </span>
                        </span>
                        <form action={deleteActivity}>
                          <input type="hidden" name="activityId" value={item.id} />
                          <HQButton type="submit" variant="quiet" size="sm" aria-label={`Remove ${item.activityType}`}>
                            Remove
                          </HQButton>
                        </form>
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
