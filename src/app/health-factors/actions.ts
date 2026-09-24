"use server";

import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { normalizeFamilyHistory } from "@/lib/health/family-history";
import { normalizeHealthContexts, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";

export async function saveHealthTopics(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = getDemoStore();
  const user = store.getUser(session.userId);
  if (!user?.onboardingComplete) redirect("/onboarding");
  const healthContextIds = normalizeHealthContexts(formData.getAll("contexts").map(String));
  store.saveUser({
    ...user,
    healthContextIds,
    gentleFoodMode: user.gentleFoodMode || shouldRecommendGentleFoodMode(healthContextIds),
  });
  redirect("/health-factors?saved=topics");
}

export async function saveFamilyHistory(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = getDemoStore();
  const user = store.getUser(session.userId);
  if (!user?.onboardingComplete) redirect("/onboarding");
  store.saveUser({
    ...user,
    familyHistoryCategories: normalizeFamilyHistory(formData.getAll("categories").map(String)),
  });
  redirect("/health-factors?saved=1");
}
