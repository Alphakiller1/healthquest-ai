import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appendXpEvent, totalXp } from "@/lib/gamification/xp";
import { resolveCoachingMode, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { isAllowedAnalyticsEvent } from "@/lib/privacy/analytics";
import { adultEligibility } from "@/lib/privacy/eligibility";
import { buildMinimalAssistantInput } from "@/lib/privacy/payload";
import { assertPublicKeyIsNotServiceRole } from "@/lib/supabase/env";

describe("privacy payload", () => {
  it("omits email, name, and user id", () => {
    const input = buildMinimalAssistantInput({
      email: "person@example.com",
      fullName: "Ada Lovelace",
      userId: "auth-user-123",
      phone: "555-0100",
      wellnessContexts: ["elevated_cholesterol"],
      goals: ["understand_nutrition"],
      gentleFoodMode: false,
      coachingMode: "contextual_education",
      message: "How does this meal relate to cholesterol?",
      food: { description: "ribeye steak cooked with butter", nutrientStatus: "uncertain" },
      allowedSourceIds: ["nhlbi-blood-cholesterol"],
      unrelatedNotes: "takes a statin",
    });
    const serialized = JSON.stringify(input);
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("Ada Lovelace");
    expect(serialized).not.toContain("auth-user-123");
    expect(serialized).not.toContain("statin");
    expect(input.wellnessContexts).toEqual(["elevated_cholesterol"]);
  });
});

describe("analytics allowlist", () => {
  it("allows engagement events and blocks health content events", () => {
    expect(isAllowedAnalyticsEvent("lesson_completed")).toBe(true);
    expect(isAllowedAnalyticsEvent("user_has_high_cholesterol")).toBe(false);
    expect(isAllowedAnalyticsEvent("user_reported_chest_pain")).toBe(false);
  });
});

describe("age gate", () => {
  const today = new Date("2026-09-24T00:00:00Z");

  it("stops onboarding under 18", () => {
    expect(adultEligibility(new Date("2010-01-01T00:00:00Z"), today)).toEqual({
      eligible: false,
      reason: "under_18",
    });
  });

  it("allows an 18th birthday", () => {
    expect(adultEligibility(new Date("2008-09-24T00:00:00Z"), today).eligible).toBe(true);
  });
});

describe("coaching mode", () => {
  it("uses the most restrictive context", () => {
    expect(resolveCoachingMode(["elevated_cholesterol", "type_1_diabetes"])).toBe(
      "education_only",
    );
    expect(shouldRecommendGentleFoodMode(["eating_disorder_history"])).toBe(true);
  });
});

describe("xp ledger", () => {
  it("does not award the same event twice", () => {
    const first = appendXpEvent([], {
      id: "1",
      userId: "user-a",
      eventType: "meal_logged",
      sourceEntityId: "meal-1",
      createdAt: "2026-09-24T00:00:00Z",
    });
    const second = appendXpEvent(first.events, {
      id: "2",
      userId: "user-a",
      eventType: "meal_logged",
      sourceEntityId: "meal-1",
      createdAt: "2026-09-24T00:01:00Z",
    });
    expect(first.awarded).toBe(true);
    expect(second.awarded).toBe(false);
    expect(totalXp(second.events)).toBe(5);
  });
});

describe("service role boundary", () => {
  it("rejects a public key that matches the service role", () => {
    expect(() => assertPublicKeyIsNotServiceRole("same-key", "same-key")).toThrow(
      /service role/i,
    );
  });

  it("does not reference the service role key in the browser client", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/supabase/client.ts"),
      "utf8",
    );
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service_role");
  });
});
