/*
 * "How are you feeling right now?" → a few small things that may help, each
 * backed by a reviewed coping claim. Nothing the person taps here is stored.
 * One option always leads straight to crisis support.
 */

export type Feeling = "stressed" | "anxious" | "overwhelmed" | "low" | "tired" | "okay" | "good" | "unsafe";

export type CalmTool = "breathe" | "ground" | "walk" | "reach" | "write" | "reframe" | "notice";

export const FEELINGS: { id: Feeling; label: string }[] = [
  { id: "stressed", label: "Stressed" },
  { id: "anxious", label: "Anxious or worried" },
  { id: "overwhelmed", label: "Overwhelmed" },
  { id: "low", label: "Low or sad" },
  { id: "tired", label: "Tired" },
  { id: "okay", label: "Okay" },
  { id: "good", label: "Good" },
  { id: "unsafe", label: "Like I might hurt myself" },
];

export const CALM_TOOLS: Record<CalmTool, { title: string; minutes: number; summary: string; claimIds: string[] }> = {
  breathe: {
    title: "Slow breathing, one minute",
    minutes: 1,
    summary: "Breathe in for 4, out for 6, following the circle.",
    claimIds: ["stress.relax"],
  },
  ground: {
    title: "5-4-3-2-1 grounding",
    minutes: 2,
    summary: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    claimIds: ["stress.relax"],
  },
  walk: {
    title: "A short walk",
    minutes: 5,
    summary: "Even a few minutes of walking counts as movement.",
    claimIds: ["move.any_amount", "stress.ideas"],
  },
  reach: {
    title: "Reach out to someone",
    minutes: 3,
    summary: "Text or call one person who helps you feel steadier.",
    claimIds: ["stress.connect"],
  },
  write: {
    title: "Write one sentence",
    minutes: 2,
    summary: "Write what's on your mind, on paper or in your phone. HealthQuest doesn't save it.",
    claimIds: ["stress.journal"],
  },
  reframe: {
    title: "Question one thought",
    minutes: 2,
    summary: "Name the thought, then ask: is there a kinder or more balanced way to see it?",
    claimIds: ["stress.thoughts"],
  },
  notice: {
    title: "Notice what's helping",
    minutes: 1,
    summary: "Take a breath and name one thing that's going okay today.",
    claimIds: ["stress.relax"],
  },
};

const TOOLS_FOR: Record<Exclude<Feeling, "unsafe">, CalmTool[]> = {
  stressed: ["breathe", "walk", "write"],
  anxious: ["breathe", "ground", "reframe"],
  overwhelmed: ["ground", "breathe", "write"],
  low: ["reach", "walk", "write"],
  tired: ["walk", "breathe", "notice"],
  okay: ["notice", "breathe", "walk"],
  good: ["notice", "reach", "walk"],
};

export function toolsFor(feeling: Feeling): CalmTool[] {
  return feeling === "unsafe" ? [] : TOOLS_FOR[feeling];
}

/** Paced breathing: 4 seconds in, 6 out. A slower out-breath is the whole point. */
export const BREATH = { inhaleSeconds: 4, exhaleSeconds: 6, rounds: 6 } as const;

export const GROUNDING_STEPS = [
  "Look around. Name 5 things you can see.",
  "Name 4 things you can touch or feel right now.",
  "Listen. Name 3 things you can hear.",
  "Name 2 things you can smell, or like the smell of.",
  "Name 1 thing you can taste, or would like to.",
];
