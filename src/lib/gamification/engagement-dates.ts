import type { DemoStore } from "@/lib/demo/store";
import { usCalendarDate } from "@/lib/health/calendar";

export function engagementDates(store: DemoStore, userId: string): string[] {
  return [
    ...store.listMeals(userId).map((meal) => usCalendarDate(meal.createdAt)),
    ...store.listActivities(userId).map((activity) => activity.loggedOn),
    ...store
      .listXp(userId)
      .filter((event) => event.eventType === "daily_check_in")
      .map((event) => event.sourceEntityId),
    ...store.listLessonCompletions(userId).map((lesson) => usCalendarDate(lesson.completedAt)),
  ];
}
