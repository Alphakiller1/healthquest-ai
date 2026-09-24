export const LEVELS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 40 },
  { name: "Gold", min: 120 },
  { name: "Platinum", min: 250 },
  { name: "Diamond", min: 500 },
] as const;

export type LevelName = (typeof LEVELS)[number]["name"];

export function levelForXp(total: number): { name: LevelName; next: string | null } {
  let current: LevelName = "Bronze";
  let next: string | null = LEVELS[1] ? `${LEVELS[1].min} XP to Silver` : null;
  for (let index = 0; index < LEVELS.length; index += 1) {
    const level = LEVELS[index];
    if (total >= level.min) {
      current = level.name;
      const following = LEVELS[index + 1];
      next = following ? `${following.min - total} XP to ${following.name}` : null;
    }
  }
  return { name: current, next };
}
