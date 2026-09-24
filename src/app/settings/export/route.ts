import { NextResponse } from "next/server";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { usCalendarDate } from "@/lib/health/calendar";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const store = await getDemoStore();
  const user = store.getUser(session.userId);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = {
    schemaVersion: "2026-09-24",
    exportedAt: new Date().toISOString(),
    profile: user,
    meals: store.listMeals(user.id),
    activities: store.listActivities(user.id),
    habits: store.listHabits(user.id),
    lessons: store.listLessonCompletions(user.id),
    xp: store.listXp(user.id),
    visitQuestions: store.listVisitQuestions(user.id),
    conversations: store.listConversations(user.id),
    safetyEvents: store.listSafetyEvents(user.id),
    assistantExplanationsToday: store.countAssistantUses(user.id, usCalendarDate(new Date().toISOString())),
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=healthquest-export.json",
    },
  });
}
