"use server";

import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { completeOnboarding } from "@/lib/journey/onboarding";

export async function submitOnboarding(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = getDemoStore();
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
  redirect("/dashboard");
}
