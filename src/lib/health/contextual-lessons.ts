import { resolveCoachingMode, type CoachingMode } from "@/lib/health/contexts";
import { LESSONS, type Lesson } from "@/lib/learn/lessons";

export function lessonsForContexts(contextIds: readonly string[]): {
  coachingMode: CoachingMode;
  lessons: Lesson[];
} {
  const coachingMode = resolveCoachingMode(contextIds);
  if (coachingMode === "education_only" || contextIds.length === 0) {
    return { coachingMode, lessons: LESSONS.filter((lesson) => lesson.general) };
  }
  const matched = LESSONS.filter((lesson) =>
    lesson.contextIds.some((id) => contextIds.includes(id)),
  );
  return {
    coachingMode,
    lessons: matched.length > 0 ? matched : LESSONS.filter((lesson) => lesson.general),
  };
}
