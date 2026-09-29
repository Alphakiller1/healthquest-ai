import { describe, expect, it } from "vitest";
import { createMemoryStore, type DemoUser, type MealRecord } from "@/lib/demo/store";
import { afterMeal, usualMeals } from "@/lib/journey/meal-context";
import { explainMeal, recordMeal } from "@/lib/journey/record-meal";
import { nutrientFacts, nutrientFocus, splitFoodName } from "@/lib/nutrition/focus";
import { createDemoNutritionProvider } from "@/lib/nutrition/provider";
import { profileTopics } from "@/lib/profile/personalize";

const adult: DemoUser = {
  id: "u1",
  email: "a@test.dev",
  birthDate: "1980-01-01",
  goals: ["understand_nutrition"],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
  healthContextIds: ["high_blood_pressure"],
};

const food = { calories: 89, sodium: 1, saturatedFat: 0.1, fiber: 2.6, carbohydrates: 23, protein: 1.1, sugars: 12 };

const meal = (name: string, at: number, extra: Partial<MealRecord> = {}): MealRecord => ({
  id: `m${at}`,
  userId: adult.id,
  foodName: name,
  quantity: "",
  servingUnit: "",
  preparation: "",
  approximateCost: "",
  notes: "",
  fdcId: null,
  nutritionDemo: false,
  createdAt: new Date(Date.UTC(2026, 8, 20, at)).toISOString(),
  explanation: null,
  ...extra,
});

describe("goal focus", () => {
  it("puts the nutrient behind the person's own choice first, with that choice as the reason", () => {
    const focus = nutrientFocus(profileTopics(adult));
    expect(focus[0]).toMatchObject({ key: "sodium", label: "Sodium" });
    expect(focus[0].reason).toMatch(/high blood pressure/i);
    const facts = nutrientFacts(food, focus, false);
    expect(facts[0]).toMatchObject({ key: "sodium", focus: true, value: "1 mg" });
    expect(facts.length).toBeLessThanOrEqual(4);
  });

  it("has no focus when nothing in the profile points at a nutrient, and shows everyday facts", () => {
    const focus = nutrientFocus(profileTopics({ ...adult, healthContextIds: [], goals: [] }));
    expect(focus).toEqual([]);
    expect(nutrientFacts(food, focus, false).map((fact) => fact.key)).toEqual(["calories", "protein", "fiber", "sodium"]);
  });

  it("never shows calories in Gentle Food Mode", () => {
    const facts = nutrientFacts(food, [], true);
    expect(facts.some((fact) => fact.key === "calories")).toBe(false);
  });

  it("states amounts only — no verdict words", () => {
    const text = JSON.stringify(nutrientFacts(food, nutrientFocus(profileTopics(adult)), false));
    expect(text).not.toMatch(/\b(good|bad|high|low|healthy|unhealthy|too much|limit)\b/i);
  });

  it("reads USDA names with the recognisable part first", () => {
    expect(splitFoodName("Bananas, raw")).toEqual({ name: "Bananas, raw", detail: "" });
    expect(splitFoodName("Oatmeal")).toEqual({ name: "Oatmeal", detail: "" });
    expect(splitFoodName("Cereals, oats, instant, fortified, prepared with water")).toEqual({
      name: "Oats, instant",
      detail: "fortified, prepared with water",
    });
    expect(splitFoodName("Rice, white, long grain, unenriched, raw")).toEqual({ name: "Rice, white", detail: "long grain, unenriched, raw" });
    expect(splitFoodName("Fast foods, cheeseburger, double, regular patty and bun, with condiments").name).toBe("Cheeseburger, double");
  });
});

describe("your usual", () => {
  it("puts repeated meals first, then the most recent, one chip per food", () => {
    const list = usualMeals([
      meal("toast", 1),
      meal("Oatmeal", 2),
      meal("salad", 3),
      meal("oatmeal ", 4, { portion: "small" }),
    ]);
    expect(list.map((item) => item.foodName)).toEqual(["oatmeal", "salad", "toast"]);
    expect(list[0]).toMatchObject({ times: 2, portion: "small" });
  });
});

describe("after a meal is saved", () => {
  const focus = nutrientFocus(profileTopics(adult));

  it("connects matched facts to the person's focus, with the reason", () => {
    const saved = meal("banana", 5, {
      nutrition: { description: "Bananas, raw", servingLabel: "per 100 g", sourceDataset: "SR Legacy", ...food },
    });
    const after = afterMeal(adult, saved, focus, new Set(), false);
    expect(after.focusLine).toBe("Sodium 1 mg per 100 g · USDA: Bananas, raw");
    expect(after.focusReason).toMatch(/high blood pressure/i);
    expect(after.focusNudge).toBeNull();
  });

  it("without facts, says how to see the focus next time", () => {
    const after = afterMeal(adult, meal("soup", 6), focus, new Set(), false);
    expect(after.focusLine).toBeNull();
    expect(after.focusNudge).toMatch(/sodium/);
  });

  it("suggests the lesson about what was eaten, and skips finished ones", () => {
    expect(afterMeal(adult, meal("salty chips", 7), focus, new Set(), false).lesson?.id).toBe("sodium");
    expect(afterMeal(adult, meal("salty chips", 7), focus, new Set(["sodium"]), false).lesson?.id).not.toBe("sodium");
  });
});

describe("meal explanations", () => {
  it("fall back to reviewed sources when the model fails, and count the model call", async () => {
    const store = createMemoryStore();
    store.saveUser(adult);
    const saved = await recordMeal({
      store,
      user: adult,
      draft: { foodName: "oatmeal", quantity: "", servingUnit: "", preparation: "", approximateCost: "", notes: "", fdcId: null },
      nutrition: createDemoNutritionProvider(),
    });
    if (saved.status !== "saved") throw new Error("not saved");
    const explanation = await explainMeal({
      store,
      user: adult,
      meal: saved.meal,
      assistant: { async generate() { throw new Error("429 insufficient_quota"); } },
      assistantDemo: false,
    });
    expect(explanation.summary.length).toBeGreaterThan(20);
    expect(explanation.summary).not.toMatch(/isn't a checked explanation/);
    expect(explanation.sourceIds.length).toBeGreaterThan(0);
    expect(store.countAssistantUses(adult.id, new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date()))).toBe(1);
  });

  it("ignore an unknown time of day or size instead of storing it", async () => {
    const store = createMemoryStore();
    store.saveUser(adult);
    const saved = await recordMeal({
      store,
      user: adult,
      draft: { foodName: "tea", quantity: "", servingUnit: "", preparation: "", approximateCost: "", notes: "", fdcId: null, mealSlot: "brunch<script>", portion: "huge" },
      nutrition: null,
    });
    if (saved.status !== "saved") throw new Error("not saved");
    expect(saved.meal.mealSlot).toBeUndefined();
    expect(saved.meal.portion).toBeUndefined();
  });
});
