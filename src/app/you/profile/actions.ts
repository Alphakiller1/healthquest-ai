"use server";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { normalizeHealthContexts, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { parseProfileForm } from "@/lib/profile/profile";

async function saveProfileAction(formData: FormData) {
  const user = await requireOnboardedUser();
  const allowedGoals = new Set<string>(GOAL_OPTIONS.map((goal) => goal.id));
  const goals = formData.getAll("goals").map(String).filter((id) => allowedGoals.has(id));
  if (goals.length === 0) redirect("/you/profile?error=goals#focus");
  const healthContextIds = normalizeHealthContexts(formData.getAll("contexts").map(String));
  const store = await getDemoStore();
  store.saveUser({
    ...user,
    goals,
    healthContextIds,
    // A disclosed eating-disorder history keeps Gentle Food Mode on; it can't be switched off here.
    gentleFoodMode: formData.get("gentleFoodMode") === "on" || shouldRecommendGentleFoodMode(healthContextIds),
    plainLanguage: formData.get("plainLanguage") === "on",
    profile: parseProfileForm(formData),
  });
  redirect("/you/profile?saved=1");
}

export const saveProfile = withPersist(saveProfileAction);
