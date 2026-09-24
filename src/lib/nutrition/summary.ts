import type { NutritionFood } from "@/lib/nutrition/types";

function grams(label: string, value: number | null): string | null {
  return value === null ? null : `${label} ${value} g`;
}

/** Nutrient line for a match. Gentle Food Mode omits calories. */
export function nutritionSummary(food: NutritionFood, gentleFoodMode: boolean): string {
  const parts = [
    food.servingLabel,
    food.demo ? "Sample data, not USDA" : food.sourceDataset,
    gentleFoodMode || food.calories === null ? null : `${food.calories} kcal`,
    grams("Protein", food.protein),
    grams("Carbs", food.carbohydrates),
    grams("Fiber", food.fiber),
    grams("Fat", food.totalFat),
    grams("Saturated fat", food.saturatedFat),
    food.sodium === null ? null : `Sodium ${food.sodium} mg`,
    grams("Sugars", food.sugars),
  ];
  return parts.filter((part): part is string => part !== null).join(" · ");
}
