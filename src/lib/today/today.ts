import type { DemoStore, DemoUser } from "@/lib/demo/store";
import { unlockedAchievements } from "@/lib/gamification/achievements";
import { engagementDates } from "@/lib/gamification/engagement-dates";
import { LEVELS, levelForXp, type LevelName } from "@/lib/gamification/levels";
import { questPeriod } from "@/lib/gamification/quest-period";
import { questViews, type QuestView } from "@/lib/gamification/quests";
import { XP_VALUES, totalXp } from "@/lib/gamification/xp";
import { usCalendarDate } from "@/lib/health/calendar";
import { LESSONS } from "@/lib/learn/lessons";

/*
 * Everything the Today screen shows, derived from the store in one place.
 * The screen itself holds no logic, so the design-system page can render it
 * from a fixture.
 */

export type QuestPresentation = {
  category: string;
  symbol: "marker" | "motion" | "bowl" | "moon" | "heart" | "book";
  why: string;
  effort: string;
  action: { href: string; label: string };
  rewardXp: number;
};

/** Copy and symbols for each quest. Logic stays in lib/gamification/quests. */
export const QUEST_PRESENTATION: Record<string, QuestPresentation> = {
  "learn-labels": {
    category: "Learning quest",
    symbol: "book",
    why: "Serving size changes every number under it. Once you can read a label, comparing two foods takes seconds.",
    effort: "About 5 minutes",
    action: { href: "/learn/food-labels", label: "Start the lesson" },
    rewardXp: XP_VALUES.weekly_quest_completed,
  },
  "move-week": {
    category: "Movement quest",
    symbol: "motion",
    why: "Any movement you choose counts — a walk, chores, a stretch. Logging it helps you see your own week.",
    effort: "Whatever fits today",
    action: { href: "/move", label: "Log movement" },
    rewardXp: XP_VALUES.weekly_quest_completed,
  },
  "budget-meals": {
    category: "Budget quest",
    symbol: "bowl",
    why: "Writing down what a meal cost helps you notice affordable staples you already like.",
    effort: "A few seconds per meal",
    action: { href: "/journal", label: "Log a meal" },
    rewardXp: XP_VALUES.budget_planning_completed,
  },
  "sleep-notes": {
    category: "Rest quest",
    symbol: "moon",
    why: "Two nights of notes is enough to start noticing your own pattern. It is a record, not a verdict.",
    effort: "Under a minute",
    action: { href: "/habits", label: "Add a sleep note" },
    rewardXp: XP_VALUES.weekly_quest_completed,
  },
  "heart-lesson": {
    category: "Heart knowledge quest",
    symbol: "heart",
    why: "Cholesterol comes up at many checkups. Knowing the words makes that conversation easier.",
    effort: "About 4 minutes",
    action: { href: "/learn/cholesterol", label: "Start the lesson" },
    rewardXp: XP_VALUES.weekly_quest_completed,
  },
};

/**
 * Step counts for the path. quests.ts reports progress as text; until it
 * exposes counts, read "n of m" and treat single-step quests as 0/1 or 1/1.
 */
export function questSteps(quest: QuestView): { done: number; total: number } {
  const match = /(\d+) of (\d+)/.exec(quest.progress);
  if (match) return { done: Number(match[1]), total: Number(match[2]) };
  return { done: quest.status === "completed" ? 1 : 0, total: 1 };
}

export type JourneyDay = {
  date: string;
  letter: string;
  weekday: string;
  state: "done" | "current" | "todo" | "rest";
  active: boolean;
};

export type TodayFocus = {
  title: string;
  why: string;
  href: string;
  label: string;
};

export type TodayModel = {
  focus: TodayFocus;
  firstName: string | null;
  greeting: string;
  dateLabel: string;
  subline: string;
  checkedInToday: boolean;
  week: JourneyDay[];
  activeDaysThisWeek: number;
  xp: number;
  level: { name: LevelName; next: string | null; progress: number };
  quest: (QuestView & { steps: { done: number; total: number }; presentation: QuestPresentation }) | null;
  questsDoneThisWeek: number;
  lesson: { id: string; title: string; minutes: number; rewardXp: number; reason: string } | null;
  recentWin: { title: string; detail: string } | null;
};

