import { describe, expect, it } from "vitest";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { unlockedAchievements } from "@/lib/gamification/achievements";
import { questPeriod } from "@/lib/gamification/quest-period";
import { evaluateSafety } from "@/lib/safety/evaluate";
import { DEMO_FOODS } from "@/lib/nutrition/catalog";
import { nutritionSummary } from "@/lib/nutrition/summary";
import { normalizeVisitQuestion } from "@/lib/visit/questions";

const user: DemoUser = {
  id: "user-1",
  email: "person@example.com",
  birthDate: "1990-01-01",
  goals: ["understand_nutrition"],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
};

describe("nutrition summary", () => {
  it("lists available nutrients and hides calories in Gentle Food Mode", () => {
    const food = DEMO_FOODS[0];
    expect(nutritionSummary(food, false)).toContain("240 kcal");
    expect(nutritionSummary(food, false)).toContain("Sodium 60 mg");
    expect(nutritionSummary(food, true)).not.toContain("kcal");
    expect(nutritionSummary(food, true)).toContain("Saturated fat 7 g");
  });
});

describe("quest week", () => {
  it("uses the Monday of that calendar week", () => {
    expect(questPeriod("2026-09-24")).toBe("2026-09-21");
    expect(questPeriod("2026-09-21")).toBe("2026-09-21");
  });
});

describe("visit questions", () => {
  it("rejects a blank question and does not treat an emergency line as a saved question", () => {
    expect(normalizeVisitQuestion("  ")).toEqual({ ok: false, reason: "empty" });
    expect(normalizeVisitQuestion("a".repeat(281)).ok).toBe(false);
    const emergency = "I can't breathe";
    expect(evaluateSafety(emergency).emergency).toBe(true);
    expect(normalizeVisitQuestion("What does LDL mean on my lab sheet?").ok).toBe(true);
  });
});

describe("meals and marks", () => {
  it("removes one meal and keeps the points", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    store.addMeal({
      id: "m1",
      userId: user.id,
      foodName: "oats",
      quantity: "1",
      servingUnit: "cup",
      preparation: "",
      approximateCost: "",
      notes: "",
      fdcId: null,
      nutritionDemo: true,
      createdAt: "2026-09-24T16:00:00.000Z",
      explanation: null,
    });
    store.award({ userId: user.id, eventType: "meal_logged", sourceEntityId: "m1" });
    store.deleteMeal(user.id, "m1");
    expect(store.listMeals(user.id)).toHaveLength(0);
    expect(store.listXp(user.id)).toHaveLength(1);
  });

  it("marks a first meal as participation", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    expect(unlockedAchievements(store, user.id)).toHaveLength(0);
    store.addMeal({
      id: "m1",
      userId: user.id,
      foodName: "oats",
      quantity: "1",
      servingUnit: "cup",
      preparation: "",
      approximateCost: "",
      notes: "",
      fdcId: null,
      nutritionDemo: true,
      createdAt: "2026-09-24T16:00:00.000Z",
      explanation: null,
    });
    expect(unlockedAchievements(store, user.id).map((item) => item.id)).toContain("first-meal");
  });
});
