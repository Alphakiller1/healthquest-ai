import type { DemoUser } from "@/lib/demo/store";
import { activeClaims, type EvidenceClaim } from "@/lib/evidence/claims";
import { resolveCoachingMode, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { profileTopics } from "@/lib/profile/personalize";
import { excludedFoods } from "@/lib/profile/profile";

/*
 * "I'm choosing food right now." Each situation maps to reviewed claims;
 * the person's profile reorders them and removes anything that doesn't fit
 * (Gentle Food Mode, education-only topics, foods they don't eat). No food is
 * labelled good or bad.
 */

export type FoodSituation = "grocery" | "cooking" | "snack" | "eating_out" | "budget";

export const FOOD_SITUATIONS: { id: FoodSituation; label: string; hint: string; icon: "bowl" | "leaf" | "spark" | "compass" | "book" }[] = [
  { id: "grocery", label: "At the store", hint: "Comparing what to buy", icon: "book" },
  { id: "cooking", label: "Making a meal", hint: "Putting a plate together", icon: "bowl" },
  { id: "snack", label: "Grabbing a snack", hint: "Something between meals", icon: "spark" },
  { id: "eating_out", label: "Eating out", hint: "Restaurant or takeout", icon: "compass" },
  { id: "budget", label: "On a tight budget", hint: "Stretching the money", icon: "leaf" },
];

const SITUATION_CLAIMS: Record<FoodSituation, string[]> = {
  grocery: ["label.compare", "label.serving", "fat.compare_label", "sodium.label", "afford.price"],
  cooking: ["afford.plate", "afford.staples", "fiber.what", "fat.unsaturated"],
  snack: ["fiber.what", "label.serving", "afford.staples"],
  eating_out: ["afford.plate", "fat.pattern", "sodium.what"],
  budget: ["afford.staples", "afford.price", "afford.varied", "afford.plate"],
};

const TOPIC_BOOST: Record<string, string[]> = {
  "blood pressure": ["sodium.label", "sodium.what"],
  sodium: ["sodium.label", "sodium.what"],
  cholesterol: ["fat.compare_label", "fat.pattern", "fat.unsaturated"],
  "saturated fat": ["fat.compare_label", "fat.pattern"],
  affordable: ["afford.staples", "afford.price"],
  fiber: ["fiber.what"],
  diabetes: ["fiber.what"],
};

export function foodTips(user: DemoUser, situation: FoodSituation, limit = 4): EvidenceClaim[] {
  const contexts = user.healthContextIds ?? [];
  const educationOnly = resolveCoachingMode(contexts) === "education_only";
  const gentle = user.gentleFoodMode || shouldRecommendGentleFoodMode(contexts);
  const excluded = excludedFoods(user.profile).map((word) => new RegExp(`\\b${word}\\b`, "i"));
  const boosted = new Set(profileTopics(user).flatMap((topic) => TOPIC_BOOST[topic.topic] ?? []));
  const byId = new Map(activeClaims().map((claim) => [claim.id, claim]));
  return SITUATION_CLAIMS[situation]
    .map((id, index) => ({ claim: byId.get(id), order: boosted.has(id) ? index - 10 : index }))
    .filter((item): item is { claim: EvidenceClaim; order: number } => Boolean(item.claim))
    .filter(({ claim }) => !(educationOnly && !claim.educationOnlySafe))
    .filter(({ claim }) => !(gentle && /calorie/i.test(claim.claim)))
    .filter(({ claim }) => !excluded.some((pattern) => pattern.test(claim.claim)))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((item) => item.claim);
}

export type NutrientRow = { key: string; label: string; unit: string; a: number | null; b: number | null };

/**
 * Plain differences between two foods, per the same amount. "Less" and "more"
 * only — never "better" or "worse", and calories are left out in Gentle Food Mode.
 */
export function compareLines(rows: NutrientRow[], names: [string, string]): string[] {
  const lines: string[] = [];
  for (const row of rows) {
    if (row.a === null || row.b === null || row.a === row.b) continue;
    const [more, less] = row.a > row.b ? [names[0], names[1]] : [names[1], names[0]];
    const high = Math.max(row.a, row.b);
    const low = Math.min(row.a, row.b);
    if (high === 0 || (high - low) / high < 0.15) continue;
    lines.push(`${less} has less ${row.label.toLowerCase()} than ${more} (${round(low)} vs ${round(high)} ${row.unit}).`);
  }
  return lines;
}

function round(value: number) {
  return value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
}
