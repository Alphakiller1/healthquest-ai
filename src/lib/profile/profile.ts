import { z } from "zod";

/*
 * The health profile: optional answers that each change something concrete.
 * The product rule is data minimisation — if no feature uses a field, it is
 * not collected. Every option lists what it changes so the person can see why
 * it is asked. Nothing here is a diagnosis, a score, or sent to analytics.
 */

export const ACTIVITY_BASELINES = [
  { id: "rarely", label: "Rarely", hint: "Most days are mostly sitting", target: 1 },
  { id: "some_days", label: "Some days", hint: "A walk or activity a few times a week", target: 2 },
  { id: "most_days", label: "Most days", hint: "Moving is already part of most days", target: 3 },
] as const;

export const SLEEP_TYPICAL = [
  { id: "under_6", label: "Under 6 hours" },
  { id: "6_to_7", label: "6 to 7 hours" },
  { id: "7_to_9", label: "7 to 9 hours" },
  { id: "over_9", label: "More than 9 hours" },
  { id: "varies", label: "It varies a lot" },
] as const;

export const BUDGETS = [
  { id: "tight", label: "Tight", hint: "Every dollar counts right now" },
  { id: "moderate", label: "Moderate", hint: "Some room, but cost matters" },
  { id: "flexible", label: "Flexible", hint: "Cost isn't a main concern" },
] as const;

export const EATING_PATTERNS = [
  { id: "vegetarian", label: "Vegetarian", excludes: ["fish", "meat", "steak", "beef", "pork", "chicken", "bacon", "sausage"] },
  { id: "vegan", label: "Vegan", excludes: ["fish", "meat", "steak", "beef", "pork", "chicken", "bacon", "sausage", "cheese", "milk", "butter", "cream", "eggs", "dairy"] },
  { id: "pescatarian", label: "Pescatarian", excludes: ["meat", "steak", "beef", "pork", "chicken", "bacon", "sausage"] },
  { id: "no_pork", label: "No pork", excludes: ["pork", "bacon", "sausage"] },
  { id: "dairy_free", label: "Dairy-free", excludes: ["cheese", "milk", "butter", "cream", "dairy"] },
  { id: "gluten_free", label: "Gluten-free", excludes: [] },
] as const;

export const SMOKING = [
  { id: "never", label: "Never smoked" },
  { id: "former", label: "Used to smoke" },
  { id: "current", label: "Smoke now" },
  { id: "prefer_not", label: "Prefer not to say" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];

export type HealthProfile = {
  activityBaseline?: Ids<typeof ACTIVITY_BASELINES>;
  /** The person's own weekly movement goal; defaults from the baseline. */
  weeklyMovementGoal?: number;
  sleepTypical?: Ids<typeof SLEEP_TYPICAL>;
  budget?: Ids<typeof BUDGETS>;
  eatingPatterns?: Ids<typeof EATING_PATTERNS>[];
  smoking?: Ids<typeof SMOKING>;
  updatedAt?: string;
};

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((item) => item.id) as [Ids<T>, ...Ids<T>[]];

export const profileSchema = z.object({
  activityBaseline: z.enum(ids(ACTIVITY_BASELINES)).optional(),
  weeklyMovementGoal: z.number().int().min(1).max(7).optional(),
  sleepTypical: z.enum(ids(SLEEP_TYPICAL)).optional(),
  budget: z.enum(ids(BUDGETS)).optional(),
  eatingPatterns: z.array(z.enum(ids(EATING_PATTERNS))).max(6).optional(),
  smoking: z.enum(ids(SMOKING)).optional(),
});

/** Reads the profile fields from a form, ignoring anything unknown or blank. */
export function parseProfileForm(formData: FormData, now = new Date()): HealthProfile {
  const pick = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    return value === "" || value === "skip" ? undefined : value;
  };
  const goal = pick("weeklyMovementGoal");
  const parsed = profileSchema.safeParse({
    activityBaseline: pick("activityBaseline"),
    weeklyMovementGoal: goal === undefined ? undefined : Number(goal),
    sleepTypical: pick("sleepTypical"),
    budget: pick("budget"),
    eatingPatterns: formData.getAll("eatingPatterns").map(String).filter(Boolean),
    smoking: pick("smoking"),
  });
  if (!parsed.success) return { updatedAt: now.toISOString() };
  return { ...parsed.data, updatedAt: now.toISOString() };
}

/** The weekly movement target: the person's own choice, else sized to their baseline, else 1. */
export function movementTarget(profile: HealthProfile | undefined): number {
  if (profile?.weeklyMovementGoal) return profile.weeklyMovementGoal;
  return ACTIVITY_BASELINES.find((item) => item.id === profile?.activityBaseline)?.target ?? 1;
}

/** Sleep-notes quest length: longer when sleep is short or irregular, since the pattern is the point. */
export function sleepNightsTarget(profile: HealthProfile | undefined): number {
  return profile?.sleepTypical === "under_6" || profile?.sleepTypical === "varies" ? 3 : 2;
}

/** Foods the person doesn't eat, so answers and suggestions can leave them out. */
export function excludedFoods(profile: HealthProfile | undefined): string[] {
  const words = new Set<string>();
  for (const pattern of profile?.eatingPatterns ?? []) {
    for (const word of EATING_PATTERNS.find((item) => item.id === pattern)?.excludes ?? []) words.add(word);
  }
  return [...words];
}
