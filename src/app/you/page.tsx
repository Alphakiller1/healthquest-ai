import Link from "next/link";
import type { Metadata } from "next";
import { HQGlyph, HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQAchievementBadge, type Tier } from "@/components/hq/learning";
import { HQPreferenceControls } from "@/components/hq/preferences";
import { HQPath, HQSection, HQXp } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { unlockedAchievements } from "@/lib/gamification/achievements";
import { engagementDates } from "@/lib/gamification/engagement-dates";
import { LEVELS, levelForXp } from "@/lib/gamification/levels";
import { engagementStreak } from "@/lib/gamification/streaks";
import { totalXp } from "@/lib/gamification/xp";
import { usCalendarDate } from "@/lib/health/calendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "You · HealthQuest" };

/** Every mark, so unearned ones can show as quiet outlines of what's ahead. */
const MARKS: { id: string; title: string; hint: string; symbol: HQIconName; tier: Tier }[] = [
  { id: "first-meal", title: "First meal logged", hint: "Log any meal", symbol: "bowl", tier: "sun" },
  { id: "first-movement", title: "First movement", hint: "Log any movement", symbol: "motion", tier: "brand" },
  { id: "first-lesson", title: "First lesson", hint: "Finish a lesson", symbol: "book", tier: "sun" },
  { id: "first-moment", title: "Took a moment", hint: "Use a Now tool", symbol: "compass", tier: "brand" },
  { id: "visit-question", title: "Visit question", hint: "Save a question for a clinician", symbol: "question", tier: "platinum" },
  { id: "seven-days", title: "Seven active days", hint: "Show up on seven days", symbol: "path", tier: "brand" },
];

export default async function YouPage() {
  const user = await requireOnboardedUser();
  const store = await getDemoStore();
  const xp = totalXp(store.listXp(user.id));
  const level = levelForXp(xp);
  const levelIndex = LEVELS.findIndex((item) => item.name === level.name);
  const unlocked = new Set(unlockedAchievements(store, user.id).map((item) => item.id));
  const streak = engagementStreak(engagementDates(store, user.id), usCalendarDate(new Date().toISOString()));

  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 40 }}>
        <header className="hq-page-head">
          <p className="hq-label">{user.email}</p>
          <h1 className="hq-title">Your HealthQuest</h1>
          <p className="hq-secondary">{streak.message}</p>
        </header>

        <Link href="/you/profile" className="hq-today__nudge" style={{ borderStyle: user.profile?.updatedAt ? "solid" : "dashed" }}>
          <HQGlyph name="compass" tone="brand" />
          <span>
            <span className="hq-today__win-title">Your health profile</span>
            <span className="hq-micro" style={{ display: "block" }}>
              {user.profile?.updatedAt ? "Shaping your quests, lessons, and answers. Review or change it." : "Optional answers that size your quests and pick your lessons."}
            </span>
          </span>
          <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
        </Link>

        <HQSection title="Your trail" id="trail">
          <div className="hq-surface">
            <div className="hq-cluster" style={{ justifyContent: "space-between", marginBottom: 20 }}>
              <span className="hq-numeric-lg">
                <HQXp value={xp} />
              </span>
              <span className="hq-label">{level.next ?? "Every level reached"}</span>
            </div>
            <HQPath
              surface="surface"
              label={`Levels. You are at ${level.name}.`}
              nodes={LEVELS.map((item, index) => ({
                state: index < levelIndex ? "done" : index === levelIndex ? "current" : "todo",
                label: item.name,
              }))}
            />
            <p className="hq-micro" style={{ margin: "16px 0 0" }}>
              Levels count showing up and learning. They are not a measure of your health.
            </p>
          </div>
        </HQSection>

        <HQSection title="What you've done" id="marks">
          <ul className="hq-badge-grid">
            {MARKS.map((mark) => (
              <li key={mark.id}>
                <HQAchievementBadge
                  title={mark.title}
                  detail={unlocked.has(mark.id) ? undefined : mark.hint}
                  symbol={mark.symbol}
                  tier={mark.tier}
                  locked={!unlocked.has(mark.id)}
                />
              </li>
            ))}
          </ul>
        </HQSection>

        <HQSection title="Explore" id="explore">
          <ul className="hq-list-links">
            {[
              { href: "/health-factors", label: "My health factors", icon: "leaf" as const },
              { href: "/visit", label: "Questions for a visit", icon: "question" as const },
              { href: "/settings", label: "Settings, privacy, and your data", icon: "shield" as const },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <HQIcon name={item.icon} className="hq-tint-brand" />
                  <span>{item.label}</span>
                  <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </HQSection>

        <HQSection title="Appearance" id="appearance">
          <HQPreferenceControls />
        </HQSection>
      </div>
    </main>
  );
}
