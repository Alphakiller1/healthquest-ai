/*
 * Server-enforced lengths for free text. The inputs carry the same maxLength so
 * people see the limit; the server trims anyway so nothing oversized is stored
 * (one pasted document would otherwise bloat every tester's shared data).
 */
export const FIELD_LIMITS = {
  foodName: 120,
  quantity: 20,
  servingUnit: 30,
  preparation: 120,
  approximateCost: 12,
  notes: 500,
  activityType: 80,
  email: 254,
} as const;

export const MAX_ACTIVITY_MINUTES = 600;

/** Trim whitespace and cut to the limit. */
export function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}
