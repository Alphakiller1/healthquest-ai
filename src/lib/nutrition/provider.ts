import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { dataDir } from "@/lib/demo/data-dir";
import { DEMO_FOODS, searchDemoFoods } from "./catalog";
import { consumeUsdaRequest, usdaHourlyLimit, type UsdaWindow } from "./rate-limit";
import {
  selectNutritionMode,
  type NutritionFood,
  type NutritionProvider,
  type NutritionSearchResult,
} from "./types";

const UNAVAILABLE =
  "Nutrition lookup is not configured. Add a USDA FoodData Central API key before using this in production.";

export function createDemoNutritionProvider(): NutritionProvider {
  return {
    mode: "demo",
    async search(query: string): Promise<NutritionSearchResult> {
      const foods = searchDemoFoods(query);
      if (foods.length === 0) {
        return {
          status: "uncertain",
          message:
            "No sample food matched that name. You can save the meal without nutrient numbers.",
        };
      }
      return { status: "matches", foods };
    },
    async getById(fdcId: string): Promise<NutritionFood | null> {
      return DEMO_FOODS.find((food) => food.fdcId === fdcId) ?? null;
    },
  };
}

export function getNutritionProvider():
  | { ok: true; provider: NutritionProvider }
  | { ok: false; message: string } {
  const mode = selectNutritionMode({
    nodeEnv: process.env.NODE_ENV,
    apiKey: process.env.USDA_FOODDATA_API_KEY,
  });
  if (mode === "unavailable") return { ok: false, message: UNAVAILABLE };
  if (mode === "demo") return { ok: true, provider: createDemoNutritionProvider() };
  return { ok: true, provider: createUsdaNutritionProvider(process.env.USDA_FOODDATA_API_KEY!) };
}

const cachePath = resolve(dataDir(), "usda-cache.json");

function readUsdaCache(): Record<string, NutritionFood> {
  try {
    return JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, NutritionFood>;
  } catch {
    return {};
  }
}

function writeUsdaFood(food: NutritionFood) {
  const cache = readUsdaCache();
  cache[food.fdcId] = food;
  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, JSON.stringify(cache));
}

const USDA_BUSY =
  "The nutrition service is busy right now. Please try again in a little while.";

export function createUsdaNutritionProvider(apiKey: string): NutritionProvider {
  let usdaWindow: UsdaWindow = { startedAt: 0, count: 0 };
  const allowRequest = (): boolean => {
    const next = consumeUsdaRequest(usdaWindow, Date.now(), usdaHourlyLimit(apiKey));
    usdaWindow = next.window;
    return next.allowed;
  };
  return {
    mode: "usda",
    async search(query: string): Promise<NutritionSearchResult> {
      const searchOnce = async (foundationOnly: boolean): Promise<NutritionFood[] | NutritionSearchResult> => {
        if (!allowRequest()) return { status: "unavailable", message: USDA_BUSY };
        const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
        url.searchParams.set("query", query);
        url.searchParams.set("pageSize", "5");
        if (foundationOnly) url.searchParams.set("dataType", "Foundation,SR Legacy");
        url.searchParams.set("api_key", apiKey);
        const response = await fetch(url);
        if (response.status === 429) {
          return {
            status: "unavailable",
            message: "The nutrition service is busy right now. Please try again in a little while.",
          };
        }
        if (!response.ok) {
          return {
            status: "unavailable",
            message: "Nutrition lookup failed. Nothing was guessed.",
          };
        }
        const json = (await response.json()) as { foods?: unknown[] };
        return rankUsdaMatches(
          query,
          (json.foods ?? [])
            .map((food) => mapUsdaFood(food))
            .filter((food): food is NutritionFood => food !== null),
        );
      };
      const first = await searchOnce(true);
      if (!Array.isArray(first)) return first;
      const foods = first.length > 0 ? first : await searchOnce(false);
      if (!Array.isArray(foods)) return foods;
      if (foods.length === 0) {
        return {
          status: "uncertain",
          message:
            "No confident nutrition match was found. You can save the meal without nutrient numbers.",
        };
      }
      for (const food of foods) writeUsdaFood(food);
      return { status: "matches", foods };
    },
    async getById(fdcId: string): Promise<NutritionFood | null> {
      const cached = readUsdaCache()[fdcId];
      if (cached) return cached;
      if (!allowRequest()) return null;
      const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}`);
      url.searchParams.set("api_key", apiKey);
      const response = await fetch(url);
      if (!response.ok) return null;
      const food = mapUsdaFood(await response.json());
      if (food) writeUsdaFood(food);
      return food;
    },
  };
}

function nutrientValue(list: unknown, id: number): number | null {
  if (!Array.isArray(list)) return null;
  const found = list.find((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as { nutrientId?: number; nutrient?: { id?: number } };
    return record.nutrientId === id || record.nutrient?.id === id;
  }) as { value?: number; amount?: number } | undefined;
  if (typeof found?.value === "number") return found.value;
  if (typeof found?.amount === "number") return found.amount;
  return null;
}

function firstNutrient(list: unknown, ids: number[]): number | null {
  for (const id of ids) {
    const value = nutrientValue(list, id);
    if (value !== null) return value;
  }
  return null;
}

export function rankUsdaMatches(query: string, foods: NutritionFood[]): NutritionFood[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  if (terms.length === 0) return foods;
  return foods
    .map((food) => ({
      food,
      score: terms.filter((term) => food.description.toLowerCase().includes(term)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.food);
}

export function mapUsdaFood(value: unknown): NutritionFood | null {

  if (!value || typeof value !== "object") return null;
  const food = value as {
    fdcId?: number;
    description?: string;
    dataType?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: unknown;
  };
  if (!food.fdcId || !food.description) return null;
  const nutrients = food.foodNutrients;
  return {
    fdcId: String(food.fdcId),
    description: food.description,
    servingLabel:
      food.servingSize && food.servingSizeUnit
        ? `${food.servingSize} ${food.servingSizeUnit}`
        : "per 100 g",
    calories: firstNutrient(nutrients, [1008, 2047, 2048]),
    protein: firstNutrient(nutrients, [1003]),
    carbohydrates: firstNutrient(nutrients, [1005]),
    fiber: firstNutrient(nutrients, [1079, 2033]),
    totalFat: firstNutrient(nutrients, [1004]),
    saturatedFat: firstNutrient(nutrients, [1258]),
    sodium: firstNutrient(nutrients, [1093]),
    sugars: firstNutrient(nutrients, [2000, 1063, 1062]),
    retrievedAt: new Date().toISOString(),
    sourceDataset: food.dataType ? `FoodData Central ${food.dataType}` : "FoodData Central",
    demo: false,
  };
}
