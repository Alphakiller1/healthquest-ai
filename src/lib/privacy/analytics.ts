export const ANALYTICS_ALLOWLIST = [
  "lesson_completed",
  "quest_started",
  "quest_completed",
  "onboarding_finished",
  "meal_logged",
  "activity_logged",
  "consent_recorded",
  "account_export_requested",
  "account_deletion_requested",
  "safety_screen_shown",
] as const;

export type AllowedAnalyticsEvent = (typeof ANALYTICS_ALLOWLIST)[number];

const ALLOWED = new Set<string>(ANALYTICS_ALLOWLIST);

export function isAllowedAnalyticsEvent(
  name: string,
): name is AllowedAnalyticsEvent {
  return ALLOWED.has(name);
}
