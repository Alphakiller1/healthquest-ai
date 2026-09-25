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
    // A finished Now moment ("calm:2026-09-25") counts as showing up that day.
    ...store
      .listXp(userId)
      .filter((event) => event.eventType === "moment_completed")
      .map((event) => event.sourceEntityId.split(":")[1] ?? ""),
    ...store.listLessonCompletions(userId).map((lesson) => usCalendarDate(lesson.completedAt)),
  ];
}
