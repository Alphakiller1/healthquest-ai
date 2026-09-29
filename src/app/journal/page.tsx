import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HQGlyph, HQIcon } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChip, HQEmptyState, HQSafetyBanner } from "@/components/hq/primitives";
import { JournalTabs, groupByDay } from "@/components/screens/journal-tabs";
import { assistantDailyLimit } from "@/lib/ai/daily-limit";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { experienceFor } from "@/lib/experience/current";
import { usCalendarDate } from "@/lib/health/calendar";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { afterMeal, mealTip, usualMeals } from "@/lib/journey/meal-context";
import { nutrientFocus } from "@/lib/nutrition/focus";
import { profileTopics } from "@/lib/profile/personalize";
import { deleteMeal } from "./actions";
import { MealForm } from "./meal-form";
import { MealInsight } from "./meal-insight";
import { encouragement } from "@/lib/moments/encouragement";

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
  const today = usCalendarDate(new Date().toISOString());
  const gentle = user.gentleFoodMode || shouldRecommendGentleFoodMode(user.healthContextIds ?? []);
  const focus = nutrientFocus(profileTopics(user));
  const level = (await experienceFor(user)).level;
  const completed = new Set(store.listLessonCompletions(user.id).map((item) => item.lessonId));
  const after = saved ? afterMeal(user, saved, focus, completed, gentle) : null;
  const tip = saved ? null : mealTip(user, today);
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
          <details className="hq-about">
            <summary>What is this?</summary>
            <p>Log meals, movement, and rest in your own words. Nothing is graded — logging earns a few points for showing up.</p>
          </details>
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
          {saved && after ? (
            <section className="hq-meal-saved" aria-labelledby="saved-title">
              <div className="hq-meal-saved__head">
                <HQGlyph name="check" tone="brand" />
                <div className="hq-meal-saved__text">
                  <h2 id="saved-title" className="hq-meal-saved__title">
                    Saved: {saved.foodName}
                  </h2>
                  <p className="hq-secondary" style={{ margin: 0 }}>
                    {saved.mealSlot ? `${saved.mealSlot[0].toUpperCase()}${saved.mealSlot.slice(1)} · ` : ""}
                    {encouragement("meal", saved.id)}
                  </p>
                </div>
                <form action={deleteMeal}>
                  <input type="hidden" name="mealId" value={saved.id} />
                  <input type="hidden" name="undo" value="1" />
                  <HQButton type="submit" variant="quiet" size="sm" aria-label={`Undo saving ${saved.foodName}`}>
                    Undo
                  </HQButton>
                </form>
              </div>
              <HQChip tone="sun" icon="spark">
                +5 XP for showing up
              </HQChip>
              {after.focusLine ? (
                <p className="hq-meal-saved__focus">
                  <span className="hq-fact__focus-key">Your focus</span>
                  <span>
                    <strong>{after.focusLine}.</strong> <span className="hq-micro">{after.focusReason}</span>
                  </span>
                </p>
              ) : after.focusNudge ? (
                <p className="hq-micro" style={{ margin: 0 }}>{after.focusNudge}</p>
              ) : null}
              <div className="hq-meal-saved__next">
                {user.aiEnabled !== false ? (
                  <a href="#meal-insight" className="hq-meal-saved__link">
                    <HQIcon name="spark" size={16} /> What this means for you
                  </a>
                ) : null}
                {after.lesson ? (
                  <Link href={`/learn/${after.lesson.id}`} className="hq-meal-saved__link">
                    <HQIcon name="book" size={16} /> {after.lesson.title}
                    <span className="hq-micro"> · {after.lesson.reason}</span>
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}

          {params.notice === "undone" ? (
            <p className="hq-meal-note" role="status">
              <HQIcon name="check" size={16} /> Removed. Everything else is as it was.
            </p>
          ) : null}

          {params.notice === "invalid" ? (
            <div role="alert">
              <HQCallout tone="caution">Add a food name before saving.</HQCallout>
            </div>
          ) : null}

          <MealForm key={`form-${saved?.id ?? "new"}`} gentleFoodMode={gentle} usual={usualMeals(meals)} focus={focus} />

          {tip ? (
            <aside className="hq-meal-tip" aria-labelledby="meal-tip-title">
              <p id="meal-tip-title" className="hq-label" style={{ margin: 0 }}>
                {focus.length > 0 ? "An idea for your focus" : "An idea for today"}
              </p>
              <p style={{ margin: 0 }}>{tip.text}</p>
              <p className="hq-micro" style={{ margin: 0 }}>
                <a href={tip.url}>{tip.organization}</a>
              </p>
            </aside>
          ) : null}

          {saved && user.aiEnabled !== false ? (
            <MealInsight key={`insight-${saved.id}`} mealId={saved.id} foodName={saved.foodName} initial={saved.explanation} level={level} />
          ) : null}
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
                              {[
                                meal.mealSlot && `${meal.mealSlot[0].toUpperCase()}${meal.mealSlot.slice(1)}`,
                                meal.portion && `${meal.portion} portion`,
                                meal.quantity && `${meal.quantity} ${meal.servingUnit}`.trim(),
                                meal.preparation,
                                meal.nutrition && "nutrition facts",
                                meal.approximateCost && `$${meal.approximateCost.replace(/^\$/, "")}`,
                              ]
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
