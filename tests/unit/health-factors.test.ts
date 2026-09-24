import { describe, expect, it } from "vitest";
import { activeSourceIds } from "@/lib/evidence/registry";
import { lessonsForContexts } from "@/lib/health/contextual-lessons";
import { normalizeHealthContexts } from "@/lib/health/contexts";
import { normalizeFamilyHistory } from "@/lib/health/family-history";
import { wellnessLog } from "@/lib/health/trends";
import { LESSONS } from "@/lib/learn/lessons";

describe("health topics", () => {
  it("drops unknown topic ids", () => {
    expect(normalizeHealthContexts(["sleep", "not-a-topic", "sleep"])).toEqual(["sleep"]);
  });
});

describe("family history notes", () => {
  it("keeps only known categories and drops names", () => {
    expect(normalizeFamilyHistory(["stroke", "aunt-maria", "stroke", "high_cholesterol"])).toEqual([
      "stroke",
      "high_cholesterol",
    ]);
  });
});

describe("seven day log", () => {
  it("counts logs on calendar days and leaves empty days at zero", () => {
    const days = wellnessLog({
      today: "2026-09-24",
      meals: [{ createdAt: "2026-09-24T03:00:00.000Z" }, { createdAt: "2026-09-17" }],
      activities: [{ loggedOn: "2026-09-24", durationMinutes: 20 }],
      habits: [{ loggedOn: "2026-09-22", sleepHours: 7 }, { loggedOn: "2026-09-21", sleepHours: null }],
    });
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe("2026-09-18");
    expect(days.at(-1)).toMatchObject({ date: "2026-09-24", meals: 0, movementMinutes: 20 });
    const sleepNight = days.find((day) => day.date === "2026-09-22");
    expect(sleepNight?.sleepHours).toBe(7);
    expect(days.find((day) => day.date === "2026-09-23")).toMatchObject({
      meals: 1,
      movementMinutes: 0,
      sleepHours: null,
    });
    expect(JSON.stringify(days)).not.toMatch(/risk|score|diagnos/i);
  });
});

describe("contextual lessons", () => {
  it("matches cholesterol topics without calling the set a plan", () => {
    const result = lessonsForContexts(["elevated_cholesterol"]);
    expect(result.coachingMode).toBe("contextual_education");
    expect(result.lessons.map((lesson) => lesson.id)).toContain("cholesterol");
    expect(result.lessons.map((lesson) => lesson.id)).not.toContain("sodium");
  });

  it("stays on general lessons for an education-only context", () => {
    const result = lessonsForContexts(["kidney_disease", "elevated_cholesterol"]);
    expect(result.coachingMode).toBe("education_only");
    expect(result.lessons.every((lesson) => lesson.general)).toBe(true);
    expect(result.lessons.map((lesson) => lesson.id)).not.toContain("sodium");
  });
});

describe("lesson sources", () => {
  it("cites only active registry ids", () => {
    const active = activeSourceIds();
    for (const lesson of LESSONS) {
      expect(lesson.sourceIds.length).toBeGreaterThan(0);
      for (const id of lesson.sourceIds) expect(active.has(id)).toBe(true);
      expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(lesson.quiz.answer).toBeLessThan(lesson.quiz.choices.length);
    }
  });
});
