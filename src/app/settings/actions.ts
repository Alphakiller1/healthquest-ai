"use server";

import { clearSession } from "@/lib/demo/session";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { DETAIL_LEVELS } from "@/lib/experience/depth";

const DETAIL_IDS = new Set<string>(DETAIL_LEVELS.map((option) => option.id));
import { redirect } from "next/navigation";

async function updatePreferencesAction(formData: FormData) {
  const user = await requireOnboardedUser();
  const allowed = new Set<string>(GOAL_OPTIONS.map((goal) => goal.id));
  // Goals now live in the health profile; keep the saved ones when this form doesn't send any.
  const submitted = formData.getAll("goals").map(String).filter((id) => allowed.has(id));
  const goals = submitted.length > 0 ? submitted : user.goals;
  const contexts = user.healthContextIds ?? [];
  (await getDemoStore()).saveUser({
    ...user,
    goals,
    gentleFoodMode:
      formData.get("gentleFoodMode") === "on" || shouldRecommendGentleFoodMode(contexts),
    aiEnabled: formData.get("aiEnabled") === "on",
    plainLanguage: formData.get("plainLanguage") === "on",
    highContrast: formData.get("highContrast") === "on",
    saveAiConversations: formData.get("saveAiConversations") === "on",
    detailLevel: DETAIL_IDS.has(String(formData.get("detailLevel"))) ? (String(formData.get("detailLevel")) as NonNullable<typeof user.detailLevel>) : user.detailLevel,
  });
  if (formData.get("saveAiConversations") !== "on") {
    (await getDemoStore()).clearConversations(user.id);
  }
  redirect("/settings?saved=1");
}

async function clearSavedConversationsAction() {
  const user = await requireOnboardedUser();
  (await getDemoStore()).clearConversations(user.id);
  redirect("/settings?saved=1");
}

async function signOutAction() {
  await clearSession();
  redirect("/");
}

async function deleteAccountAction(formData: FormData) {
  const user = await requireOnboardedUser();
  if (String(formData.get("confirm") ?? "") !== "DELETE") redirect("/settings?error=confirm");
  (await getDemoStore()).deleteUser(user.id);
  await clearSession();
  redirect("/?deleted=1");
}

export const updatePreferences = withPersist(updatePreferencesAction);
export const clearSavedConversations = withPersist(clearSavedConversationsAction);
export const signOut = withPersist(signOutAction);
export const deleteAccount = withPersist(deleteAccountAction);
