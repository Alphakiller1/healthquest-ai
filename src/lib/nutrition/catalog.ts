import type { NutritionFood } from "./types";

const retrievedAt = "2026-09-24T00:00:00.000Z";

/** Sample foods for local development. These are not USDA records. */
export const DEMO_FOODS: readonly NutritionFood[] = [
  {
    fdcId: "demo-ribeye",
    description: "Ribeye steak, broiled",
    servingLabel: "3 oz",
    calories: 240,
    protein: 22,
    carbohydrates: 0,
    fiber: 0,
    totalFat: 16,
    saturatedFat: 7,
    sodium: 60,
    sugars: 0,
    retrievedAt,
    sourceDataset: "healthquest-demo-fixture",
    demo: true,
  },
  {
    fdcId: "demo-oats",
    description: "Oats, regular, dry",
    servingLabel: "1/2 cup",
    calories: 150,
    protein: 5,
    carbohydrates: 27,
    fiber: 4,
    totalFat: 3,
    saturatedFat: 0.5,
    sodium: 0,
    sugars: 1,
    retrievedAt,
    sourceDataset: "healthquest-demo-fixture",
    demo: true,
  },
  {
    fdcId: "demo-beans",
    description: "Black beans, canned, drained",
    servingLabel: "1/2 cup",
    calories: 110,
    protein: 7,
    carbohydrates: 20,
    fiber: 7,
    totalFat: 0.5,
    saturatedFat: 0,
    sodium: 280,
    sugars: 1,
    retrievedAt,
    sourceDataset: "healthquest-demo-fixture",
    demo: true,
  },
  {
    fdcId: "demo-apple",
    description: "Apple, raw",
    servingLabel: "1 medium",
    calories: 95,
    protein: 0,
    carbohydrates: 25,
    fiber: 4,
    totalFat: 0,
    saturatedFat: 0,
    sodium: 2,
    sugars: 19,
    retrievedAt,
    sourceDataset: "healthquest-demo-fixture",
    demo: true,
  },
];

export function searchDemoFoods(query: string): NutritionFood[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  if (terms.length === 0) return [];
  return DEMO_FOODS.filter((food) => {
    const haystack = food.description.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}
