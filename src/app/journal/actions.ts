"use server";

import { redirect } from "next/navigation";
import { createAssistant } from "@/lib/ai/create-assistant";
import { readSession } from "@/lib/demo/session";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { explainMeal, recordMeal, type MealExplanation } from "@/lib/journey/record-meal";
import { awardCompletedQuests } from "@/lib/gamification/quests";
import { getNutritionProvider } from "@/lib/nutrition/provider";
import type { NutritionSearchResult } from "@/lib/nutrition/types";

async function requireUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = (await getDemoStore()).getUser(session.userId);
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  return user;
}

async function searchFoodsAction(query: string): Promise<NutritionSearchResult> {
  await requireUser();
  const nutrition = getNutritionProvider();
  if (!nutrition.ok) return { status: "unavailable", message: nutrition.message };
  return nutrition.provider.search(query);
}

async function deleteMealAction(formData: FormData) {
  const user = await requireUser();
  (await getDemoStore()).deleteMeal(user.id, String(formData.get("mealId") ?? ""));
  redirect(formData.get("undo") ? "/journal?notice=undone" : "/journal");
}

/** Called by the saved-meal card after the page shows, so saving never waits on it. */
async function explainMealAction(mealId: string): Promise<MealExplanation | null> {
  const user = await requireUser();
  const store = await getDemoStore();
  const meal = store.listMeals(user.id).find((item) => item.id === mealId);
  if (!meal) return null;
  const assistant = createAssistant();
  return explainMeal({ store, user, meal, assistant: assistant.provider, assistantDemo: assistant.demo });
}

async function saveMealAction(formData: FormData) {
  const user = await requireUser();
  // Nutrition matching is optional: a meal always saves, with or without USDA data.
  const nutrition = getNutritionProvider();
  const result = await recordMeal({
    store: (await getDemoStore()),
    user,
    draft: {
      foodName: String(formData.get("foodName") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      servingUnit: String(formData.get("servingUnit") ?? ""),
      preparation: String(formData.get("preparation") ?? ""),
      approximateCost: String(formData.get("approximateCost") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      fdcId: String(formData.get("fdcId") ?? "") || null,
      mealSlot: String(formData.get("mealSlot") ?? ""),
      portion: String(formData.get("portion") ?? ""),
    },
    nutrition: nutrition.ok ? nutrition.provider : null,
  });
  if (result.status === "emergency") {
    redirect(`/journal?emergency=${result.actions.includes("call_988") ? "crisis" : "medical"}`);
  }
  if (result.status === "saved") {
    awardCompletedQuests((await getDemoStore()), user.id);
    redirect(`/journal?saved=${result.meal.id}`);
  }
  if (result.status === "invalid") redirect("/journal?notice=invalid");
  redirect("/journal?notice=invalid");
}

export const searchFoods = withPersist(searchFoodsAction, { refresh: false });
export const explainMealNow = withPersist(explainMealAction, { refresh: false });
export const deleteMeal = withPersist(deleteMealAction);
export const saveMeal = withPersist(saveMealAction);
