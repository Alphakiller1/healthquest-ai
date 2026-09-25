import type { DemoStore, DemoUser } from "@/lib/demo/store";
import { CONTEXT_TOPICS, GOAL_TOPICS } from "@/lib/evidence/select";
import { engagementDates } from "@/lib/gamification/engagement-dates";
import { questPeriod } from "@/lib/gamification/quest-period";
import type { QuestView } from "@/lib/gamification/quests";
import { usCalendarDate } from "@/lib/health/calendar";
import { HEALTH_CONTEXTS, resolveCoachingMode } from "@/lib/health/contexts";
import { LESSONS, type Lesson } from "@/lib/learn/lessons";

/*
 * Deterministic personalisation. It turns the person's own choices into topic
 * weights, then ranks lessons, quests, and suggested questions, always with a
 * plain reason. It never infers a condition, scores health, or reads meal
 * content as good or bad.
 */

export type TopicWeight = { topic: string; weight: number; reason: string };

const GOAL_REASON: Record<string, string> = {
  understand_nutrition: "you want to understand how meals fit",
  move_more: "you're building a movement habit",
  sleep_better: "you want steadier sleep",
  affordable_meals: "you're looking for budget-friendly meals",
  prepare_for_visit: "you're preparing for a visit",
};

/** Everything the profile makes relevant, strongest first. */
export function profileTopics(user: DemoUser): TopicWeight[] {
  const found = new Map<string, TopicWeight>();
  const add = (topic: string, weight: number, reason: string) => {
    const existing = found.get(topic);
    if (!existing || existing.weight < weight) found.set(topic, { topic, weight, reason });
  };
  for (const id of user.healthContextIds ?? []) {
    const label = HEALTH_CONTEXTS.find((context) => context.id === id)?.label.toLowerCase();
    for (const topic of CONTEXT_TOPICS[id] ?? []) add(topic, 2, `you chose ${label ?? "this topic"}`);
  }
  for (const id of user.goals) {
    for (const topic of GOAL_TOPICS[id] ?? []) add(topic, 1.5, GOAL_REASON[id] ?? "it's one of your goals");
  }
  const profile = user.profile;
  if (profile?.budget === "tight") add("affordable", 2, "you said your grocery budget is tight");
  if (profile?.budget === "moderate") add("affordable", 1, "cost matters to you");
  if (profile?.sleepTypical === "under_6" || profile?.sleepTypical === "varies") add("sleep", 1.5, "your sleep is often short or uneven");
  if (profile?.activityBaseline === "rarely") add("movement", 1, "you're starting to move more");
  if ((user.familyHistoryCategories ?? []).length > 0) add("family history", 1, "you noted family history");
  return [...found.values()].sort((a, b) => b.weight - a.weight);
}

const LESSON_TOPICS: Record<string, string[]> = {
  cholesterol: ["cholesterol"],
  "saturated-fat": ["saturated fat", "cholesterol"],
  "food-labels": ["label"],
  "affordable-meals": ["affordable"],
  sleep: ["sleep"],
  activity: ["movement"],
  "family-history": ["family history"],
  "blood-pressure": ["blood pressure"],
  sodium: ["sodium", "blood pressure"],
  fiber: ["fiber", "diabetes"],
  stress: ["stress", "sleep"],
  "visit-prep": ["visit"],
};

export type RankedLesson = { lesson: Lesson; done: boolean; reason: string | null; score: number };

/**
 * Lessons ordered for this person: unread, relevant ones first. Education-only
 * profiles see only general lessons, matching how the assistant behaves.
 */
