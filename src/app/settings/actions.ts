"use server";

import { clearSession } from "@/lib/demo/session";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { redirect } from "next/navigation";

export async function updatePreferences(formData: FormData) {
  const user = await requireOnboardedUser();
  const allowed = new Set<string>(GOAL_OPTIONS.map((goal) => goal.id));
  const goals = formData.getAll("goals").map(String).filter((id) => allowed.has(id));
  if (goals.length === 0) redirect("/settings?error=goals");
  const contexts = user.healthContextIds ?? [];
  getDemoStore().saveUser({
    ...user,
    goals,
    gentleFoodMode:
      formData.get("gentleFoodMode") === "on" || shouldRecommendGentleFoodMode(contexts),
    aiEnabled: formData.get("aiEnabled") === "on",
    plainLanguage: formData.get("plainLanguage") === "on",
    highContrast: formData.get("highContrast") === "on",
    saveAiConversations: formData.get("saveAiConversations") === "on",
  });
  if (formData.get("saveAiConversations") !== "on") {
    getDemoStore().clearConversations(user.id);
  }
  redirect("/settings?saved=1");
}

export async function clearSavedConversations() {
  const user = await requireOnboardedUser();
  getDemoStore().clearConversations(user.id);
  redirect("/settings?saved=1");
}

export async function signOut() {
  await clearSession();
  redirect("/");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireOnboardedUser();
  if (String(formData.get("confirm") ?? "") !== "DELETE") redirect("/settings?error=confirm");
  getDemoStore().deleteUser(user.id);
  await clearSession();
  redirect("/?deleted=1");
}
