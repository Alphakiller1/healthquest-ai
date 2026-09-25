import { describe, expect, it } from "vitest";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { getClaim } from "@/lib/evidence/claims";
import { engagementDates } from "@/lib/gamification/engagement-dates";
import { CALM_TOOLS, FEELINGS, toolsFor } from "@/lib/moments/calm";
import { dailyTip, momentForHour } from "@/lib/moments/daily";
import { ALL_ENCOURAGEMENT, encouragement } from "@/lib/moments/encouragement";
import { compareLines, FOOD_SITUATIONS, foodTips } from "@/lib/moments/food";
import { MOVE_OPTIONS, pickMoves } from "@/lib/moments/movement";

const user: DemoUser = {
  id: "u1",
  email: "a@example.com",
  birthDate: "1985-01-01",
  goals: ["understand_nutrition"],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
};

describe("every moment rests on reviewed claims", () => {
  it("movement options cite active claims", () => {
    for (const option of MOVE_OPTIONS) for (const id of option.claimIds) expect(getClaim(id), `${option.id} → ${id}`).toBeTruthy();
  });

  it("calm tools cite active claims", () => {
    for (const [tool, info] of Object.entries(CALM_TOOLS)) for (const id of info.claimIds) expect(getClaim(id), `${tool} → ${id}`).toBeTruthy();
  });
});

describe("moving right now", () => {
  it("only offers what fits the place and the time", () => {
    for (const option of pickMoves({ place: "desk", minutes: 2, energy: "low" })) {
      expect(option.places).toContain("desk");
      expect(option.minMinutes).toBeLessThanOrEqual(2);
    }
  });

  it("leads with easy options when energy is low", () => {
    expect(pickMoves({ place: "home", minutes: 10, energy: "low" })[0].intensity).toBe("easy");
  });

  it("always has something for every place and time", () => {
    for (const place of ["home", "outside", "desk"] as const) {
      for (const minutes of [5, 10, 20]) expect(pickMoves({ place, minutes, energy: "some" }).length, `${place} ${minutes}`).toBeGreaterThan(0);
    }
  });
});

describe("feeling calmer", () => {
  it("never offers self-help tools when someone might hurt themselves", () => {
    expect(toolsFor("unsafe")).toEqual([]);
  });

  it("offers a few tools for every other feeling", () => {
    for (const feeling of FEELINGS.filter((item) => item.id !== "unsafe")) {
      expect(toolsFor(feeling.id).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("choosing food", () => {
  it("has tips for every situation", () => {
    for (const situation of FOOD_SITUATIONS) expect(foodTips(user, situation.id).length, situation.id).toBeGreaterThan(0);
  });

  it("leaves out calories in Gentle Food Mode", () => {
    for (const situation of FOOD_SITUATIONS) {
      expect(foodTips({ ...user, gentleFoodMode: true }, situation.id).some((claim) => /calorie/i.test(claim.claim))).toBe(false);
    }
  });

  it("leaves out foods the person doesn't eat", () => {
    const vegetarian = { ...user, profile: { eatingPatterns: ["vegetarian" as const] } };
    expect(foodTips(vegetarian, "cooking").some((claim) => /\bfish\b/i.test(claim.claim))).toBe(false);
  });

  it("keeps education-only profiles to claims safe for them", () => {
    const restricted = { ...user, healthContextIds: ["kidney_disease"] };
    for (const situation of FOOD_SITUATIONS) {
      expect(foodTips(restricted, situation.id).every((claim) => claim.educationOnlySafe)).toBe(true);
    }
  });

  it("puts sodium first at the store for someone focused on blood pressure", () => {
    const bp = { ...user, healthContextIds: ["high_blood_pressure"] };
    expect(foodTips(bp, "grocery")[0].id).toBe("sodium.label");
  });

  it("describes differences without verdicts", () => {
    const lines = compareLines(
      [
        { key: "sodium", label: "Sodium", unit: "mg", a: 800, b: 120 },
        { key: "fiber", label: "Fiber", unit: "g", a: 1, b: 1.05 },
      ],
      ["Canned soup", "Lentils"],
    );
    expect(lines).toEqual(["Lentils has less sodium than Canned soup (120 vs 800 mg)."]);
    expect(lines.join(" ")).not.toMatch(/\b(?:better|worse|healthier|unhealthy|good|bad)\b/i);
  });
});

describe("the daily layer", () => {
  it("keeps one tip all day and changes it across the week", () => {
    expect(dailyTip(user, "2026-09-25")?.id).toBe(dailyTip(user, "2026-09-25")?.id);
    const week = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];
    expect(new Set(week.map((day) => dailyTip(user, day)?.id)).size).toBeGreaterThan(2);
  });

  it("offers a moment that fits every hour", () => {
    expect(momentForHour(7).id).toBe("morning");
    expect(momentForHour(13).id).toBe("midday");
    expect(momentForHour(20).id).toBe("evening");
    expect(momentForHour(2).id).toBe("night");
  });
});

describe("positive reinforcement", () => {
  const all = Object.values(ALL_ENCOURAGEMENT).flat();

  it("never shames, shouts, or talks about bodies or food morality", () => {
    for (const line of all) {
      expect(line, line).not.toMatch(/!!|\b(?:fail|failed|bad|lazy|should have|weight|pounds|calories|cheat|guilt|crushing it)\b/i);
    }
  });

  it("varies from one moment to the next but is stable for the same moment", () => {
    expect(encouragement("move", "a")).toBe(encouragement("move", "a"));
    const seen = new Set(Array.from({ length: 20 }, (_, index) => encouragement("move", `seed-${index}`)));
    expect(seen.size).toBeGreaterThan(2);
  });

  it("a finished moment counts as showing up that day", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    store.award({ userId: user.id, eventType: "moment_completed", sourceEntityId: "calm:2026-09-25" });
    // Same kind, same day: no second reward.
    expect(store.award({ userId: user.id, eventType: "moment_completed", sourceEntityId: "calm:2026-09-25" }).awarded).toBe(false);
    expect(engagementDates(store, user.id)).toContain("2026-09-25");
  });
});
