import type { DemoStore } from "@/lib/demo/store";
import { movementTarget, sleepNightsTarget } from "@/lib/profile/profile";
import { usCalendarDate } from "@/lib/health/calendar";
import { questPeriod } from "@/lib/gamification/quest-period";

export type QuestView = {
  id: string;
  title: string;
  detail: string;
  progress: string;
  status: "active" | "completed" | "skipped";
};

function nyToday(): string {
  return usCalendarDate(new Date().toISOString());
}

function inPeriod(value: string, period: string): boolean {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : usCalendarDate(value);
  return questPeriod(day) === period;
}

export function questViews(store: DemoStore, userId: string, today = nyToday()): QuestView[] {
  const period = questPeriod(today);
  const user = store.getUser(userId);
  const skipped = new Set(user?.skippedQuestIds ?? []);
  // Targets come from the person's own profile: their chosen weekly goal, sized to their baseline.
  const moveTarget = movementTarget(user?.profile);
  const sleepTarget = sleepNightsTarget(user?.profile);
  const lessons = new Set(
    store
      .listLessonCompletions(userId)
      .filter((item) => inPeriod(item.completedAt, period))
      .map((item) => item.lessonId),
  );
  const mealsWithCost = store
    .listMeals(userId)
    .filter((meal) => meal.approximateCost.trim().length > 0 && inPeriod(meal.createdAt, period)).length;
  const activities = store.listActivities(userId).filter((item) => inPeriod(item.loggedOn, period)).length;
  const sleepNights = store
    .listHabits(userId)
    .filter((habit) => habit.sleepHours !== null && inPeriod(habit.loggedOn, period)).length;
  const quests: QuestView[] = [
    {
      id: "learn-labels",
      title: "Learn quest",
      detail: "Finish the food-label lesson.",
      progress: lessons.has("food-labels") ? "Lesson finished" : "Lesson not finished yet",
      status: lessons.has("food-labels") ? "completed" : "active",
    },
    {
      id: "move-week",
      title: "Move quest",
      detail: moveTarget === 1 ? "Log one movement session you chose." : `Log ${moveTarget} movement sessions you chose.`,
      progress: `${Math.min(activities, moveTarget)} of ${moveTarget} ${moveTarget === 1 ? "session" : "sessions"} logged`,
      status: activities >= moveTarget ? "completed" : "active",
    },
    {
      id: "budget-meals",
      title: "Budget quest",
      detail: "Log three meals with an approximate cost you entered.",
      progress: `${Math.min(mealsWithCost, 3)} of 3 meals with a cost`,
      status: mealsWithCost >= 3 ? "completed" : "active",
    },
    {
      id: "sleep-notes",
      title: "Sleep quest",
      detail: `Record sleep duration on ${sleepTarget === 2 ? "two" : "three"} nights.`,
      progress: `${Math.min(sleepNights, sleepTarget)} of ${sleepTarget} nights with sleep`,
      status: sleepNights >= sleepTarget ? "completed" : "active",
    },
    {
      id: "heart-lesson",
      title: "Heart knowledge quest",
      detail: "Finish the cholesterol lesson.",
      progress: lessons.has("cholesterol") ? "Lesson finished" : "Lesson not finished yet",
      status: lessons.has("cholesterol") ? "completed" : "active",
    },
  ];
  return quests.map((quest) =>
    skipped.has(quest.id) && quest.status !== "completed"
      ? { ...quest, status: "skipped" }
      : quest,
  );
}

export function awardCompletedQuests(store: DemoStore, userId: string, today = nyToday()): void {
  const period = questPeriod(today);
  for (const quest of questViews(store, userId, today)) {
    if (quest.status !== "completed") continue;
    store.award({
      userId,
      eventType: quest.id === "budget-meals" ? "budget_planning_completed" : "weekly_quest_completed",
      sourceEntityId: `${quest.id}:${period}`,
    });
  }
}
