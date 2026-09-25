import type { DemoStore, DemoUser } from "@/lib/demo/store";
import { unlockedAchievements } from "@/lib/gamification/achievements";
import { engagementDates } from "@/lib/gamification/engagement-dates";
import { LEVELS, levelForXp, type LevelName } from "@/lib/gamification/levels";
import { questPeriod } from "@/lib/gamification/quest-period";
import { questViews, type QuestView } from "@/lib/gamification/quests";
import { XP_VALUES, totalXp } from "@/lib/gamification/xp";
import { usCalendarDate } from "@/lib/health/calendar";
import { rankLessons, rankQuests, weeklyReflection, type RankedLesson, type RankedQuest } from "@/lib/profile/personalize";

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
  symbol: QuestPresentation["symbol"] | "question";
  progress?: { done: number; total: number };
  rewardXp?: number;
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
  quest: (QuestView & { steps: { done: number; total: number }; presentation: QuestPresentation; reason?: string | null }) | null;
  questsDoneThisWeek: number;
  lesson: { id: string; title: string; minutes: number; rewardXp: number; reason: string } | null;
  recentWin: { title: string; detail: string } | null;
  /** Plain counts of what was logged this week. */
  reflection: string[];
  /** Whether the person has filled in their health profile yet. */
  profileSet: boolean;
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

/**
 * The one next step on Today. First-run steps come first; after that, a quest
 * one step from done, a morning sleep note when sleep is a focus, the quest
 * the profile ranks highest, then the best-matched unread lesson. Every step
 * says why it was picked, in the person's own terms.
 */
export function focusForToday(
  store: DemoStore,
  user: DemoUser,
  context: {
    now?: Date;
    quest?: (RankedQuest & { steps: { done: number; total: number } }) | null;
    lesson?: RankedLesson | null;
  } = {},
): TodayFocus {
  const now = context.now ?? new Date();
  const goals = new Set(user.goals);
  const meals = store.listMeals(user.id).length;
  const movement = store.listActivities(user.id).length;
  const questions = store.listVisitQuestions(user.id).length;
  const today = usCalendarDate(now.toISOString());
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now));

  if ((goals.size === 0 || goals.has("understand_nutrition") || goals.has("affordable_meals")) && meals === 0) {
    return {
      title: "Log one meal you already eat",
      why: "One familiar meal is enough to start. You can add a cost if you want.",
      href: "/journal",
      label: "Log a meal",
      symbol: "bowl",
    };
  }
  if (goals.has("move_more") && movement === 0) {
    return {
      title: "Log one movement you choose",
      why: "A walk or chores counts. HealthQuest does not estimate calories burned.",
      href: "/move",
      label: "Log movement",
      symbol: "motion",
    };
  }

  const quest = context.quest;
  const presentation = quest ? QUEST_PRESENTATION[quest.id] : undefined;
  if (quest && presentation && quest.steps.total > 1 && quest.steps.total - quest.steps.done === 1) {
    return {
      title: `One more to finish your ${presentation.category.toLowerCase()}`,
      why: `${quest.steps.done} of ${quest.steps.total} done this week. ${presentation.why}`,
      href: presentation.action.href,
      label: presentation.action.label,
      symbol: presentation.symbol,
      progress: quest.steps,
      rewardXp: presentation.rewardXp,
    };
  }

  const sleepFocus = goals.has("sleep_better") || user.profile?.sleepTypical === "under_6" || user.profile?.sleepTypical === "varies";
  const sleptNoted = store.listHabits(user.id).some((habit) => habit.loggedOn === today && habit.sleepHours !== null);
  if (sleepFocus && hour >= 5 && hour < 12 && !sleptNoted) {
    return {
      title: "Note how long you slept",
      why: "It takes a few seconds. A few nights of notes shows your own pattern — it isn't a diagnosis.",
      href: "/habits",
      label: "Add a sleep note",
      symbol: "moon",
    };
  }

  if (goals.has("prepare_for_visit") && questions === 0) {
    return {
      title: "Write one question for a clinician",
      why: "HealthQuest stores the question for your visit. It does not answer it as medical advice.",
      href: "/visit",
      label: "Write a question",
      symbol: "question",
    };
  }

  if (quest && presentation) {
    return {
      title: quest.detail.replace(/\.$/, ""),
      why: quest.reason ? `${quest.reason}. ${presentation.why}` : presentation.why,
      href: presentation.action.href,
      label: presentation.action.label,
      symbol: presentation.symbol,
      progress: quest.steps.total > 1 ? quest.steps : undefined,
      rewardXp: presentation.rewardXp,
    };
  }

  const lesson = context.lesson;
  if (lesson && !lesson.done) {
    return {
      title: `Read “${lesson.lesson.title}”`,
      why: `${lesson.reason ?? "A short lesson"}. About ${lesson.lesson.minutes} minutes.`,
      href: `/learn/${lesson.lesson.id}`,
      label: "Read the lesson",
      symbol: "book",
      rewardXp: XP_VALUES.lesson_completed + XP_VALUES.quiz_completed,
    };
  }

  return {
    title: "Log another meal when you're ready",
    why: "Small actions count. You can come back any time.",
    href: "/journal",
    label: "Log a meal",
    symbol: "bowl",
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
  // Ranked by progress, then by what the person's profile makes relevant.
  const ranked = rankQuests(quests, user).filter((item) => item.status === "active");
  const pick = ranked[0] ? { ...ranked[0], steps: questSteps(ranked[0]) } : null;
  const quest = pick ? { ...pick, presentation: QUEST_PRESENTATION[pick.id] } : null;

  const done = new Set(store.listLessonCompletions(user.id).map((item) => item.lessonId));
  const questLesson = quest?.presentation.action.href.startsWith("/learn/")
    ? quest.presentation.action.href.split("/").pop()
    : undefined;
  const rankedLesson = rankLessons(user, done).find((item) => !item.done && item.lesson.id !== questLesson) ?? null;
  const nextLesson = rankedLesson?.lesson ?? null;

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
    focus: focusForToday(store, user, { now, quest: pick, lesson: rankedLesson }),
    reflection: weeklyReflection(store, user, today).lines,
    profileSet: Boolean(user.profile?.updatedAt),
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
          reason: rankedLesson?.reason ?? "One thing to learn",
        }
      : null,
    recentWin: latest ? { title: latest.title, detail: latest.detail } : null,
  };
}
