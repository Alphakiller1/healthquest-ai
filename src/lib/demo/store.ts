import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { cache } from "react";
import { dataDir } from "@/lib/demo/data-dir";
import { redisConfig, redisGet, redisSet } from "@/lib/demo/redis";
import {
  appendXpEvent,
  type GamificationEvent,
  type XpEventType,
} from "@/lib/gamification/xp";

export type ConsentRecord = {
  type: "ai_processing" | "health_data_processing" | "privacy_policy" | "terms";
  policyVersion: string;
  accepted: boolean;
  createdAt: string;
};

export type DemoUser = {
  id: string;
  email: string;
  birthDate: string | null;
  goals: string[];
  consents: ConsentRecord[];
  gentleFoodMode: boolean;
  aiEnabled?: boolean;
  plainLanguage?: boolean;
  highContrast?: boolean;
  saveAiConversations?: boolean;
  onboardingComplete: boolean;
  blockedUnder18: boolean;
  healthContextIds?: string[];
  familyHistoryCategories?: string[];
  skippedQuestIds?: string[];
};

export type MealRecord = {
  id: string;
  userId: string;
  foodName: string;
  quantity: string;
  servingUnit: string;
  preparation: string;
  approximateCost: string;
  notes: string;
  fdcId: string | null;
  nutritionDemo: boolean;
  createdAt: string;
  explanation: {
    summary: string;
    practicalOptions: string[];
    sourceIds: string[];
    uncertainty?: string;
    professionalFollowup?: string;
    disclaimer: string;
    demo: boolean;
  } | null;
};

export type ActivityRecord = {
  id: string;
  userId: string;
  activityType: string;
  durationMinutes: number;
  intensity: "easy" | "moderate" | "hard";
  loggedOn: string;
  createdAt: string;
};

export type HabitRecord = {
  id: string;
  userId: string;
  loggedOn: string;
  sleepHours: number | null;
  waterCups: number | null;
  stressRating: number | null;
  moodRating: number | null;
};

export type LessonCompletion = {
  userId: string;
  lessonId: string;
  quizCorrect: boolean;
  completedAt: string;
};

export type AssistantUse = {
  userId: string;
  day: string;
};

export type VisitQuestion = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  userId: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
};

export type SafetyEvent = {
  userId: string;
  category: string;
  ruleVersion: string;
  action: "medical" | "crisis";
  createdAt: string;
};

type Database = {
  users: DemoUser[];
  meals: MealRecord[];
  xp: GamificationEvent[];
  activities: ActivityRecord[];
  habits: HabitRecord[];
  lessonCompletions: LessonCompletion[];
  assistantUses: AssistantUse[];
  visitQuestions: VisitQuestion[];
  safetyEvents: SafetyEvent[];
  conversations: ConversationMessage[];
};

export type DemoStore = {
  getUser(id: string): DemoUser | null;
  getUserByEmail(email: string): DemoUser | null;
  saveUser(user: DemoUser): void;
  addMeal(meal: MealRecord): void;
  listMeals(userId: string): MealRecord[];
  deleteMeal(userId: string, mealId: string): void;
  addVisitQuestion(question: VisitQuestion): void;
  listVisitQuestions(userId: string): VisitQuestion[];
  deleteVisitQuestion(userId: string, questionId: string): void;
  recordSafetyEvent(event: SafetyEvent): void;
  listSafetyEvents(userId: string): SafetyEvent[];
  addConversation(message: ConversationMessage): void;
  listConversations(userId: string): ConversationMessage[];
  clearConversations(userId: string): void;
  addActivity(activity: ActivityRecord): void;
  listActivities(userId: string): ActivityRecord[];
  addHabit(habit: HabitRecord): void;
  listHabits(userId: string): HabitRecord[];
  completeLesson(completion: LessonCompletion): void;
  listLessonCompletions(userId: string): LessonCompletion[];
  deleteUser(userId: string): void;
  award(input: {
    userId: string;
    eventType: XpEventType;
    sourceEntityId: string;
  }): { awarded: boolean; total: number };
  listXp(userId: string): GamificationEvent[];
  countAssistantUses(userId: string, day: string): number;
  recordAssistantUse(userId: string, day: string): void;
};

