import type { DemoStore, DemoUser } from "@/lib/demo/store";
import { engagementDates } from "@/lib/gamification/engagement-dates";

/*
 * Layered depth. Every screen has three layers:
 *   1. Glance  — one question, one sentence, one action. Always shown.
 *   2. Guide   — a short structured explanation and a few options.
 *   3. Deep    — numbers, sources, history, related reading.
 * The detail level decides which layers start open. Nothing is ever removed:
 * a closed layer is one tap away at every level. The level grows with use
 * unless the person picks one.
 */

export type DetailLevel = "simple" | "standard" | "detailed";
export type Depth = 1 | 2 | 3;

export const DETAIL_LEVELS: { id: "auto" | DetailLevel; label: string; hint: string }[] = [
  { id: "auto", label: "Grow with me", hint: "Starts simple and adds detail as you use HealthQuest" },
  { id: "simple", label: "Simple", hint: "Just the key point and one next step" },
  { id: "standard", label: "Standard", hint: "Key points plus a short explanation" },
  { id: "detailed", label: "Detailed", hint: "Everything open: numbers, sources, and more" },
];

export type UsageSignals = { activeDays: number; lessons: number; questions: number; actions: number };

export function usageSignals(store: DemoStore, user: DemoUser): UsageSignals {
  return {
    activeDays: new Set(engagementDates(store, user.id)).size,
    lessons: store.listLessonCompletions(user.id).length,
    questions: store.listConversations(user.id).filter((line) => line.role === "user").length + store.listVisitQuestions(user.id).length,
    actions: store.listXp(user.id).length,
  };
}

/**
 * Auto level from what the person has done. Someone new sees the simplest
 * version; regular use opens the explanations; sustained, curious use opens
 * everything. Thresholds are deliberately low so nobody is stuck at "simple".
 */
export function autoLevel(signals: UsageSignals): DetailLevel {
  if (signals.activeDays >= 10 || signals.lessons >= 5 || (signals.activeDays >= 5 && signals.questions >= 5)) return "detailed";
  if (signals.activeDays >= 3 || signals.lessons >= 1 || signals.actions >= 8) return "standard";
  return "simple";
}

export function detailLevelFor(user: DemoUser, signals: UsageSignals): DetailLevel {
  if (user.detailLevel && user.detailLevel !== "auto") return user.detailLevel;
  return autoLevel(signals);
}

/** Whether a layer at this depth starts open at this level. Depth 1 is always open. */
export function startsOpen(level: DetailLevel, depth: Depth): boolean {
  if (depth === 1) return true;
  if (depth === 2) return level !== "simple";
  return level === "detailed";
}

/** What the next level adds, so the change is never a surprise. */
export function nextLevelNote(level: DetailLevel, auto: boolean): string | null {
  if (!auto) return null;
  if (level === "simple") return "HealthQuest is keeping things simple for now. More detail opens up as you use it.";
  if (level === "standard") return "You're seeing short explanations. Sources and numbers open up as you go deeper.";
  return null;
}
