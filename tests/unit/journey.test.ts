import { describe, expect, it } from "vitest";
import { createMockAssistant } from "@/lib/ai/mock-provider";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { completeOnboarding } from "@/lib/journey/onboarding";
import { recordMeal } from "@/lib/journey/record-meal";
import { createDemoNutritionProvider } from "@/lib/nutrition/provider";
import { mapUsdaFood, rankUsdaMatches } from "@/lib/nutrition/provider";
import { selectNutritionMode } from "@/lib/nutrition/types";

const user: DemoUser = {
  id: "user-1",
  email: "person@example.com",
  birthDate: null,
  goals: [],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: false,
  blockedUnder18: false,
};

describe("onboarding", () => {
  it("does not store goals when the person is under 18", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    const result = completeOnboarding(
      store,
      user,
      {
        birthDate: "2015-01-01",
        goals: ["understand_nutrition"],
        gentleFoodMode: false,
        aiConsent: true,
        healthDataConsent: true,
        privacyAccepted: true,
        termsAccepted: true,
      },
      new Date("2026-09-24T16:00:00Z"),
    );
    expect(result.status).toBe("under_18");
    expect(store.getUser(user.id)?.goals).toEqual([]);
    expect(store.getUser(user.id)?.onboardingComplete).toBe(false);
  });

  it("turns on Gentle Food Mode when an eating-disorder context is chosen", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    completeOnboarding(
      store,
      user,
      {
        birthDate: "1990-01-01",
        goals: ["understand_nutrition"],
        gentleFoodMode: false,
        healthContextIds: ["eating_disorder_history"],
        aiConsent: true,
        healthDataConsent: true,
        privacyAccepted: true,
        termsAccepted: true,
      },
      new Date("2026-09-24T16:00:00Z"),
    );
    expect(store.getUser(user.id)?.gentleFoodMode).toBe(true);
    expect(store.getUser(user.id)?.healthContextIds).toEqual(["eating_disorder_history"]);
  });
});

describe("meal logging", () => {
  it("matches sample foods, explains from the registry, and awards XP once", async () => {
    const store = createMemoryStore();
    const adult = { ...user, onboardingComplete: true, goals: ["understand_nutrition"] };
    store.saveUser(adult);
    const nutrition = createDemoNutritionProvider();
    const search = await nutrition.search("ribeye steak");
    expect(search.status).toBe("matches");
    const saved = await recordMeal({
      store,
      user: adult,
      draft: {
        foodName: "ribeye steak",
        quantity: "3",
        servingUnit: "oz",
        preparation: "broiled",
        approximateCost: "",
        notes: "",
        fdcId: "demo-ribeye",
      },
      nutrition,
      assistant: createMockAssistant(),
      assistantDemo: true,
    });
    expect(saved.status).toBe("saved");
    if (saved.status !== "saved") return;
    expect(saved.awarded).toBe(true);
    expect(saved.totalXp).toBe(5);
    expect(saved.explanation.demo).toBe(true);
    expect(saved.explanation.sourceIds).toContain("nhlbi-blood-cholesterol");
    expect(saved.explanation.summary.toLowerCase()).not.toContain("will lower");
    const again = store.award({
      userId: adult.id,
      eventType: "meal_logged",
      sourceEntityId: saved.meal.id,
    });
    expect(again.awarded).toBe(false);
    expect(again.total).toBe(5);
  });

  it("does not guess when the food is unknown", async () => {
    const result = await createDemoNutritionProvider().search("mystery casserole");
    expect(result.status).toBe("uncertain");
  });

  it("blocks emergency text before saving", async () => {
    const store = createMemoryStore();
    store.saveUser({ ...user, onboardingComplete: true });
    const result = await recordMeal({
      store,
      user: { ...user, onboardingComplete: true },
      draft: {
        foodName: "soup",
        quantity: "",
        servingUnit: "",
        preparation: "",
        approximateCost: "",
        notes: "I have crushing chest pain",
        fdcId: null,
      },
      nutrition: createDemoNutritionProvider(),
      assistant: createMockAssistant(),
      assistantDemo: true,
    });
    expect(result.status).toBe("emergency");
    expect(store.listMeals(user.id)).toHaveLength(0);
  });
});

describe("nutrition mode", () => {
  it("reads Foundation energy from Atwater nutrient ids", () => {
    const food = mapUsdaFood({
      fdcId: 2646172,
      description: "Beef, ribeye, steak",
      dataType: "Foundation",
      foodNutrients: [
        { nutrientId: 2047, nutrientName: "Energy (Atwater General Factors)", value: 250, unitName: "KCAL" },
        { nutrientId: 1003, nutrientName: "Protein", value: 20, unitName: "G" },
        { nutrientId: 1258, nutrientName: "Fatty acids, total saturated", value: 8, unitName: "G" },
      ],
    });
    expect(food?.calories).toBe(250);
    expect(food?.saturatedFat).toBe(8);
    expect(food?.demo).toBe(false);
    expect(food?.sourceDataset).toBe("FoodData Central Foundation");
  });

  it("keeps USDA hits whose names share the query words", () => {
    const ranked = rankUsdaMatches("rolled oats", [
      { ...mapUsdaFood({ fdcId: 1, description: "Rolls, dinner, oat bran", foodNutrients: [] })! },
      { ...mapUsdaFood({ fdcId: 2, description: "Oats, whole grain, rolled, old fashioned", foodNutrients: [] })! },
    ]);
    expect(ranked.map((food) => food.fdcId)).toEqual(["2"]);
  });

  it("refuses the sample catalog in production when no USDA key is set", () => {
    expect(selectNutritionMode({ nodeEnv: "production", apiKey: undefined })).toBe("unavailable");
    expect(selectNutritionMode({ nodeEnv: "development", apiKey: undefined })).toBe("demo");
    expect(selectNutritionMode({ nodeEnv: "production", apiKey: "key" })).toBe("usda");
  });
});
