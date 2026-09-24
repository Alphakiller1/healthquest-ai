import type { DemoStore } from "@/lib/demo/store";
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
      detail: "Log one movement session you chose.",
      progress: activities > 0 ? "1 session logged" : "0 sessions logged",
      status: activities > 0 ? "completed" : "active",
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
      detail: "Record sleep duration on two nights.",
      progress: `${Math.min(sleepNights, 2)} of 2 nights with sleep`,
      status: sleepNights >= 2 ? "completed" : "active",
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
