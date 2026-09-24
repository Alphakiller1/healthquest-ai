import { describe, expect, it } from "vitest";
import { ASSISTANT_LIMIT_MESSAGE } from "@/lib/ai/daily-limit";
import { runAssistantPipeline } from "@/lib/ai/pipeline";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { recordMeal } from "@/lib/journey/record-meal";
import { consumeUsdaRequest, usdaHourlyLimit } from "@/lib/nutrition/rate-limit";
import { createDemoNutritionProvider } from "@/lib/nutrition/provider";
import { activeSourceIds } from "@/lib/evidence/registry";

const user: DemoUser = {
  id: "user-1",
  email: "person@example.com",
  birthDate: "1990-01-01",
  goals: [],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
};

describe("assistant daily limit", () => {
  it("saves the meal and skips the model after the cap", async () => {
    const previous = process.env.AI_DAILY_LIMIT_FREE;
    process.env.AI_DAILY_LIMIT_FREE = "1";
    const store = createMemoryStore();
    store.saveUser(user);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
    store.recordAssistantUse(user.id, day);
    let calls = 0;
    const result = await recordMeal({
      store,
      user,
      draft: {
        foodName: "oats",
        quantity: "1",
        servingUnit: "cup",
        preparation: "",
        approximateCost: "",
        notes: "",
        fdcId: null,
      },
      nutrition: createDemoNutritionProvider(),
      assistant: {
        async generate() {
          calls += 1;
          throw new Error("should not be called");
        },
      },
      assistantDemo: true,
    });
    expect(result.status).toBe("saved");
    if (result.status === "saved") expect(result.explanation.summary).toBe(ASSISTANT_LIMIT_MESSAGE);
    expect(calls).toBe(0);
    expect(result.status === "saved" ? result.awarded : false).toBe(true);
    if (previous === undefined) delete process.env.AI_DAILY_LIMIT_FREE;
    else process.env.AI_DAILY_LIMIT_FREE = previous;
  });
});

describe("assistant failures", () => {
  it("falls back when the provider throws", async () => {
    const result = await runAssistantPipeline(
      {
        message: "How do oats fit a general eating pattern?",
        wellnessContexts: [],
        goals: [],
        gentleFoodMode: false,
        coachingMode: "contextual_education",
        allowedSourceIds: [...activeSourceIds()],
      },
      {
        async generate() {
          throw new Error("network");
        },
      },
      activeSourceIds(),
    );
    expect(result.type).toBe("fallback");
    expect(result.providerCalled).toBe(true);
  });
});

describe("USDA hourly cap", () => {
  it("uses 30 for the demo key and stops at the limit", () => {
    expect(usdaHourlyLimit("DEMO_KEY")).toBe(30);
    expect(usdaHourlyLimit("registered")).toBe(1000);
    let window = { startedAt: 1_000, count: 0 };
    for (let i = 0; i < 30; i += 1) {
      const next = consumeUsdaRequest(window, 1_000, 30);
      expect(next.allowed).toBe(true);
      window = next.window;
    }
    expect(consumeUsdaRequest(window, 1_000, 30).allowed).toBe(false);
    expect(consumeUsdaRequest(window, 1_000 + 60 * 60 * 1000, 30).allowed).toBe(true);
  });
});