function greetingFor(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** A first name only when the email clearly starts with one. Never guess harder. */
export function firstNameFromEmail(email: string): string | null {
  const local = email.split("@")[0] ?? "";
  const candidate = local.split(/[._+-]/)[0] ?? "";
  if (!/^[a-z]{2,14}$/i.test(candidate)) return null;
  if (["demo", "test", "user", "admin", "info", "hello", "contact", "me"].includes(candidate.toLowerCase())) return null;
  return candidate[0].toUpperCase() + candidate.slice(1).toLowerCase();
}

function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function focusForToday(store: DemoStore, user: DemoUser): TodayFocus {
  const goals = new Set(user.goals);
  const meals = store.listMeals(user.id).length;
  const movement = store.listActivities(user.id).length;
  const lessons = new Set(store.listLessonCompletions(user.id).map((item) => item.lessonId));
  const questions = store.listVisitQuestions(user.id).length;
  if ((goals.size === 0 || goals.has("understand_nutrition") || goals.has("affordable_meals")) && meals === 0) {
    return {
      title: "Log one meal you already eat",
      why: "One familiar meal is enough to start. You can add a cost if you want.",
      href: "/journal",
      label: "Log a meal",
    };
  }
  if (goals.has("move_more") && movement === 0) {
    return {
      title: "Log one movement you choose",
      why: "A walk or chores counts. HealthQuest does not estimate calories burned.",
      href: "/move",
      label: "Log movement",
    };
  }
  if (goals.has("sleep_better") && !lessons.has("sleep")) {
    return {
      title: "Read about sleep consistency",
      why: "A short lesson. It does not diagnose a sleep problem.",
      href: "/learn/sleep",
      label: "Read the lesson",
    };
  }
  if (goals.has("prepare_for_visit") && questions === 0) {
    return {
      title: "Write one question for a clinician",
      why: "HealthQuest stores the question. It does not answer it as medical advice.",
      href: "/visit",
      label: "Write a question",
    };
  }
  if (!lessons.has("food-labels")) {
    return {
      title: "Read how a food label works",
      why: "The serving size changes every number under it.",
      href: "/learn/food-labels",
      label: "Read the lesson",
    };
  }
  return {
    title: "Log another meal when you are ready",
    why: "Small actions count. You can come back any time.",
    href: "/journal",
    label: "Log a meal",
  };
}

export function buildToday(store: DemoStore, user: DemoUser, now = new Date()): TodayModel {
  const today = usCalendarDate(now.toISOString());
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now),
  );
  const events = store.listXp(user.id);
  const xp = totalXp(events);
  const levelInfo = levelForXp(xp);
  const levelIndex = LEVELS.findIndex((level) => level.name === levelInfo.name);
  const nextLevel = LEVELS[levelIndex + 1];
  const floor = LEVELS[levelIndex].min;
  const progress = nextLevel ? (xp - floor) / (nextLevel.min - floor) : 1;

  const active = new Set(engagementDates(store, user.id));
  const monday = questPeriod(today);
  const week: JourneyDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
      new Date(`${date}T12:00:00Z`),
    );
    const isActive = active.has(date);
    const state: JourneyDay["state"] =
      date === today ? "current" : date > today ? "todo" : isActive ? "done" : "rest";
    return { date, weekday, letter: weekday.slice(0, 1), state, active: isActive };
  });
  const activeDaysThisWeek = week.filter((day) => day.active).length;

  const checkedInToday = events.some(
    (event) => event.eventType === "daily_check_in" && event.sourceEntityId === today,
  );

  const quests = questViews(store, user.id, today);
  const open = quests
    .filter((quest) => quest.status === "active")
    .map((quest) => ({ ...quest, steps: questSteps(quest) }));
  const started = open.filter((quest) => quest.steps.done > 0);
  const pick = started[0] ?? open[0] ?? null;
  const quest = pick ? { ...pick, presentation: QUEST_PRESENTATION[pick.id] } : null;

  const done = new Set(store.listLessonCompletions(user.id).map((item) => item.lessonId));
  const questLesson = quest?.presentation.action.href.startsWith("/learn/")
    ? quest.presentation.action.href.split("/").pop()
    : undefined;
  const contexts = new Set(user.healthContextIds ?? []);
  const candidates = LESSONS.filter((lesson) => !done.has(lesson.id) && lesson.id !== questLesson);
  const matched = candidates.find((lesson) => lesson.contextIds.some((id) => contexts.has(id)));
  const nextLesson = matched ?? candidates.find((lesson) => lesson.general) ?? null;

  const wins = unlockedAchievements(store, user.id);
  const latest = wins.at(-1);

  const returning = !checkedInToday && !active.has(today) && active.size > 0;
  const subline = active.size === 0
    ? "A new day on your HealthQuest. Start wherever feels useful."
    : returning
      ? "Welcome back. Your quest continues."
      : active.has(today)
        ? "You showed up today. Small steps count."
        : "A new day on your HealthQuest.";

  return {
    focus: focusForToday(store, user),
    firstName: firstNameFromEmail(user.email),
    greeting: greetingFor(hour),
    dateLabel: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    }).format(now),
    subline,
    checkedInToday,
    week,
    activeDaysThisWeek,
    xp,
    level: { name: levelInfo.name, next: levelInfo.next, progress },
    quest,
    questsDoneThisWeek: quests.filter((item) => item.status === "completed").length,
    lesson: nextLesson
      ? {
          id: nextLesson.id,
          title: nextLesson.title,
          minutes: nextLesson.minutes,
          rewardXp: XP_VALUES.lesson_completed + XP_VALUES.quiz_completed,
          reason: matched ? "Picked for what you're exploring" : "One thing to learn",
        }
      : null,
    recentWin: latest ? { title: latest.title, detail: latest.detail } : null,
  };
}
