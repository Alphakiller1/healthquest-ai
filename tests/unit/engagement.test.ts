import { describe, expect, it } from "vitest";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { levelForXp } from "@/lib/gamification/levels";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { awardCompletedQuests, questViews } from "@/lib/gamification/quests";
import { engagementStreak } from "@/lib/gamification/streaks";

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

describe("levels and streaks", () => {
  it("treats Diamond as engagement, from points only", () => {
    expect(levelForXp(0).name).toBe("Bronze");
    expect(levelForXp(500).name).toBe("Diamond");
  });

  it("welcomes someone back without a guilt message", () => {
    const status = engagementStreak(["2026-09-20"], "2026-09-24");
    expect(status.days).toBe(0);
    expect(status.message.toLowerCase()).toContain("welcome back");
    expect(status.message.toLowerCase()).not.toContain("broke");
  });

  it("counts consecutive days and allows one gap", () => {
    const status = engagementStreak(["2026-09-22", "2026-09-24"], "2026-09-24");
    expect(status.days).toBe(2);
  });
});

describe("quests", () => {
  it("completes the move quest only after an activity exists, once", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    expect(questViews(store, user.id, "2026-09-24").find((quest) => quest.id === "move-week")?.status).toBe("active");
    store.addActivity({
      id: "a1",
      userId: user.id,
      activityType: "walk",
      durationMinutes: 20,
      intensity: "easy",
      loggedOn: "2026-09-24",
      createdAt: "2026-09-24T00:00:00Z",
    });
    awardCompletedQuests(store, user.id, "2026-09-24");
    awardCompletedQuests(store, user.id, "2026-09-24");
    expect(questViews(store, user.id, "2026-09-24").find((quest) => quest.id === "move-week")?.status).toBe("completed");
    const questXp = store.listXp(user.id).filter((event) => event.eventType === "weekly_quest_completed");
    expect(questXp).toHaveLength(1);
    expect(questXp[0]?.points).toBe(40);
  });

  it("awards the budget quest at the smaller planning value", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    for (const id of ["m1", "m2", "m3"]) {
      store.addMeal({
        id,
        userId: user.id,
        foodName: "beans",
        quantity: "1",
        servingUnit: "cup",
        preparation: "",
        approximateCost: "2",
        notes: "",
        fdcId: null,
        nutritionDemo: false,
        createdAt: "2026-09-24T00:00:00.000Z",
        explanation: null,
      });
    }
    awardCompletedQuests(store, user.id, "2026-09-24");
    const points = store.listXp(user.id).find((event) => event.sourceEntityId.startsWith("budget-meals:"));
    expect(points?.points).toBe(10);
    expect(points?.eventType).toBe("budget_planning_completed");
  });
});

describe("seven active days", () => {
  it("awards 25 XP once after seven different days", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    for (let day = 1; day <= 6; day += 1) {
      store.award({
        userId: user.id,
        eventType: "daily_check_in",
        sourceEntityId: `2026-09-${String(day).padStart(2, "0")}`,
      });
    }
    expect(awardSevenDayMilestone(store, user.id)).toBe(false);
    store.award({ userId: user.id, eventType: "daily_check_in", sourceEntityId: "2026-09-07" });
    expect(awardSevenDayMilestone(store, user.id)).toBe(true);
    expect(awardSevenDayMilestone(store, user.id)).toBe(false);
    expect(store.listXp(user.id).find((event) => event.eventType === "seven_active_days")?.points).toBe(25);
  });

  it("counts a lesson day toward the seven days", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    for (let day = 1; day <= 7; day += 1) {
      store.completeLesson({
        userId: user.id,
        lessonId: `lesson-${day}`,
        quizCorrect: false,
        completedAt: `2026-09-${String(day).padStart(2, "0")}T18:00:00.000Z`,
      });
    }
    expect(awardSevenDayMilestone(store, user.id)).toBe(true);
  });
});

describe("quest progress", () => {
  it("shows how many budget meals are logged", () => {
    const store = createMemoryStore();
    store.saveUser(user);
    store.addMeal({
      id: "m1",
      userId: user.id,
      foodName: "beans",
      quantity: "1",
      servingUnit: "cup",
      preparation: "",
      approximateCost: "2",
      notes: "",
      fdcId: null,
      nutritionDemo: false,
      createdAt: "2026-09-24T00:00:00.000Z",
      explanation: null,
    });
    expect(questViews(store, user.id, "2026-09-24").find((quest) => quest.id === "budget-meals")?.progress).toBe(
      "1 of 3 meals with a cost",
    );
  });
});
