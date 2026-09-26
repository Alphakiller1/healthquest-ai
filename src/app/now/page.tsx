import type { Metadata } from "next";
import Link from "next/link";
import { HQGlyph, HQIcon, type HQIconName } from "@/components/hq/icon";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getActiveSource } from "@/lib/evidence/registry";
import { usCalendarDate } from "@/lib/health/calendar";
import { dailyTip, momentForHour } from "@/lib/moments/daily";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Now · HealthQuest" };

const TOOLS: { href: string; title: string; body: string; icon: HQIconName; tone: "sun" | "brand" | "night" | "info" }[] = [
  { href: "/now/food", title: "Choose food", body: "Tips for where you are, or compare two foods", icon: "bowl", tone: "sun" },
  { href: "/now/move", title: "Move a little", body: "Something that fits your time and space", icon: "motion", tone: "brand" },
  { href: "/now/calm", title: "Feel calmer", body: "A minute of breathing or grounding", icon: "moon", tone: "night" },
  { href: "/ask", title: "Ask a question", body: "Food, habits, or a health term", icon: "compass", tone: "info" },
];

/** In-the-moment help: pick what you need, get something useful in under a minute. */
export default async function NowPage() {
  const user = await requireOnboardedUser();
  const now = new Date();
  const today = usCalendarDate(now.toISOString());
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now));
  const tip = dailyTip(user, today);
  const source = tip ? getActiveSource(tip.sourceId) : undefined;
  const moment = momentForHour(hour);

  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 28, maxWidth: "44rem" }}>
        <header className="hq-page-head">
          <p className="hq-label">Now</p>
          <h1 className="hq-onboard__question">What do you need right now?</h1>
          <p className="hq-secondary">Quick help for the moment you&rsquo;re in. Each one takes a minute or two.</p>
          <details className="hq-about">
            <summary>What is this?</summary>
            <p>Quick tools for the moment you&rsquo;re in. Movement you finish is logged for you. Nothing you tap in Calm is saved, and nothing here is a diagnosis.</p>
          </details>
        </header>

        <nav className="hq-now-grid" aria-label="Right now">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="hq-now-tile">
              <HQGlyph name={tool.icon} tone={tool.tone} size={44} />
              <span className="hq-now-tile__title">{tool.title}</span>
              <span className="hq-micro">{tool.body}</span>
            </Link>
          ))}
        </nav>

        <div>
        <Link href={moment.href} className="hq-today__nudge" style={{ borderStyle: "solid" }}>
          <HQGlyph name={moment.id === "midday" ? "motion" : moment.id === "morning" ? "sun" : "moon"} tone="brand" />
          <span>
            <span className="hq-today__win-title">{moment.title}</span>
            <span className="hq-micro" style={{ display: "block" }}>
              {moment.body}
            </span>
          </span>
          <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
        </Link>
        </div>

        {tip ? (
          <aside className="hq-takeaway" aria-labelledby="tip-title">
            <p id="tip-title" className="hq-label" style={{ color: "var(--hq-sun-ink)", marginBottom: 6 }}>
              Today&rsquo;s tip
            </p>
            <p className="hq-reading" style={{ margin: 0 }}>
              {tip.claim}
            </p>
            {source ? (
              <p className="hq-micro" style={{ margin: "8px 0 0" }}>
                Source: <a href={source.url}>{source.organization}</a>
              </p>
            ) : null}
          </aside>
        ) : null}

        <p className="hq-micro" style={{ margin: 0 }}>
          If you&rsquo;re in immediate distress or thinking about hurting yourself, call or text <a href="tel:988">988</a>.
          In an emergency, call <a href="tel:911">911</a>.
        </p>
      </div>
    </main>
  );
}
