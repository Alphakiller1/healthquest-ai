import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { dataDir } from "@/lib/demo/data-dir";
import type { HealthProfile } from "@/lib/profile/profile";
import { redisConfig, redisDel, redisGet, redisHDel, redisHGet, redisHSet, redisSet } from "@/lib/demo/redis";
import { readSession } from "@/lib/demo/session";
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
  /** Optional answers that shape quests, lessons, and answers. See lib/profile/profile.ts. */
  profile?: HealthProfile;
  /** How much detail screens show. "auto" (or unset) grows with use; see lib/experience/depth.ts. */
  detailLevel?: "auto" | "simple" | "standard" | "detailed";
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
  deleteActivity(userId: string, activityId: string): void;
  addHabit(habit: HabitRecord): void;
  listHabits(userId: string): HabitRecord[];
  deleteHabit(userId: string, habitId: string): void;
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
    deleteActivity(userId, activityId) {
      const db = load();
      db.activities = db.activities.filter((item) => !(item.userId === userId && item.id === activityId));
      save(db);
    },
    addHabit(habit) {
      const db = load();
      db.habits.push(habit);
      save(db);
    },
    listHabits(userId) {
      return load().habits.filter((item) => item.userId === userId);
    },
    deleteHabit(userId, habitId) {
      const db = load();
      db.habits = db.habits.filter((item) => !(item.userId === userId && item.id === habitId));
      save(db);
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

/*
 * Redis layout (tester deployment): one record per person, plus an email → id
 * hash. A request loads only the signed-in person's record, so the size of a
 * request never grows with the number of testers, and one person's save never
 * rewrites anyone else's data. Sign-in loads a record by email first.
 */
const LEGACY_KEY = "hq:demo-store";
const MIGRATED_KEY = "hq:v2:migrated";
const EMAILS_KEY = "hq:v2:emails";
const userKey = (id: string) => `hq:v2:user:${id}`;

type Snapshot = {
  store: DemoStore;
  db: Database;
  dirty: boolean;
  /** id → email of every person loaded into this snapshot, to detect deletions and email changes. */
  loaded: Map<string, string>;
};

/** Set by withPersist for the duration of one server action. */
const actionScope = new AsyncLocalStorage<{ snapshot: Promise<Snapshot> | null }>();

/** One person's slice of the database. */
function partitionFor(db: Database, userId: string): Database {
  return {
    users: db.users.filter((user) => user.id === userId),
    meals: db.meals.filter((item) => item.userId === userId),
    xp: db.xp.filter((item) => item.userId === userId),
    activities: db.activities.filter((item) => item.userId === userId),
    habits: db.habits.filter((item) => item.userId === userId),
    lessonCompletions: db.lessonCompletions.filter((item) => item.userId === userId),
    assistantUses: db.assistantUses.filter((item) => item.userId === userId),
    visitQuestions: db.visitQuestions.filter((item) => item.userId === userId),
    safetyEvents: db.safetyEvents.filter((item) => item.userId === userId),
    conversations: db.conversations.filter((item) => item.userId === userId),
  };
}

function mergeInto(db: Database, part: Database) {
  for (const key of Object.keys(db) as (keyof Database)[]) {
    (db[key] as unknown[]).push(...(part[key] as unknown[]));
  }
}

let migration: Promise<void> | null = null;

/** One-time split of the old single-record store into per-person records. The old key is kept as a backup. */
function ensureMigrated(config: NonNullable<ReturnType<typeof redisConfig>>): Promise<void> {
  migration ??= (async () => {
    if (await redisGet(config, MIGRATED_KEY)) return;
    const legacy = await redisGet(config, LEGACY_KEY);
    if (legacy) {
      const db = normalize(JSON.parse(legacy) as Partial<Database>);
      for (const user of db.users) {
        await redisSet(config, userKey(user.id), JSON.stringify(partitionFor(db, user.id)));
        await redisHSet(config, EMAILS_KEY, user.email, user.id);
      }
    }
    await redisSet(config, MIGRATED_KEY, new Date().toISOString());
  })().catch((error) => {
    migration = null;
    throw error;
  });
  return migration;
}

async function loadUserInto(snapshot: Snapshot, userId: string) {
  const config = redisConfig();
  if (!config || snapshot.loaded.has(userId)) return;
  const raw = await redisGet(config, userKey(userId));
  if (!raw) return;
  const part = normalize(JSON.parse(raw) as Partial<Database>);
  mergeInto(snapshot.db, part);
  snapshot.loaded.set(userId, part.users[0]?.email ?? "");
}

async function sessionUserId(): Promise<string | null> {
  try {
    return (await readSession())?.userId ?? null;
  } catch {
    return null; // Outside a request (unit tests).
  }
}

async function loadSnapshot(writable: boolean): Promise<Snapshot> {
  const config = redisConfig();
  if (!config) throw new Error("Redis is not configured.");
  await ensureMigrated(config);
  const snapshot = { db: emptyDb(), dirty: false, loaded: new Map<string, string>() } as Snapshot;
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
  const userId = await sessionUserId();
  if (userId) await loadUserInto(snapshot, userId);
  return snapshot;
}

/** One read-only snapshot per server render. */
const renderSnapshot = cache(() => loadSnapshot(false));

async function currentSnapshot(): Promise<Snapshot> {
  const scope = actionScope.getStore();
  if (scope) {
    scope.snapshot ??= loadSnapshot(true);
    return scope.snapshot;
  }
  return renderSnapshot();
}

/** Sign-in: load the person with this email (if any) so getUserByEmail can find them. */
export async function preloadUserByEmail(email: string): Promise<void> {
  const config = redisConfig();
  if (!config) return;
  const snapshot = await currentSnapshot();
  const id = await redisHGet(config, EMAILS_KEY, email);
  if (id) await loadUserInto(snapshot, id);
}

async function persist(snapshot: Snapshot) {
  const config = redisConfig();
  if (!config || !snapshot.dirty) return;
  const present = new Set(snapshot.db.users.map((user) => user.id));
  for (const user of snapshot.db.users) {
    await redisSet(config, userKey(user.id), JSON.stringify(partitionFor(snapshot.db, user.id)));
    const previous = snapshot.loaded.get(user.id);
    if (previous !== user.email) {
      if (previous) await redisHDel(config, EMAILS_KEY, previous);
      await redisHSet(config, EMAILS_KEY, user.email, user.id);
    }
  }
  // Anyone loaded but no longer present was deleted: remove their record and email entry.
  for (const [id, email] of snapshot.loaded) {
    if (present.has(id)) continue;
    await redisDel(config, userKey(id));
    if (email) await redisHDel(config, EMAILS_KEY, email);
  }
}

/**
 * The demo store. Locally it is a JSON file. When Redis is configured (the
 * deployed tester build) each request works on a snapshot of the signed-in
 * person's record; server actions wrapped in withPersist write it back before
 * they redirect, so the next request, on any instance, sees the change.
 */
export async function getDemoStore(): Promise<DemoStore> {
  if (!redisConfig()) {
    fileStore ??= createFileStore();
    return fileStore;
  }
  return (await currentSnapshot()).store;
}

/**
 * Wrap every exported server action that can write. The finally block runs
 * before a redirect leaves the action, because redirect() throws.
 * Concurrent saves by the same person are last-write-wins; different people
 * never overwrite each other.
 */
export function withPersist<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const scope: { snapshot: Promise<Snapshot> | null } = { snapshot: null };
    try {
      return await actionScope.run(scope, () => action(...args));
    } finally {
      if (redisConfig() && scope.snapshot) await persist(await scope.snapshot);
      // The app shell (nav, XP) lives in the root layout, which Next keeps across
      // navigations. Refresh it so a finished onboarding shows the tabs and new XP shows at once.
      try {
        revalidatePath("/", "layout");
      } catch {
        // Outside a Next request (unit tests) there is nothing to refresh.
      }
    }
  };
}
