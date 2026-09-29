import type { TopicWeight } from "@/lib/profile/personalize";
import type { NutritionFood } from "./types";

/*
 * Which numbers to show first for this person, and why. The profile's topics
 * (health focus and goals) pick the nutrients; the reason is the person's own
 * choice in plain words. Facts only: an amount, never a verdict, a target, or a
 * comparison to a limit. Pure data, so the meal form can use it in the browser.
 */

export type NutrientKey = "calories" | "sodium" | "saturatedFat" | "fiber" | "carbohydrates" | "protein" | "sugars";

const NUTRIENTS: Record<NutrientKey, { label: string; unit: "g" | "mg" | "kcal" }> = {
  calories: { label: "Calories", unit: "kcal" },
  sodium: { label: "Sodium", unit: "mg" },
  saturatedFat: { label: "Saturated fat", unit: "g" },
  fiber: { label: "Fiber", unit: "g" },
  carbohydrates: { label: "Carbs", unit: "g" },
  protein: { label: "Protein", unit: "g" },
  sugars: { label: "Sugars", unit: "g" },
};

const TOPIC_NUTRIENTS: Record<string, NutrientKey[]> = {
  sodium: ["sodium"],
  "blood pressure": ["sodium"],
  "saturated fat": ["saturatedFat"],
  cholesterol: ["saturatedFat"],
  fiber: ["fiber"],
  diabetes: ["carbohydrates", "fiber"],
};

/** Shown when nothing in the profile points at a nutrient. */
const EVERYDAY: NutrientKey[] = ["protein", "fiber", "sodium"];

export type NutrientFocus = { key: NutrientKey; label: string; reason: string };

/** Up to two nutrients the person's profile makes relevant, strongest first. */
export function nutrientFocus(topics: readonly TopicWeight[]): NutrientFocus[] {
  const focus: NutrientFocus[] = [];
  for (const topic of topics) {
    for (const key of TOPIC_NUTRIENTS[topic.topic] ?? []) {
      if (focus.length < 2 && !focus.some((item) => item.key === key)) {
        focus.push({ key, label: NUTRIENTS[key].label, reason: topic.reason });
      }
    }
  }
  return focus;
}

export type NutrientFact = { key: NutrientKey; label: string; value: string; focus: boolean };

function format(value: number, unit: "g" | "mg" | "kcal"): string {
  const rounded = value > 0 && value < 1 ? "under 1" : value < 10 ? String(Math.round(value * 10) / 10) : String(Math.round(value));
  return unit === "kcal" ? `${rounded} cal` : `${rounded} ${unit}`;
}

/**
 * Up to four facts for a food: the person's focus nutrients first (marked),
 * then everyday ones. Gentle Food Mode never shows calories.
 */
export function nutrientFacts(
  food: Pick<NutritionFood, NutrientKey>,
  focus: readonly NutrientFocus[],
  gentleFoodMode: boolean,
): NutrientFact[] {
  const order: NutrientKey[] = [
    ...focus.map((item) => item.key),
    ...(gentleFoodMode ? [] : (["calories"] as NutrientKey[])),
    ...EVERYDAY,
  ];
  const facts: NutrientFact[] = [];
  for (const key of order) {
    if (facts.length >= 4 || facts.some((fact) => fact.key === key)) continue;
    if (gentleFoodMode && key === "calories") continue;
    const value = food[key];
    if (value === null || value === undefined) continue;
    facts.push({
      key,
      label: NUTRIENTS[key].label,
      value: format(value, NUTRIENTS[key].unit),
      focus: focus.some((item) => item.key === key),
    });
  }
  return facts;
}

/** Group labels USDA puts before the food ("Cereals, oats, …", "Fish, salmon, …"). */
const GROUP_LABELS = new Set(["cereals", "beverages", "snacks", "fast foods", "fast food", "restaurant", "spices", "fish", "babyfood"]);

/**
 * A USDA name made readable: the food (with a short second part such as
 * "breast" or "black") first, the rest as detail. "Cereals, oats, instant,
 * prepared with water" → { name: "Oats, instant", detail: "prepared with water" }.
 */
export function splitFoodName(description: string): { name: string; detail: string } {
  let parts = description.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1 && GROUP_LABELS.has(parts[0].toLowerCase())) parts = parts.slice(1);
  const short = parts[1] && parts[1].split(/\s+/).length <= 2 && !/\d/.test(parts[1]);
  const nameParts = short ? parts.slice(0, 2) : parts.slice(0, 1);
  const name = nameParts.join(", ");
  return { name: name.charAt(0).toUpperCase() + name.slice(1), detail: parts.slice(nameParts.length).join(", ") };
}
