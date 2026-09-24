import { recentCalendarDates, usCalendarDate } from "@/lib/health/calendar";

export type DayLog = {
  date: string;
  meals: number;
  movementMinutes: number;
  sleepHours: number | null;
};

export function wellnessLog(input: {
  today: string;
  days?: number;
  meals: readonly { createdAt: string }[];
  activities: readonly { loggedOn: string; durationMinutes: number }[];
  habits: readonly { loggedOn: string; sleepHours: number | null }[];
}): DayLog[] {
  const days = input.days ?? 7;
  return recentCalendarDates(input.today, days).map((date) => {
    const meals = input.meals.filter((meal) => usCalendarDate(meal.createdAt) === date).length;
    const movementMinutes = input.activities
      .filter((activity) => activity.loggedOn === date)
      .reduce((sum, activity) => sum + activity.durationMinutes, 0);
    const sleep = input.habits.find((habit) => habit.loggedOn === date && habit.sleepHours !== null);
    return {
      date,
      meals,
      movementMinutes,
      sleepHours: sleep?.sleepHours ?? null,
    };
  });
}