function emptyDb(): Database {
  return {
    users: [],
    meals: [],
    xp: [],
    activities: [],
    habits: [],
    lessonCompletions: [],
    assistantUses: [],
    visitQuestions: [],
    safetyEvents: [],
    conversations: [],
  };
}

function normalize(raw: Partial<Database> | null | undefined): Database {
  return {
    users: raw?.users ?? [],
    meals: raw?.meals ?? [],
    xp: raw?.xp ?? [],
    activities: raw?.activities ?? [],
    habits: raw?.habits ?? [],
    lessonCompletions: raw?.lessonCompletions ?? [],
    assistantUses: raw?.assistantUses ?? [],
    visitQuestions: raw?.visitQuestions ?? [],
    safetyEvents: raw?.safetyEvents ?? [],
    conversations: raw?.conversations ?? [],
  };
}

export function createMemoryStore(initial: Database = emptyDb()): DemoStore {
  const db = structuredClone(initial);
  return createStore(() => db, () => undefined);
}

export function createFileStore(filePath = resolve(dataDir(), "demo-store.json")): DemoStore {
  const load = (): Database => {
    try {
      return normalize(JSON.parse(readFileSync(filePath, "utf8")) as Partial<Database>);
    } catch {
      return emptyDb();
    }
  };
  const save = (db: Database) => {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(db, null, 2));
  };
  return createStore(load, save);
}

function createStore(load: () => Database, save: (db: Database) => void): DemoStore {
  return {
    getUser(id) {
      return load().users.find((user) => user.id === id) ?? null;
    },
    getUserByEmail(email) {
      return load().users.find((user) => user.email === email) ?? null;
    },
    saveUser(user) {
      const db = load();
      const index = db.users.findIndex((item) => item.id === user.id);
      if (index >= 0) db.users[index] = user;
      else db.users.push(user);
      save(db);
    },
    addMeal(meal) {
      const db = load();
      db.meals.push(meal);
      save(db);
    },
    listMeals(userId) {
      return load().meals.filter((meal) => meal.userId === userId);
    },
    deleteMeal(userId, mealId) {
      const db = load();
      db.meals = db.meals.filter((meal) => !(meal.userId === userId && meal.id === mealId));
      save(db);
    },
    addVisitQuestion(question) {
      const db = load();
      db.visitQuestions.push(question);
      save(db);
    },
    listVisitQuestions(userId) {
      return load().visitQuestions.filter((question) => question.userId === userId);
    },
    deleteVisitQuestion(userId, questionId) {
      const db = load();
      db.visitQuestions = db.visitQuestions.filter(
        (question) => !(question.userId === userId && question.id === questionId),
      );
      save(db);
    },
    recordSafetyEvent(event) {
      const db = load();
      db.safetyEvents.push(event);
      save(db);
    },
    listSafetyEvents(userId) {
      return load().safetyEvents.filter((event) => event.userId === userId);
    },
    addConversation(message) {
      const db = load();
      db.conversations.push(message);
      save(db);
    },
    listConversations(userId) {
      return load().conversations.filter((message) => message.userId === userId);
    },
    clearConversations(userId) {
      const db = load();
      db.conversations = db.conversations.filter((message) => message.userId !== userId);
      save(db);
    },
    addActivity(activity) {
      const db = load();
      db.activities.push(activity);
      save(db);
    },
    listActivities(userId) {
      return load().activities.filter((item) => item.userId === userId);
    },
    addHabit(habit) {
      const db = load();
      db.habits.push(habit);
      save(db);
    },
    listHabits(userId) {
      return load().habits.filter((item) => item.userId === userId);
    },
    completeLesson(completion) {
      const db = load();
      const index = db.lessonCompletions.findIndex(
        (item) => item.userId === completion.userId && item.lessonId === completion.lessonId,
      );
      if (index >= 0) {
        db.lessonCompletions[index] = {
          ...db.lessonCompletions[index],
          quizCorrect: db.lessonCompletions[index].quizCorrect || completion.quizCorrect,
        };
      } else {
        db.lessonCompletions.push(completion);
      }
      save(db);
    },
    listLessonCompletions(userId) {
      return load().lessonCompletions.filter((item) => item.userId === userId);
    },
    deleteUser(userId) {
      const db = load();
      db.users = db.users.filter((user) => user.id !== userId);
      db.meals = db.meals.filter((item) => item.userId !== userId);
      db.xp = db.xp.filter((item) => item.userId !== userId);
      db.activities = db.activities.filter((item) => item.userId !== userId);
      db.habits = db.habits.filter((item) => item.userId !== userId);
      db.lessonCompletions = db.lessonCompletions.filter((item) => item.userId !== userId);
      db.assistantUses = db.assistantUses.filter((item) => item.userId !== userId);
      db.visitQuestions = db.visitQuestions.filter((item) => item.userId !== userId);
      db.safetyEvents = db.safetyEvents.filter((item) => item.userId !== userId);
      db.conversations = db.conversations.filter((item) => item.userId !== userId);
      save(db);
    },
    award(input) {
      const db = load();
      const result = appendXpEvent(db.xp, {
        id: randomUUID(),
        userId: input.userId,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        createdAt: new Date().toISOString(),
      });
      db.xp = result.events;
      save(db);
      const total = result.events
        .filter((event) => event.userId === input.userId)
        .reduce((sum, event) => sum + event.points, 0);
      return { awarded: result.awarded, total };
    },
    listXp(userId) {
      return load().xp.filter((event) => event.userId === userId);
    },
    countAssistantUses(userId, day) {
      return load().assistantUses.filter((item) => item.userId === userId && item.day === day).length;
    },
    recordAssistantUse(userId, day) {
      const db = load();
      db.assistantUses.push({ userId, day });
      save(db);
    },
  };
}

