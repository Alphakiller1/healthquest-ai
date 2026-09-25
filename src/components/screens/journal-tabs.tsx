import Link from "next/link";
import { HQIcon, type HQIconName } from "@/components/hq/icon";

const TABS: { href: string; label: string; icon: HQIconName }[] = [
  { href: "/journal", label: "Meals", icon: "bowl" },
  { href: "/move", label: "Movement", icon: "motion" },
  { href: "/habits", label: "Rest", icon: "moon" },
];

/** Meals, movement, and rest share one Journal tab; this switches between them. */
export function JournalTabs({ current }: { current: "/journal" | "/move" | "/habits" }) {
  return (
    <nav className="hq-subnav" aria-label="Journal">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={tab.href === current ? "page" : undefined}>
          <HQIcon name={tab.icon} size={18} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** Groups records under a readable day heading, newest first. */
export function groupByDay<T>(items: T[], day: (item: T) => string): { day: string; label: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => day(b).localeCompare(day(a)))) {
    const key = day(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const format = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  return [...groups].map(([key, list]) => ({ day: key, label: format.format(new Date(`${key}T12:00:00Z`)), items: list }));
}