export function rankLessons(user: DemoUser, completed: ReadonlySet<string>): RankedLesson[] {
  const topics = profileTopics(user);
  const educationOnly = resolveCoachingMode(user.healthContextIds ?? []) === "education_only";
  return LESSONS.filter((lesson) => !educationOnly || lesson.general)
    .map((lesson, index) => {
      const matches = topics.filter((topic) => (LESSON_TOPICS[lesson.id] ?? []).includes(topic.topic));
      const score = matches.reduce((sum, topic) => sum + topic.weight, 0);
      return {
        lesson,
        done: completed.has(lesson.id),
        reason: matches[0] ? `Because ${matches[0].reason}` : null,
        score: score - index * 0.001,
      };
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || b.score - a.score);
}

const QUEST_TOPICS: Record<string, string[]> = {
  "learn-labels": ["label"],
  "move-week": ["movement"],
  "budget-meals": ["affordable"],
  "sleep-notes": ["sleep"],
  "heart-lesson": ["cholesterol", "blood pressure"],
};

export type RankedQuest = QuestView & { reason: string | null };

/** Active quests ordered by how close they are to done, then by relevance. */
export function rankQuests(quests: QuestView[], user: DemoUser): RankedQuest[] {
  const topics = profileTopics(user);
  const progressOf = (quest: QuestView) => {
    const match = /(\d+) of (\d+)/.exec(quest.progress);
    return match ? Number(match[1]) / Number(match[2]) : 0;
  };
  return quests
    .map((quest) => {
      const match = topics.find((topic) => (QUEST_TOPICS[quest.id] ?? []).includes(topic.topic));
      const relevance = match?.weight ?? 0;
      const progress = progressOf(quest);
      return {
        quest: { ...quest, reason: progress > 0 ? "You're partway there" : match ? `Because ${match.reason}` : null },
        score: (quest.status === "active" ? 10 : 0) + progress * 4 + relevance,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.quest);
}

const TOPIC_QUESTIONS: Record<string, string> = {
  cholesterol: "What do LDL and HDL mean?",
  "saturated fat": "Why does saturated fat matter for cholesterol?",
  "blood pressure": "What do the two blood pressure numbers mean?",
  sodium: "Where does most sodium come from?",
  affordable: "What are affordable foods with fiber?",
  sleep: "How can I get more consistent sleep?",
  movement: "What counts as movement?",
  "family history": "What does family history mean for my health?",
  label: "How do I compare two nutrition labels?",
  diabetes: "What is prediabetes?",
  fiber: "What are easy sources of fiber?",
  stress: "What can help with everyday stress?",
  visit: "What should I ask my doctor at my next visit?",
};

/** Ask suggestions led by the person's own topics. */
export function suggestedQuestions(user: DemoUser, count = 6): string[] {
  const fromProfile = profileTopics(user).map((topic) => TOPIC_QUESTIONS[topic.topic]).filter(Boolean);
  const general = ["What does family history mean for my health?", "What should I ask my doctor at my next visit?", "How can I get more consistent sleep?", "What are affordable foods with fiber?"];
  return [...new Set([...fromProfile, ...general])].slice(0, count);
}

export type WeeklyReflection = {
  activeDays: number;
  meals: number;
  movementSessions: number;
  movementMinutes: number;
  sleepNights: number;
  averageSleep: number | null;
  lessons: number;
  lines: string[];
};

/**
 * A plain description of what the person logged this week. Counts and
 * averages only: no "good", "bad", "improving", or targets.
 */
export function weeklyReflection(store: DemoStore, user: DemoUser, today = usCalendarDate(new Date().toISOString())): WeeklyReflection {
  const monday = questPeriod(today);
  const inWeek = (day: string) => questPeriod(day) === monday && day <= today;
  const meals = store.listMeals(user.id).filter((meal) => inWeek(usCalendarDate(meal.createdAt))).length;
  const activities = store.listActivities(user.id).filter((item) => inWeek(item.loggedOn));
  const sleep = store
    .listHabits(user.id)
    .filter((habit) => inWeek(habit.loggedOn) && habit.sleepHours !== null)
    .map((habit) => habit.sleepHours as number);
  const lessons = store.listLessonCompletions(user.id).filter((item) => inWeek(usCalendarDate(item.completedAt))).length;
  const activeDays = new Set(engagementDates(store, user.id).filter(inWeek)).size;
  const movementMinutes = activities.reduce((sum, item) => sum + item.durationMinutes, 0);
  const averageSleep = sleep.length ? Math.round((sleep.reduce((a, b) => a + b, 0) / sleep.length) * 10) / 10 : null;

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const lines: string[] = [];
  if (activeDays === 0) {
    lines.push("Nothing logged yet this week. Your week starts whenever you do.");
  } else {
    lines.push(`You showed up on ${plural(activeDays, "day")} this week.`);
    if (activities.length) lines.push(`${plural(activities.length, "movement session")}, ${movementMinutes} minutes in all.`);
    if (meals) lines.push(`${plural(meals, "meal")} logged.`);
    if (averageSleep !== null) lines.push(`Sleep noted on ${plural(sleep.length, "night")}, averaging ${averageSleep} hours.`);
    if (lessons) lines.push(`${plural(lessons, "lesson")} finished.`);
  }
  return { activeDays, meals, movementSessions: activities.length, movementMinutes, sleepNights: sleep.length, averageSleep, lessons, lines };
}
