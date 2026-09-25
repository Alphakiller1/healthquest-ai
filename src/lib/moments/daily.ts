import type { DemoUser } from "@/lib/demo/store";
import { activeClaims, type EvidenceClaim } from "@/lib/evidence/claims";
import { resolveCoachingMode, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { profileTopics } from "@/lib/profile/personalize";
import { excludedFoods } from "@/lib/profile/profile";

/*
 * The daily layer: one reviewed tip a day, chosen from the person's topics,
 * and a small moment that fits the time of day.
 */

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T12:00:00Z`) / 86_400_000);
}

/** One tip per day: stable all day, different tomorrow, drawn from the person's topics first. */
export function dailyTip(user: DemoUser, isoDate: string): EvidenceClaim | null {
  const contexts = user.healthContextIds ?? [];
  const educationOnly = resolveCoachingMode(contexts) === "education_only";
  const gentle = user.gentleFoodMode || shouldRecommendGentleFoodMode(contexts);
  const excluded = excludedFoods(user.profile).map((word) => new RegExp(`\\b${word}\\b`, "i"));
  const topics = new Set(profileTopics(user).map((topic) => topic.topic));
  const pool = activeClaims().filter(
    (claim) =>
      (claim.kind === "pattern" || claim.kind === "practical" || claim.kind === "explain") &&
      !claim.id.startsWith("crisis.") &&
      !(educationOnly && !claim.educationOnlySafe) &&
      !(gentle && /calorie|weight/i.test(claim.claim)) &&
      !excluded.some((pattern) => pattern.test(claim.claim)),
  );
  if (pool.length === 0) return null;
  const relevant = pool.filter((claim) => claim.topics.some((topic) => topics.has(topic)));
  // Mostly the person's own topics, with a general tip every third day for variety.
  const day = dayNumber(isoDate);
  const source = relevant.length > 0 && day % 3 !== 0 ? relevant : pool;
  return source[day % source.length];
}

export type DayMoment = {
  id: "morning" | "midday" | "evening" | "night";
  title: string;
  body: string;
  href: string;
  label: string;
};

/** A small, optional thing that fits the time of day. */
export function momentForHour(hour: number): DayMoment {
  if (hour >= 5 && hour < 11) {
    return { id: "morning", title: "Start the day gently", body: "One slow minute of breathing before the day picks up.", href: "/now/calm?tool=breathe", label: "Breathe for a minute" };
  }
  if (hour >= 11 && hour < 17) {
    return { id: "midday", title: "A midday reset", body: "Sitting a while? A two-minute stretch counts.", href: "/now/move?minutes=2", label: "Move for 2 minutes" };
  }
  if (hour >= 17 && hour < 22) {
    return { id: "evening", title: "Wind down", body: "Name one thing that went okay today. It doesn't have to be big.", href: "/now/calm?tool=notice", label: "Take a moment" };
  }
  return { id: "night", title: "Rest is part of it", body: "If you're up late, slow breathing can help you settle.", href: "/now/calm?tool=breathe", label: "Breathe for a minute" };
}
