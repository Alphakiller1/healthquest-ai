import type { DemoUser } from "@/lib/demo/store";
import { getDemoStore } from "@/lib/demo/store";
import { detailLevelFor, nextLevelNote, usageSignals, type DetailLevel } from "./depth";

export type Experience = { level: DetailLevel; auto: boolean; note: string | null };

/** The person's detail level for this request, from their own choice or their use so far. */
export async function experienceFor(user: DemoUser): Promise<Experience> {
  const level = detailLevelFor(user, usageSignals(await getDemoStore(), user));
  const auto = !user.detailLevel || user.detailLevel === "auto";
  return { level, auto, note: nextLevelNote(level, auto) };
}
