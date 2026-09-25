/*
 * Short, low-risk movement options for "I have a few minutes right now".
 * The instructions are everyday movements, not a training plan; the claims
 * they cite say any amount counts and short bouts add up. Nothing here
 * estimates calories or judges fitness.
 */

export type Place = "home" | "outside" | "desk";
export type Energy = "low" | "some" | "high";

export type MoveOption = {
  id: string;
  name: string;
  places: Place[];
  minMinutes: number;
  maxMinutes: number;
  energy: Energy[];
  intensity: "easy" | "moderate";
  /** Logged as the activity name when the person finishes. */
  logAs: string;
  steps: string[];
  strength?: boolean;
  claimIds: string[];
};

export const PLACES: { id: Place; label: string }[] = [
  { id: "home", label: "At home" },
  { id: "outside", label: "Outside" },
  { id: "desk", label: "At work or a desk" },
];

export const MINUTES = [2, 5, 10, 20] as const;

export const ENERGY: { id: Energy; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "some", label: "Okay" },
  { id: "high", label: "Plenty" },
];

export const MOVE_OPTIONS: readonly MoveOption[] = [
  {
    id: "easy-walk",
    name: "An easy walk",
    places: ["home", "outside", "desk"],
    minMinutes: 2,
    maxMinutes: 30,
    energy: ["low", "some"],
    intensity: "easy",
    logAs: "walk",
    steps: ["Walk at a pace where you can still talk comfortably.", "Hallways, a room, a block — anywhere works.", "Turn around at the halfway point."],
    claimIds: ["move.any_amount", "move.short_bouts"],
  },
  {
    id: "brisk-walk",
    name: "A brisk walk",
    places: ["outside"],
    minMinutes: 5,
    maxMinutes: 30,
    energy: ["some", "high"],
    intensity: "moderate",
    logAs: "brisk walk",
    steps: ["Start easy for a minute.", "Pick up the pace until talking takes a little effort.", "Ease off for the last minute."],
    claimIds: ["move.weekly", "move.any_amount"],
  },
  {
    id: "stand-stretch",
    name: "A stand-and-stretch break",
    places: ["home", "desk"],
    minMinutes: 2,
    maxMinutes: 5,
    energy: ["low", "some", "high"],
    intensity: "easy",
    logAs: "stretch break",
    steps: ["Stand up and reach both arms overhead.", "Roll your shoulders back slowly, five times.", "Shift your weight from foot to foot, then sit back down."],
    claimIds: ["move.sit_less", "move.short_bouts"],
  },
  {
    id: "march",
    name: "March in place",
    places: ["home", "desk"],
    minMinutes: 2,
    maxMinutes: 10,
    energy: ["low", "some"],
    intensity: "easy",
    logAs: "marching in place",
    steps: ["Stand near something steady to hold if you like.", "Lift one knee, then the other, at a comfortable pace.", "Swing your arms if that feels good."],
    claimIds: ["move.sit_less", "move.any_amount"],
  },
  {
    id: "stairs",
    name: "A few flights of stairs",
    places: ["home", "desk"],
    minMinutes: 2,
    maxMinutes: 10,
    energy: ["some", "high"],
    intensity: "moderate",
    logAs: "stairs",
    steps: ["Use the handrail.", "Go up at a steady pace and come down slowly.", "Rest at the bottom whenever you want."],
    claimIds: ["move.short_bouts", "move.any_amount"],
  },
  {
    id: "sit-to-stand",
    name: "Sit-to-stands",
    places: ["home", "desk"],
    minMinutes: 2,
    maxMinutes: 5,
    energy: ["some", "high"],
    intensity: "moderate",
    logAs: "sit-to-stands",
    steps: ["Sit near the front of a sturdy chair, feet flat.", "Stand up, then sit back down slowly.", "Do what feels comfortable, rest, and repeat."],
    strength: true,
    claimIds: ["move.strength", "move.short_bouts"],
  },
  {
    id: "wall-pushups",
    name: "Wall push-ups",
    places: ["home", "desk"],
    minMinutes: 2,
    maxMinutes: 5,
    energy: ["some", "high"],
    intensity: "moderate",
    logAs: "wall push-ups",
    steps: ["Stand an arm's length from a wall, hands flat on it.", "Bend your elbows to bring your chest toward the wall.", "Push back out. Rest between sets."],
    strength: true,
    claimIds: ["move.strength"],
  },
  {
    id: "dance",
    name: "Dance to a song or two",
    places: ["home"],
    minMinutes: 3,
    maxMinutes: 10,
    energy: ["some", "high"],
    intensity: "moderate",
    logAs: "dancing",
    steps: ["Put on a song you like.", "Move however feels good — there's no wrong way.", "One more song if you're enjoying it."],
    claimIds: ["move.weekly", "move.any_amount"],
  },
  {
    id: "chores",
    name: "Active chores",
    places: ["home", "outside"],
    minMinutes: 10,
    maxMinutes: 30,
    energy: ["low", "some", "high"],
    intensity: "easy",
    logAs: "active chores",
    steps: ["Pick one: sweeping, vacuuming, yard work, or tidying a room.", "Keep moving at a comfortable pace.", "Stop when the task or the timer is done."],
    claimIds: ["move.any_amount"],
  },
];

export const MOVE_SAFETY =
  "Go at a pace that feels okay for you. Stop if anything hurts, or if you feel dizzy, faint, or unusually short of breath.";

/** The best few options for where someone is, how long they have, and how they feel. */
export function pickMoves(input: { place: Place; minutes: number; energy: Energy }, limit = 3): MoveOption[] {
  return MOVE_OPTIONS.filter((option) => option.places.includes(input.place) && option.minMinutes <= input.minutes)
    .map((option) => ({
      option,
      score:
        (option.energy.includes(input.energy) ? 3 : 0) +
        (input.minutes <= option.maxMinutes ? 2 : 0) +
        (input.energy === "low" && option.intensity === "easy" ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.option);
}
