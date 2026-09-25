"use server";

import { randomUUID } from "node:crypto";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { awardCompletedQuests } from "@/lib/gamification/quests";
import { XP_VALUES } from "@/lib/gamification/xp";
import { usCalendarDate } from "@/lib/health/calendar";
import { encouragement, type Win } from "@/lib/moments/encouragement";
import { MOVE_OPTIONS } from "@/lib/moments/movement";

export type MomentResult = { message: string; xp: number };

const KINDS = new Set<Win>(["move", "calm", "food"]);

/**
 * Records a finished moment. Movement is also logged as an activity (with its
 * usual XP and quest progress). Moment XP is once per kind per day, so the
 * reward is for showing up, not for repeating taps.
 */
async function completeMomentAction(input: { kind: "move" | "calm" | "food"; moveId?: string; minutes?: number }): Promise<MomentResult> {
  const user = await requireOnboardedUser();
  if (!KINDS.has(input.kind)) return { message: "Saved.", xp: 0 };
  const store = await getDemoStore();
  const today = usCalendarDate(new Date().toISOString());
  let xp = 0;

  if (input.kind === "move") {
    const option = MOVE_OPTIONS.find((item) => item.id === input.moveId);
    const minutes = Math.round(Number(input.minutes));
    if (option && Number.isFinite(minutes) && minutes >= 1 && minutes <= 120) {
      const id = randomUUID();
      store.addActivity({
        id,
        userId: user.id,
        activityType: option.logAs,
        durationMinutes: minutes,
        intensity: option.intensity,
        loggedOn: today,
        createdAt: new Date().toISOString(),
      });
      if (store.award({ userId: user.id, eventType: "activity_logged", sourceEntityId: id }).awarded) {
        xp += XP_VALUES.activity_logged;
      }
      awardCompletedQuests(store, user.id);
    }
  }

  if (store.award({ userId: user.id, eventType: "moment_completed", sourceEntityId: `${input.kind}:${today}` }).awarded) {
    xp += XP_VALUES.moment_completed;
  }
  awardSevenDayMilestone(store, user.id);
  const count = store.listXp(user.id).length;
  return { message: encouragement(input.kind, `${user.id}:${today}:${count}`), xp };
}

export const completeMoment = withPersist(completeMomentAction);
