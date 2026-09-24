import { z } from "zod";
import type { DemoStore, DemoUser } from "@/lib/demo/store";
import { HEALTH_CONTEXTS, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { adultEligibility } from "@/lib/privacy/eligibility";

export const POLICY_VERSION = "2026-09-24";

export const GOAL_OPTIONS = [
  { id: "understand_nutrition", label: "Understand how meals fit what I want to learn" },
  { id: "move_more", label: "Build a realistic movement habit" },
  { id: "sleep_better", label: "Learn about sleep consistency" },
  { id: "affordable_meals", label: "Find budget-oriented meal ideas" },
  { id: "prepare_for_visit", label: "Prepare questions for a clinician" },
] as const;

const onboardingSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goals: z.array(z.string()).min(1),
  gentleFoodMode: z.boolean(),
  healthContextIds: z.array(z.string()).default([]),
  aiConsent: z.literal(true),
  healthDataConsent: z.literal(true),
  privacyAccepted: z.literal(true),
  termsAccepted: z.literal(true),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

function usToday(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export type OnboardingResult =
  | { status: "complete" }
  | { status: "under_18" }
  | { status: "invalid" };

export function completeOnboarding(
  store: DemoStore,
  user: DemoUser,
  raw: unknown,
  now = new Date(),
): OnboardingResult {
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const birthDate = parseBirthDate(parsed.data.birthDate);
  if (!birthDate) return { status: "invalid" };
  if (!adultEligibility(birthDate, usToday(now)).eligible) {
    store.saveUser({
      ...user,
      birthDate: parsed.data.birthDate,
      goals: [],
      consents: [],
      onboardingComplete: false,
      blockedUnder18: true,
    });
    return { status: "under_18" };
  }
  const known = new Set(HEALTH_CONTEXTS.map((context) => context.id));
  const healthContextIds = parsed.data.healthContextIds.filter((id) => known.has(id));
  const createdAt = now.toISOString();
  store.saveUser({
    ...user,
    birthDate: parsed.data.birthDate,
    goals: parsed.data.goals,
    healthContextIds,
    gentleFoodMode: parsed.data.gentleFoodMode || shouldRecommendGentleFoodMode(healthContextIds),
    aiEnabled: true,
    blockedUnder18: false,
    onboardingComplete: true,
    consents: [
      { type: "ai_processing", policyVersion: POLICY_VERSION, accepted: true, createdAt },
      { type: "health_data_processing", policyVersion: POLICY_VERSION, accepted: true, createdAt },
      { type: "privacy_policy", policyVersion: POLICY_VERSION, accepted: true, createdAt },
      { type: "terms", policyVersion: POLICY_VERSION, accepted: true, createdAt },
    ],
  });
  return { status: "complete" };
}
