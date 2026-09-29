import { describe, expect, it } from "vitest";
import { aliasFor, rankUsdaMatches } from "@/lib/nutrition/rank";
import type { NutritionFood } from "@/lib/nutrition/types";

// Real FoodData Central names, in the order USDA's own search returned them (2026-09-28).
const food = (fdcId: number, description: string): NutritionFood => ({
  fdcId: String(fdcId),
  description,
  servingLabel: "per 100 g",
  calories: null,
  protein: null,
  carbohydrates: null,
  fiber: null,
  totalFat: null,
  saturatedFat: null,
  sodium: null,
  sugars: null,
  retrievedAt: "2026-09-28",
  sourceDataset: "FoodData Central SR Legacy",
  demo: false,
});

const top = (query: string, list: NutritionFood[]) =>
  rankUsdaMatches(query, list, aliasFor(query))[0]?.description;

describe("USDA match ranking", () => {
  it("finds cooked oats for 'oatmeal', not oatmeal bread or cookies", () => {
    expect(
      top("oatmeal", [
        food(1, "Bread, oatmeal"),
        food(2, "Cookies, oatmeal, with raisins"),
        food(3, "Oat bran, cooked"),
        food(4, "Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt"),
      ]),
    ).toMatch(/^Cereals, oats/);
  });

  it("puts apples before other things with 'apple' in the name", () => {
    expect(
      top("apple", [
        food(1, "Croissants, apple"),
        food(2, "Strudel, apple"),
        food(3, "Mammy-apple, (mamey), raw"),
        food(4, "Apples, fuji, with skin, raw"),
      ]),
    ).toBe("Apples, fuji, with skin, raw");
  });

  it("reads a name split over two parts, and prefers it to deli and breaded versions", () => {
    expect(
      top("chicken breast", [
        food(1, "Lunchmeat, chicken breast, sliced"),
        food(2, "Chicken breast tenders, breaded, uncooked"),
        food(3, "Chicken breast, roll, oven-roasted"),
        food(4, "Chicken, breast, boneless, skinless, raw"),
      ]),
    ).toBe("Chicken, breast, boneless, skinless, raw");
    expect(
      top("black beans", [
        food(1, "Soup, black bean, canned, condensed"),
        food(2, "Beans, black, mature seeds, raw"),
      ]),
    ).toBe("Beans, black, mature seeds, raw");
  });

  it("skips baby food, powders, drinks and brands unless asked for", () => {
    expect(
      top("banana", [
        food(1, "Bananas, dehydrated, or banana powder"),
        food(2, "Babyfood, banana no tapioca, strained"),
        food(3, "Bananas, raw"),
      ]),
    ).toBe("Bananas, raw");
    expect(
      top("coffee", [
        food(1, "SILK Coffee, soymilk"),
        food(2, "Alcoholic beverage, liqueur, coffee, 53 proof"),
        food(3, "Beverages, coffee, brewed, breakfast blend"),
      ]),
    ).toBe("Beverages, coffee, brewed, breakfast blend");
    expect(top("banana powder", [food(1, "Bananas, raw"), food(2, "Bananas, dehydrated, or banana powder")])).toMatch(/powder/);
  });

  it("returns nothing rather than an unrelated food", () => {
    expect(rankUsdaMatches("quinoa", [food(1, "Bananas, raw")])).toEqual([]);
  });
});
