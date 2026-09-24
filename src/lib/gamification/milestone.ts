import type { DemoStore } from "@/lib/demo/store";
import { engagementDates } from "@/lib/gamification/engagement-dates";

export function awardSevenDayMilestone(store: DemoStore, userId: string): boolean {
  const dates = new Set(engagementDates(store, userId));
  if (dates.size < 7) return false;
  return store.award({
    userId,
    eventType: "seven_active_days",
    sourceEntityId: "first",
  }).awarded;
}
