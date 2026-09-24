export type NutritionFood = {
  fdcId: string;
  description: string;
  servingLabel: string;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  totalFat: number | null;
  saturatedFat: number | null;
  sodium: number | null;
  sugars: number | null;
  retrievedAt: string;
  sourceDataset: string;
  /** True only for the local sample catalog. Never treat this as USDA data. */
  demo: boolean;
};

export type NutritionSearchResult =
  | { status: "matches"; foods: NutritionFood[] }
  | { status: "uncertain"; message: string }
  | { status: "unavailable"; message: string };

export interface NutritionProvider {
  mode: "demo" | "usda";
  search(query: string): Promise<NutritionSearchResult>;
  getById(fdcId: string): Promise<NutritionFood | null>;
}

export type NutritionMode = "usda" | "demo" | "unavailable";

export function selectNutritionMode(input: {
  nodeEnv: string | undefined;
  apiKey: string | undefined;
}): NutritionMode {
  if (input.apiKey) return "usda";
  if (input.nodeEnv === "production") return "unavailable";
  return "demo";
}
