import type { CoachingMode } from "@/lib/health/contexts";
import { activeClaims, type EvidenceClaim } from "./claims";

/** Topics a selected health context makes relevant. Context ids never reach the model beyond these. */
const CONTEXT_TOPICS: Record<string, string[]> = {
  elevated_cholesterol: ["cholesterol", "saturated fat"],
  high_blood_pressure: ["blood pressure", "sodium"],
  prediabetes: ["diabetes", "fiber"],
  cardiovascular_wellness: ["cholesterol", "blood pressure", "movement"],
  healthy_eating: ["label", "affordable"],
  fitness: ["movement"],
  sleep: ["sleep", "stress"],
  type_1_diabetes: ["diabetes"],
  kidney_disease: ["sodium"],
};

const GOAL_TOPICS: Record<string, string[]> = {
  understand_nutrition: ["label"],
  move_more: ["movement"],
  sleep_better: ["sleep"],
  affordable_meals: ["affordable"],
  prepare_for_visit: ["visit"],
};

/** Everyday words mapped to topics so "ribeye with butter" finds saturated fat. */
const WORD_TOPICS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:steak|ribeye|beef|burger|bacon|sausage|butter|cheese|cream|fried|pork|lard|pizza|ice cream)\b/, "saturated fat"],
  [/\b(?:salt|salty|chips|ramen|soup|deli|pickles?|soy sauce|canned soup|fast food|fries)\b/, "sodium"],
  [/\b(?:beans|lentils|oats|oatmeal|whole grain|brown rice|broccoli|apple|berries|vegetables?|veggies)\b/, "fiber"],
  [/\b(?:cheap|afford|budget|money|cost|price|expensive|groceries|grocery|save)\b/, "affordable"],
  [/\b(?:walk|walking|run|running|gym|workout|exercise|steps|bike|swim|yoga|stretch)\b/, "movement"],
  [/\b(?:sleep|slept|tired|insomnia|bedtime|nap|rest)\b/, "sleep"],
  [/\b(?:stress|stressed|anxious|anxiety|worried|overwhelmed|panic)\b/, "stress"],
  [/\b(?:ldl|hdl|lipid|cholesterol|triglycerides)\b/, "cholesterol"],
  [/\b(?:blood pressure|bp|hypertension|systolic|diastolic)\b/, "blood pressure"],
  [/\b(?:label|nutrition facts|serving)\b/, "label"],
  [/\b(?:mom|dad|father|mother|grand(?:ma|pa|mother|father)|sister|brother|family|genetic|runs in)\b/, "family history"],
  [/\b(?:doctor|clinician|appointment|visit|nurse|checkup|physician)\b/, "visit"],
  [/\b(?:sugar|glucose|a1c|diabetes|prediabetes|insulin)\b/, "diabetes"],
  [/\b(?:988|crisis|hopeless|suicid)\b/, "crisis"],
];

export type EvidenceSelection = {
  claims: EvidenceClaim[];
  topics: string[];
};

export function topicsFor(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [pattern, topic] of WORD_TOPICS) if (pattern.test(lower)) found.add(topic);
  for (const claim of activeClaims()) {
    for (const topic of claim.topics) if (topic.length > 3 && lower.includes(topic)) found.add(topic);
  }
  return [...found];
}

/**
 * Pick the reviewed claims relevant to one question. Words in the question
 * count most, then the food, then the person's chosen contexts and goals.
 * Returns at most `limit` claims, keeping a mix of explanation, options,
 * boundaries, and one question to ask a clinician.
 */
export function selectEvidence(input: {
  message: string;
  foodDescription?: string;
  contextIds: string[];
  goals: string[];
  coachingMode: CoachingMode;
  gentleFoodMode: boolean;
  limit?: number;
}): EvidenceSelection {
  const weights = new Map<string, number>();
  const add = (topics: string[], weight: number) => {
    for (const topic of topics) weights.set(topic, Math.max(weights.get(topic) ?? 0, weight));
  };
  const asked = topicsFor(input.message);
  const food = input.foodDescription ? topicsFor(input.foodDescription) : [];
  // The person's profile only sharpens a relevant answer; it never answers an unrelated question.
  if (asked.length === 0 && !input.foodDescription) return { claims: [], topics: [] };
  add(asked, 3);
  add(food, 2);
  add(input.contextIds.flatMap((id) => CONTEXT_TOPICS[id] ?? []), 1);
  add(input.goals.flatMap((id) => GOAL_TOPICS[id] ?? []), 0.5);

  const pool = activeClaims().filter((claim) => {
    if (input.coachingMode === "education_only" && !claim.educationOnlySafe) return false;
    if (input.gentleFoodMode && /calorie/i.test(claim.claim)) return false;
    return true;
  });

  const scored = pool
    .map((claim) => ({
      claim,
      // A claim whose primary topic matches outranks one that mentions the topic in passing.
      score:
        claim.topics.reduce((sum, topic) => sum + (weights.get(topic) ?? 0), 0) +
        (weights.get(claim.topics[0]) ?? 0) * 0.5,
    }))
    // Only claims about what was asked (or eaten); profile topics reorder them but never add unrelated ones.
    .filter((item) => item.claim.topics.some((topic) => asked.includes(topic) || food.includes(topic)))
    .sort((a, b) => b.score - a.score);

  // Keep variety: no more than two claims of one kind, one "ask".
  const limit = input.limit ?? 7;
  const perKind = new Map<string, number>();
  const chosen: EvidenceClaim[] = [];
  for (const { claim } of scored) {
    const max = claim.kind === "ask" ? 1 : 2;
    if ((perKind.get(claim.kind) ?? 0) >= max) continue;
    perKind.set(claim.kind, (perKind.get(claim.kind) ?? 0) + 1);
    chosen.push(claim);
    if (chosen.length >= limit) break;
  }
  return { claims: chosen, topics: [...weights.keys()] };
}
