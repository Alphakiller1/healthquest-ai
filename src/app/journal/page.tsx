import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HQAssistantResponse } from "@/components/hq/assistant-response";
import { HQGlyph } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChip, HQEmptyState, HQSafetyBanner } from "@/components/hq/primitives";
import { JournalTabs, groupByDay } from "@/components/screens/journal-tabs";
import { assistantDailyLimit } from "@/lib/ai/daily-limit";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { usCalendarDate } from "@/lib/health/calendar";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { deleteMeal } from "./actions";
import { MealForm } from "./meal-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meals · HealthQuest" };

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; emergency?: string; notice?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = await getDemoStore();
  const user = store.getUser(session.userId);
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  const params = await searchParams;
  const meals = store.listMeals(user.id);
  const saved = meals.find((meal) => meal.id === params.saved);
  const explanationsLeft = Math.max(
    0,
    assistantDailyLimit() - store.countAssistantUses(user.id, usCalendarDate(new Date().toISOString())),
  );
  const recentFoods = [...new Set([...meals].reverse().map((meal) => meal.foodName.trim()))].slice(0, 6);
  const days = groupByDay(meals, (meal) => usCalendarDate(meal.createdAt));

  return (
    <main className="hq-main" data-width="wide">
      <div className="hq-log-screen">
        <header className="hq-page-head">
          <p className="hq-label">Journal</p>
          <h1 className="hq-onboard__question">What did you have?</h1>
          <p className="hq-secondary">
            {user.aiEnabled === false
              ? "Education explanations are off. Meals still save."
              : `Log it in your own words. ${explanationsLeft} ${explanationsLeft === 1 ? "explanation" : "explanations"} left today.`}
          </p>
        </header>

        <JournalTabs current="/journal" />

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
          {saved?.explanation ? (
            <section className="hq-surface hq-surface--raised hq-stack" aria-labelledby="saved-title" style={{ gap: 20 }}>
              <div className="hq-cluster" style={{ justifyContent: "space-between" }}>
                <h2 id="saved-title" className="hq-section-title" style={{ margin: 0 }}>
                  Saved
                </h2>
                <HQChip tone="sun" icon="spark">
                  +5 XP for showing up
                </HQChip>
              </div>
              {saved.explanation.demo ? (
                <HQCallout tone="neutral">Practice explanation. This was not sent to a live model.</HQCallout>
              ) : null}
              <HQAssistantResponse
                question={saved.foodName}
                questionLabel="About your meal"
                response={{
                  status: "ok",
                  summary: saved.explanation.summary,
                  practicalOptions: saved.explanation.practicalOptions.slice(0, 1),
                  sourceIds: saved.explanation.sourceIds,
                  uncertainty: saved.explanation.uncertainty,
                  professionalFollowup: saved.explanation.professionalFollowup,
                  disclaimer: saved.explanation.disclaimer,
                }}
              />
              <p className="hq-micro" style={{ margin: 0 }}>
                The points are for logging, not a grade of the meal.
              </p>
            </section>
          ) : null}

          {params.notice === "invalid" ? (
            <div role="alert">
              <HQCallout tone="caution">Add a food name before saving.</HQCallout>
            </div>
          ) : null}

          <MealForm gentleFoodMode={user.gentleFoodMode} recentFoods={recentFoods} />
        </div>

        <section className="hq-log-history hq-section" aria-labelledby="recent-meals">
          <div className="hq-section__head">
            <h2 id="recent-meals" className="hq-section-title">
              Recent meals
            </h2>
          </div>
          {meals.length === 0 ? (
            <HQEmptyState title="Log something when it helps you understand your day." />
          ) : (
            <>
              <ul className="hq-log-list">
                {days.map((group) => (
                  <li key={group.day}>
                    <p className="hq-log-day">{group.label}</p>
                    <ul className="hq-log-list">
                      {group.items.map((meal) => (
                        <li key={meal.id} className="hq-log-item">
                          <HQGlyph name="bowl" tone="sun" />
                          <span>
                            <span className="hq-log-item__title">{meal.foodName}</span>
                            <span className="hq-micro" style={{ display: "block" }}>
                              {[meal.quantity && `${meal.quantity} ${meal.servingUnit}`.trim(), meal.preparation, meal.approximateCost && `$${meal.approximateCost.replace(/^\$/, "")}`]
                                .filter(Boolean)
                                .join(" · ") || "Logged"}
                            </span>
                          </span>
                          <form action={deleteMeal}>
                            <input type="hidden" name="mealId" value={meal.id} />
                            <HQButton type="submit" variant="quiet" size="sm" aria-label={`Remove ${meal.foodName}`}>
                              Remove
                            </HQButton>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="hq-micro" style={{ margin: 0 }}>
                Removing a meal doesn&rsquo;t take back points already earned.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
