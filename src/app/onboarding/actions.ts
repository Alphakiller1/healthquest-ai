"use server";

import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { completeOnboarding } from "@/lib/journey/onboarding";
import { parseProfileForm } from "@/lib/profile/profile";
import { normalizeFamilyHistory } from "@/lib/health/family-history";
import { DETAIL_LEVELS } from "@/lib/experience/depth";

const DETAIL_IDS = new Set<string>(DETAIL_LEVELS.map((option) => option.id));

async function submitOnboardingAction(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = await getDemoStore();
  const user = store.getUser(session.userId);
  if (!user) redirect("/login");
  const result = completeOnboarding(store, user, {
    birthDate: formData.get("birthDate"),
    goals: formData.getAll("goals"),
    gentleFoodMode: formData.get("gentleFoodMode") === "on",
    healthContextIds: formData.getAll("contexts"),
    aiConsent: formData.get("aiConsent") === "on" ? true : undefined,
    healthDataConsent: formData.get("healthDataConsent") === "on" ? true : undefined,
    privacyAccepted: formData.get("privacyAccepted") === "on" ? true : undefined,
    termsAccepted: formData.get("termsAccepted") === "on" ? true : undefined,
  });
  if (result.status === "under_18") redirect("/onboarding?stopped=age");
  if (result.status === "invalid") redirect("/onboarding?error=form");
  // Everything below is optional. Skipped questions stay empty, and an empty
  // profile is not saved, so Today keeps inviting the person to shape it later.
  const profile = parseProfileForm(formData);
  const answered = Object.entries(profile).some(([key, value]) => key !== "updatedAt" && value !== undefined && !(Array.isArray(value) && value.length === 0));
  const detail = String(formData.get("detailLevel") ?? "");
  const saved = store.getUser(user.id);
  if (saved) {
    store.saveUser({
      ...saved,
      ...(answered ? { profile } : {}),
      familyHistoryCategories: normalizeFamilyHistory(formData.getAll("familyHistory").map(String)),
      detailLevel: DETAIL_IDS.has(detail) ? (detail as NonNullable<typeof saved.detailLevel>) : "auto",
    });
  }
  redirect("/today");
}

export const submitOnboarding = withPersist(submitOnboardingAction);