let fileStore: DemoStore | null = null;

const REDIS_KEY = "hq:demo-store";

type Snapshot = { store: DemoStore; db: Database; dirty: boolean };

/** Set by withPersist for the duration of one server action. */
const actionScope = new AsyncLocalStorage<{ snapshot: Promise<Snapshot> | null }>();

async function loadSnapshot(writable: boolean): Promise<Snapshot> {
  const config = redisConfig();
  if (!config) throw new Error("Redis is not configured.");
  const raw = await redisGet(config, REDIS_KEY);
  const snapshot = { db: normalize(raw ? (JSON.parse(raw) as Partial<Database>) : null), dirty: false } as Snapshot;
  snapshot.store = createStore(
    () => snapshot.db,
    (next) => {
      if (!writable) {
        throw new Error("Demo store writes must run inside a withPersist server action.");
      }
      snapshot.db = next;
      snapshot.dirty = true;
    },
  );
  return snapshot;
}

/** One read-only snapshot per server render. */
const renderSnapshot = cache(() => loadSnapshot(false));

/**
 * The demo store. Locally it is a JSON file. When Redis is configured (the
 * deployed tester build) each request works on a snapshot of the whole
 * document; server actions wrapped in withPersist write it back before they
 * redirect, so the next request, on any instance, sees the change.
 */
export async function getDemoStore(): Promise<DemoStore> {
  if (!redisConfig()) {
    fileStore ??= createFileStore();
    return fileStore;
  }
  const scope = actionScope.getStore();
  if (scope) {
    scope.snapshot ??= loadSnapshot(true);
    return (await scope.snapshot).store;
  }
  return (await renderSnapshot()).store;
}

/**
 * Wrap every exported server action that can write. The finally block runs
 * before a redirect leaves the action, because redirect() throws.
 * Last write wins: fine for a handful of testers, not for production.
 */
export function withPersist<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const scope: { snapshot: Promise<Snapshot> | null } = { snapshot: null };
    try {
      return await actionScope.run(scope, () => action(...args));
    } finally {
      const config = redisConfig();
      if (config && scope.snapshot) {
        const snapshot = await scope.snapshot;
        if (snapshot.dirty) await redisSet(config, REDIS_KEY, JSON.stringify(snapshot.db));
      }
    }
  };
}
