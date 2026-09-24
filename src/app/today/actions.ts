"use server";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { usCalendarDate } from "@/lib/health/calendar";
import { QUEST_PRESENTATION } from "@/lib/today/today";

/* Today's own actions return to Today with a notice, so the screen can confirm in place. */

export async function checkInToday() {
  const user = await requireOnboardedUser();
  const store = getDemoStore();
  store.award({
    userId: user.id,
    eventType: "daily_check_in",
    sourceEntityId: usCalendarDate(new Date().toISOString()),
  });
  awardSevenDayMilestone(store, user.id);
  redirect("/today?notice=checkin");
}

export async function setQuestAside(formData: FormData) {
  const user = await requireOnboardedUser();
  const questId = String(formData.get("questId") ?? "");
  if (!(questId in QUEST_PRESENTATION)) redirect("/today");
  const store = getDemoStore();
  const current = store.getUser(user.id);
  if (!current) redirect("/login");
  store.saveUser({
    ...current,
    skippedQuestIds: [...new Set([...(current.skippedQuestIds ?? []), questId])],
  });
  redirect("/today?notice=skipped");
}
