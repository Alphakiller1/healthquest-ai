"use server";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { awardCompletedQuests } from "@/lib/gamification/quests";
import { getLesson } from "@/lib/learn/lessons";

export async function submitLesson(formData: FormData) {
  const user = await requireOnboardedUser();
  const lessonId = String(formData.get("lessonId") ?? "");
  const lesson = getLesson(lessonId);
  if (!lesson) redirect("/learn");
  const choice = Number(formData.get("answer"));
  const correct = choice === lesson.quiz.answer;
  const store = getDemoStore();
  store.completeLesson({
    userId: user.id,
    lessonId,
    quizCorrect: correct,
    completedAt: new Date().toISOString(),
  });
  store.award({ userId: user.id, eventType: "lesson_completed", sourceEntityId: lessonId });
  if (correct) {
    store.award({ userId: user.id, eventType: "quiz_completed", sourceEntityId: lessonId });
  }
  awardCompletedQuests(store, user.id);
  awardSevenDayMilestone(store, user.id);
  redirect(`/learn/${lessonId}?result=${correct ? "correct" : "retry"}`);
}
