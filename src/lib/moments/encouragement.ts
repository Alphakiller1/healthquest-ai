/*
 * Positive reinforcement copy. The voice is a thoughtful coach: short, warm,
 * specific to what just happened, never shaming, never "AMAZING!!!". Nothing
 * here comments on the body, weight, or whether food was "good".
 */

export type Win =
  | "move"
  | "calm"
  | "food"
  | "meal"
  | "activity"
  | "rest"
  | "lesson"
  | "checkin"
  | "question"
  | "return";

const LINES: Record<Win, string[]> = {
  move: [
    "That counts. Any amount of movement does.",
    "Nice — you moved when you had the chance.",
    "A few minutes, done. That adds up.",
    "You showed up for yourself just now.",
    "Small moves like that are how habits start.",
  ],
  calm: [
    "You took a moment for yourself. That matters.",
    "Nice. Noticing how you feel is a skill, and you're using it.",
    "That's one calmer minute you didn't have before.",
    "You paused instead of pushing through. That's worth something.",
    "Well done for checking in with yourself.",
  ],
  food: [
    "You looked closer before choosing. That's building awareness.",
    "Good question to ask yourself — whatever you pick.",
    "Comparing takes a moment and teaches you something every time.",
    "Every choice is information, not a grade.",
  ],
  meal: [
    "Logged. You're building a picture of your own days.",
    "Nice — one more meal you understand a bit better.",
    "Saved. Small notes like this add up.",
  ],
  activity: [
    "Logged. Movement you chose, on your terms.",
    "Nice work — that's on the record now.",
    "Saved. You moved, and that counts.",
  ],
  rest: [
    "Saved. A few nights of notes shows your own pattern.",
    "Nice — rest is part of the picture too.",
  ],
  lesson: [
    "That's one more thing you understand about your health.",
    "Nice. You learned something useful today.",
  ],
  checkin: ["Checked in. One step forward.", "You showed up today. Small steps count."],
  question: ["Saved for your visit. Good questions lead to good conversations."],
  return: ["Welcome back. Your quest continues.", "Good to see you. Start wherever feels useful."],
};

/** A line for this moment that changes from one time to the next but is stable for the same seed. */
export function encouragement(win: Win, seed: string | number): string {
  const lines = LINES[win];
  const text = String(seed);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return lines[hash % lines.length];
}

export const ALL_ENCOURAGEMENT = LINES;
