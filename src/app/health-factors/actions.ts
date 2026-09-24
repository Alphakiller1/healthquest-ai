"use server";

import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { normalizeFamilyHistory } from "@/lib/health/family-history";
import { normalizeHealthContexts, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";

async function saveHealthTopicsAction(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = await getDemoStore();
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

async function saveFamilyHistoryAction(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = await getDemoStore();
  const user = store.getUser(session.userId);
  if (!user?.onboardingComplete) redirect("/onboarding");
  store.saveUser({
    ...user,
    familyHistoryCategories: normalizeFamilyHistory(formData.getAll("categories").map(String)),
  });
  redirect("/health-factors?saved=1");
}

export const saveHealthTopics = withPersist(saveHealthTopicsAction);
export const saveFamilyHistory = withPersist(saveFamilyHistoryAction);
