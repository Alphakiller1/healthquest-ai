import type { DemoUser, MealRecord } from "@/lib/demo/store";
import { topicsFor } from "@/lib/evidence/select";
import { getActiveSource } from "@/lib/evidence/registry";
import { LESSONS } from "@/lib/learn/lessons";
import { foodTips } from "@/lib/moments/food";
import { nutrientFacts, splitFoodName, type NutrientFocus } from "@/lib/nutrition/focus";
import { LESSON_TOPICS, profileTopics, rankLessons } from "@/lib/profile/personalize";
import type { UsualMeal } from "@/app/journal/meal-form";

/*
 * What the meal screen offers without being asked: the person's usual meals,
 * a tip fitted to their focus, and after a save, how that meal connects to
 * what they care about plus one thing to read next. Facts and reasons only —
 * no verdicts on the food.
 */

/** Meals logged more than once come first, then the most recent. */
export function usualMeals(meals: readonly MealRecord[], limit = 6): UsualMeal[] {
  const byName = new Map<string, { latest: MealRecord; times: number; order: number }>();
  meals.forEach((meal, order) => {
    const key = meal.foodName.trim().toLowerCase();
    const seen = byName.get(key);
    byName.set(key, { latest: meal, times: (seen?.times ?? 0) + 1, order });
  });
  return [...byName.values()]
    .sort((a, b) => Math.min(b.times, 3) - Math.min(a.times, 3) || b.order - a.order)
    .slice(0, limit)
    .map(({ latest, times }) => ({
      foodName: latest.foodName.trim(),
      portion: latest.portion,
      quantity: latest.quantity,
      servingUnit: latest.servingUnit,
      preparation: latest.preparation,
      fdcId: latest.fdcId,
      nutrition: latest.nutrition ?? null,
      times,
    }));
}

export type ContextTip = { text: string; organization: string; url: string };

/** One reviewed food tip for the form, leaning on the person's focus; changes daily. */
export function mealTip(user: DemoUser, isoDate: string): ContextTip | null {
  const affordable = profileTopics(user).some((topic) => topic.topic === "affordable");
  const tips = foodTips(user, affordable ? "budget" : "cooking", 3);
  if (tips.length === 0) return null;
  const day = Number(isoDate.replaceAll("-", "")) || 0;
  const claim = tips[day % tips.length];
  const source = getActiveSource(claim.sourceId);
  return source ? { text: claim.claim, organization: source.organization, url: source.url } : null;
}

export type AfterMeal = {
  /** "Sodium 1 mg per 100 g" — the focus numbers for this meal, when it has nutrition facts. */
  focusLine: string | null;
  focusReason: string | null;
  /** When there are no facts yet but the person has a focus: how to see it next time. */
  focusNudge: string | null;
  lesson: { id: string; title: string; reason: string } | null;
};

export function afterMeal(
  user: DemoUser,
  meal: MealRecord,
  focus: readonly NutrientFocus[],
  completedLessons: ReadonlySet<string>,
  gentleFoodMode: boolean,
): AfterMeal {
  let focusLine: string | null = null;
  let focusReason: string | null = null;
  let focusNudge: string | null = null;
  if (focus.length > 0 && meal.nutrition) {
    const facts = nutrientFacts(meal.nutrition, focus, gentleFoodMode).filter((fact) => fact.focus);
    if (facts.length > 0) {
      const name = splitFoodName(meal.nutrition.description).name;
      focusLine = `${facts.map((fact) => `${fact.label} ${fact.value}`).join(" · ")} ${meal.nutrition.servingLabel} · USDA: ${name}`;
      focusReason = `Shown because ${focus[0].reason}.`;
    }
  } else if (focus.length > 0) {
    focusNudge = `Add nutrition facts when you log to see the ${focus
      .map((item) => item.label.toLowerCase())
      .join(" and ")} in what you eat.`;
  }

  // A lesson about what was just eaten beats a general one; the profile breaks ties.
  const mealTopics = new Set(topicsFor([meal.foodName, meal.preparation].join(" ")));
  const ranked = rankLessons(user, completedLessons).filter((item) => !item.done);
  let best: { id: string; title: string; reason: string; score: number } | null = null;
  for (const item of ranked) {
    const overlap = (LESSON_TOPICS[item.lesson.id] ?? []).filter((topic) => mealTopics.has(topic));
    const score = overlap.length * 2 + item.score;
    if (score <= 0 || (best && best.score >= score)) continue;
    best = {
      id: item.lesson.id,
      title: item.lesson.title,
      reason: overlap.length > 0 ? `Related to your ${meal.foodName.trim()}` : item.reason ?? "Picked for your goals",
      score,
    };
  }
  const lesson = best && LESSONS.some((item) => item.id === best.id) ? { id: best.id, title: best.title, reason: best.reason } : null;
  return { focusLine, focusReason, focusNudge, lesson };
}
