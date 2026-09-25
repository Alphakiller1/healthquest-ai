import { describe, expect, it } from "vitest";
import { prepareAssistantInput } from "@/lib/ai/prepare";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { questViews } from "@/lib/gamification/quests";
import { movementTarget, parseProfileForm, sleepNightsTarget } from "@/lib/profile/profile";
import { profileTopics, rankLessons, suggestedQuestions, weeklyReflection } from "@/lib/profile/personalize";
import { focusForToday } from "@/lib/today/today";

const base: DemoUser = {
  id: "u1",
  email: "a@example.com",
  birthDate: "1985-03-02",
  goals: ["understand_nutrition"],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
};

function storeWith(user: DemoUser) {
  const store = createMemoryStore();
  store.saveUser(user);
  return store;
}

describe("health profile", () => {
  it("parses only known answers and ignores junk", () => {
    const form = new FormData();
    form.set("activityBaseline", "some_days");
    form.set("budget", "tight");
    form.set("sleepTypical", "not-a-real-option");
    form.append("eatingPatterns", "vegetarian");
    form.append("eatingPatterns", "carnivore");
    const profile = parseProfileForm(form);
    // One bad field fails validation, so nothing is saved rather than a partial guess.
    expect(profile.activityBaseline).toBeUndefined();
    const clean = new FormData();
    clean.set("activityBaseline", "some_days");
    clean.set("budget", "tight");
    clean.append("eatingPatterns", "vegetarian");
    expect(parseProfileForm(clean)).toMatchObject({ activityBaseline: "some_days", budget: "tight", eatingPatterns: ["vegetarian"] });
  });

  it("sizes the movement goal to the baseline, and the person's own goal wins", () => {
    expect(movementTarget(undefined)).toBe(1);
    expect(movementTarget({ activityBaseline: "rarely" })).toBe(1);
    expect(movementTarget({ activityBaseline: "most_days" })).toBe(3);
    expect(movementTarget({ activityBaseline: "most_days", weeklyMovementGoal: 2 })).toBe(2);
  });

  it("lengthens the sleep quest when sleep is short or uneven", () => {
    expect(sleepNightsTarget({ sleepTypical: "7_to_9" })).toBe(2);
    expect(sleepNightsTarget({ sleepTypical: "under_6" })).toBe(3);
    expect(sleepNightsTarget({ sleepTypical: "varies" })).toBe(3);
  });

  it("quests follow the profile targets", () => {
    const user = { ...base, profile: { activityBaseline: "most_days" as const, sleepTypical: "varies" as const } };
    const quests = questViews(storeWith(user), user.id, "2026-09-24");
    expect(quests.find((quest) => quest.id === "move-week")?.progress).toBe("0 of 3 sessions logged");
    expect(quests.find((quest) => quest.id === "sleep-notes")?.progress).toBe("0 of 3 nights with sleep");
  });
});

describe("personalisation", () => {
  it("turns profile answers into topics with plain reasons", () => {
    const topics = profileTopics({ ...base, goals: ["sleep_better"], profile: { budget: "tight" } });
    expect(topics[0]).toMatchObject({ topic: "affordable", reason: "you said your grocery budget is tight" });
    expect(topics.map((topic) => topic.topic)).toContain("sleep");
  });

  it("ranks relevant lessons first and explains why", () => {
    const ranked = rankLessons({ ...base, goals: ["move_more"], healthContextIds: ["high_blood_pressure"] }, new Set());
    expect(["blood-pressure", "sodium"]).toContain(ranked[0].lesson.id);
    expect(ranked[0].reason).toMatch(/^Because you chose high blood pressure/);
  });

  it("keeps education-only profiles to general lessons", () => {
    const ranked = rankLessons({ ...base, healthContextIds: ["kidney_disease"] }, new Set());
    expect(ranked.every((item) => item.lesson.general)).toBe(true);
  });

  it("puts finished lessons last", () => {
    const ranked = rankLessons({ ...base, goals: ["sleep_better"] }, new Set(["sleep"]));
    expect(ranked.at(-1)?.lesson.id).toBe("sleep");
  });

  it("suggests Ask questions from the person's own topics first", () => {
    const questions = suggestedQuestions({ ...base, goals: [], healthContextIds: ["high_blood_pressure"] });
    expect(questions[0]).toBe("What do the two blood pressure numbers mean?");
  });

  it("leaves foods out of answers that the person doesn't eat", () => {
    const vegetarian = { ...base, profile: { eatingPatterns: ["vegetarian" as const] } };
    const claims = prepareAssistantInput(vegetarian, "what are unsaturated fats").claims ?? [];
    expect(claims.some((claim) => /\bfish\b/i.test(claim.claim))).toBe(false);
    const everyone = prepareAssistantInput(base, "what are unsaturated fats").claims ?? [];
    expect(everyone.some((claim) => /\bfish\b/i.test(claim.claim))).toBe(true);
  });
});

describe("today's next step", () => {
  it("offers a quest when one step remains, with the count", () => {
    const user = { ...base, goals: ["affordable_meals"] };
    const store = storeWith(user);
    store.addMeal({
      id: "m1", userId: user.id, foodName: "rice", quantity: "", servingUnit: "", preparation: "", approximateCost: "2",
      notes: "", fdcId: null, nutritionDemo: false, createdAt: new Date().toISOString(), explanation: null,
    });
    const focus = focusForToday(store, user, {
      quest: { id: "budget-meals", title: "Budget quest", detail: "Log three meals.", progress: "2 of 3 meals with a cost", status: "active", reason: null, steps: { done: 2, total: 3 } },
    });
    expect(focus.title).toBe("One more to finish your budget quest");
    expect(focus.progress).toEqual({ done: 2, total: 3 });
  });

  it("starts a brand-new person with one familiar meal", () => {
    expect(focusForToday(storeWith(base), base).title).toBe("Log one meal you already eat");
  });
});

describe("weekly reflection", () => {
  it("describes the week without judging it", () => {
    const store = storeWith(base);
    store.addActivity({ id: "a1", userId: base.id, activityType: "walk", durationMinutes: 20, intensity: "easy", loggedOn: "2026-09-22", createdAt: "2026-09-22T12:00:00Z" });
    store.addHabit({ id: "h1", userId: base.id, loggedOn: "2026-09-23", sleepHours: 6, waterCups: null, stressRating: null, moodRating: null });
    store.addHabit({ id: "h2", userId: base.id, loggedOn: "2026-09-24", sleepHours: 7, waterCups: null, stressRating: null, moodRating: null });
    const reflection = weeklyReflection(store, base, "2026-09-24");
    expect(reflection.movementMinutes).toBe(20);
    expect(reflection.averageSleep).toBe(6.5);
    const text = reflection.lines.join(" ");
    expect(text).toContain("averaging 6.5 hours");
    expect(text).not.toMatch(/\b(?:good|bad|great|poor|should|only|improv|worse|better|behind)\b/i);
  });

  it("is welcoming when nothing is logged", () => {
    expect(weeklyReflection(storeWith(base), base, "2026-09-24").lines[0]).toMatch(/whenever you do/);
  });
});
