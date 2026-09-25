import type { DemoStore } from "@/lib/demo/store";
import { engagementDates } from "@/lib/gamification/engagement-dates";

export type Achievement = {
  id: string;
  title: string;
  detail: string;
};

export function unlockedAchievements(store: DemoStore, userId: string): Achievement[] {
  const unlocked: Achievement[] = [];
  if (store.listMeals(userId).length > 0) {
    unlocked.push({
      id: "first-meal",
      title: "First meal logged",
      detail: "You saved a meal. That is participation, not a nutrition grade.",
    });
  }
  if (store.listActivities(userId).length > 0) {
    unlocked.push({
      id: "first-movement",
      title: "First movement logged",
      detail: "You recorded movement you chose.",
    });
  }
  if (store.listLessonCompletions(userId).length > 0) {
    unlocked.push({
      id: "first-lesson",
      title: "First lesson finished",
      detail: "You finished a short lesson.",
    });
  }
  if (new Set(engagementDates(store, userId)).size >= 7) {
    unlocked.push({
      id: "seven-days",
      title: "Seven active days",
      detail: "You showed up on seven different days.",
    });
  }
  if (store.listXp(userId).some((event) => event.eventType === "moment_completed")) {
    unlocked.push({
      id: "first-moment",
      title: "Took a moment",
      detail: "You used a Now tool when you needed it.",
    });
  }
  if (store.listVisitQuestions(userId).length > 0) {
    unlocked.push({
      id: "visit-question",
      title: "Visit question saved",
      detail: "You wrote a question to take to a clinician.",
    });
  }
  return unlocked;
}
