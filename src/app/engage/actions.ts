"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { awardCompletedQuests } from "@/lib/gamification/quests";

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export async function checkIn() {
  const user = await requireOnboardedUser();
  const store = getDemoStore();
  store.award({
    userId: user.id,
    eventType: "daily_check_in",
    sourceEntityId: today(),
  });
  awardSevenDayMilestone(store, user.id);
  redirect("/dashboard");
}

export async function logActivity(formData: FormData) {
  const user = await requireOnboardedUser();
  const activityType = String(formData.get("activityType") ?? "").trim();
  const duration = Number(formData.get("durationMinutes"));
  const intensity = String(formData.get("intensity") ?? "");
  if (activityType.length < 2 || !Number.isFinite(duration) || duration <= 0) {
    redirect("/move?error=1");
  }
  if (intensity !== "easy" && intensity !== "moderate" && intensity !== "hard") {
    redirect("/move?error=1");
  }
  const store = getDemoStore();
  const id = randomUUID();
  store.addActivity({
    id,
    userId: user.id,
    activityType,
    durationMinutes: duration,
    intensity,
    loggedOn: today(),
    createdAt: new Date().toISOString(),
  });
  store.award({ userId: user.id, eventType: "activity_logged", sourceEntityId: id });
  awardCompletedQuests(store, user.id);
  awardSevenDayMilestone(store, user.id);
  redirect("/move?saved=1");
}

export async function logHabit(formData: FormData) {
  const user = await requireOnboardedUser();
  const sleep = formData.get("sleepHours");
  const water = formData.get("waterCups");
  const stress = formData.get("stressRating");
  const mood = formData.get("moodRating");
  const numberOrNull = (value: FormDataEntryValue | null) => {
    if (value === null || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const sleepHours = numberOrNull(sleep);
  const waterCups = numberOrNull(water);
  const stressRating = numberOrNull(stress);
  const moodRating = numberOrNull(mood);
  if (sleepHours !== null && (sleepHours < 0 || sleepHours > 24)) redirect("/habits?error=1");
  if (waterCups !== null && waterCups < 0) redirect("/habits?error=1");
  if (stressRating !== null && (stressRating < 1 || stressRating > 5)) redirect("/habits?error=1");
  if (moodRating !== null && (moodRating < 1 || moodRating > 5)) redirect("/habits?error=1");
  const store = getDemoStore();
  store.addHabit({
    id: randomUUID(),
    userId: user.id,
    loggedOn: today(),
    sleepHours,
    waterCups,
    stressRating,
    moodRating,
  });
  awardCompletedQuests(store, user.id);
  redirect("/habits?saved=1");
}

export async function skipQuest(formData: FormData) {
  const user = await requireOnboardedUser();
  const questId = String(formData.get("questId") ?? "");
  const store = getDemoStore();
  const current = store.getUser(user.id);
  if (!current) redirect("/login");
  store.saveUser({
    ...current,
    skippedQuestIds: [...new Set([...(current.skippedQuestIds ?? []), questId])],
  });
  redirect("/quests");
}
