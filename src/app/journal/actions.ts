"use server";

import { redirect } from "next/navigation";
import { createAssistant } from "@/lib/ai/create-assistant";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { recordMeal } from "@/lib/journey/record-meal";
import { awardCompletedQuests } from "@/lib/gamification/quests";
import { getNutritionProvider } from "@/lib/nutrition/provider";
import type { NutritionSearchResult } from "@/lib/nutrition/types";

async function requireUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = getDemoStore().getUser(session.userId);
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  return user;
}

export async function searchFoods(query: string): Promise<NutritionSearchResult> {
  await requireUser();
  const nutrition = getNutritionProvider();
  if (!nutrition.ok) return { status: "unavailable", message: nutrition.message };
  return nutrition.provider.search(query);
}

export async function deleteMeal(formData: FormData) {
  const user = await requireUser();
  getDemoStore().deleteMeal(user.id, String(formData.get("mealId") ?? ""));
  redirect("/journal");
}

export async function saveMeal(formData: FormData) {
  const user = await requireUser();
  const nutrition = getNutritionProvider();
  if (!nutrition.ok) {
    redirect("/journal?notice=nutrition");
  }
  const assistant = createAssistant();
  const result = await recordMeal({
    store: getDemoStore(),
    user,
    draft: {
      foodName: String(formData.get("foodName") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      servingUnit: String(formData.get("servingUnit") ?? ""),
      preparation: String(formData.get("preparation") ?? ""),
      approximateCost: String(formData.get("approximateCost") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      fdcId: String(formData.get("fdcId") ?? "") || null,
    },
    nutrition: nutrition.provider,
    assistant: assistant.provider,
    assistantDemo: assistant.demo,
  });
  if (result.status === "emergency") {
    redirect(`/journal?emergency=${result.actions.includes("call_988") ? "crisis" : "medical"}`);
  }
  if (result.status === "saved") {
    awardCompletedQuests(getDemoStore(), user.id);
    redirect(`/journal?saved=${result.meal.id}`);
  }
  if (result.status === "invalid") redirect("/journal?notice=invalid");
  redirect("/journal?notice=invalid");
}
