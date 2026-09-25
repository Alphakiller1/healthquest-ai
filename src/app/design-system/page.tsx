import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { HQAssistantResponse } from "@/components/hq/assistant-response";
import { HQGlyph, HQIcon, ICON_NAMES } from "@/components/hq/icon";
import { HQAchievementBadge, HQLessonFeature, HQLessonRow } from "@/components/hq/learning";
import { HQPreferenceControls } from "@/components/hq/preferences";
import {
  HQButton,
  HQCallout,
  HQChip,
  HQChoice,
  HQEmptyState,
  HQField,
  HQLoader,
  HQPath,
  HQSafetyBanner,
  HQSkeleton,
  HQXp,
  stepsToNodes,
} from "@/components/hq/primitives";
import { HQQuestCard, type QuestCardData } from "@/components/hq/quest-card";
import { SAMPLE_ANSWER } from "@/components/screens/ask-screen";
import { TodayScreen } from "@/components/screens/today-screen";
import type { TodayModel } from "@/lib/today/today";
import { QUEST_PRESENTATION } from "@/lib/today/today";
import { FeedbackDemo } from "./feedback-demo";

export const metadata: Metadata = { title: "Design system · HealthQuest" };

const SECTIONS = [
  ["principles", "Principles"],
  ["color", "Color"],
  ["type", "Typography"],
  ["space", "Spacing & shape"],
  ["icons", "Symbols"],
  ["buttons", "Buttons"],
  ["fields", "Fields"],
  ["path", "The Path"],
  ["quests", "Quests"],
  ["learning", "Learning"],
  ["marks", "Marks & XP"],
  ["assistant", "Assistant"],
  ["feedback", "Feedback"],
  ["callouts", "Callouts & safety"],
  ["states", "Empty & loading"],
  ["today", "Today"],
  ["themes", "Dark & contrast"],
  ["a11y", "Accessibility"],
] as const;

const COLOR_GROUPS: { title: string; tokens: [string, string][] }[] = [
  {
    title: "Surfaces",
    tokens: [
      ["--hq-bg-canvas", "Canvas"],
      ["--hq-bg-surface", "Surface"],
      ["--hq-bg-raised", "Raised"],
      ["--hq-bg-soft", "Soft"],
      ["--hq-line", "Line"],
      ["--hq-line-strong", "Line strong"],
    ],
  },
  {
    title: "Ink",
    tokens: [
      ["--hq-text-primary", "Primary"],
      ["--hq-text-secondary", "Secondary"],
      ["--hq-text-muted", "Muted"],
    ],
  },
  {
    title: "Brand",
    tokens: [
      ["--hq-brand", "Fern"],
      ["--hq-brand-ink", "Fern ink (text)"],
      ["--hq-brand-soft", "Fern soft"],
      ["--hq-sun", "Sun"],
      ["--hq-sun-ink", "Sun ink (text)"],
      ["--hq-sun-soft", "Sun soft"],
    ],
  },
  {
    title: "States",
    tokens: [
      ["--hq-info", "Info"],
      ["--hq-caution", "Caution"],
      ["--hq-emergency", "Emergency only"],
      ["--hq-focus", "Focus"],
    ],
  },
  {
    title: "Tiers (participation)",
    tokens: [
      ["--hq-tier-bronze", "Bronze"],
      ["--hq-tier-silver", "Silver"],
      ["--hq-tier-gold", "Gold"],
      ["--hq-tier-platinum", "Platinum"],
      ["--hq-tier-diamond", "Diamond"],
    ],
  },
];

const SAMPLE_QUEST: QuestCardData = {
  id: "walks",
  category: "Movement quest",
  symbol: "motion",
  title: "Take a 20-minute walk",
  why: QUEST_PRESENTATION["move-week"].why,
  effort: "About 20 minutes",
  rewardXp: 40,
  steps: { done: 3, total: 4, labels: ["Mon", "Wed", "Thu", "Sat"] },
  progressText: "3 of 4 this week",
  status: "active",
  periodLabel: "This week",
};

const TODAY_FIXTURE: TodayModel = {
  firstName: "Chase",
  greeting: "Good morning",
  dateLabel: "Thursday, September 24",
  subline: "Welcome back. Your quest continues.",
  checkedInToday: false,
  week: [
    ["Monday", "done"],
    ["Tuesday", "done"],
    ["Wednesday", "rest"],
    ["Thursday", "current"],
    ["Friday", "todo"],
    ["Saturday", "todo"],
    ["Sunday", "todo"],
  ].map(([weekday, state], index) => ({
    date: `2026-09-${21 + index}`,
    weekday,
    letter: weekday[0],
    state: state as TodayModel["week"][number]["state"],
    active: state === "done",
  })),
  focus: {
    title: "One more to finish your budget quest",
    why: "2 of 3 done this week. Writing down what a meal cost helps you notice affordable staples you already like.",
    href: "/journal",
    label: "Log a meal",
    symbol: "bowl",
    progress: { done: 2, total: 3 },
    rewardXp: 10,
  },
  profileSet: true,
  reflection: ["You showed up on 2 days this week.", "3 meals logged.", "Sleep noted on 2 nights, averaging 6.5 hours."],
  activeDaysThisWeek: 2,
  xp: 185,
  level: { name: "Gold", next: "65 XP to Platinum", progress: 0.5 },
  quest: {
    id: "budget-meals",
    title: "Budget quest",
    detail: "Log three meals with an approximate cost you entered.",
    progress: "2 of 3 meals with a cost",
    status: "active",
    steps: { done: 2, total: 3 },
    presentation: QUEST_PRESENTATION["budget-meals"],
  },
  questsDoneThisWeek: 1,
  lesson: { id: "sleep", title: "Sleep consistency", minutes: 4, rewardXp: 25, reason: "Pairs with your rest goal" },
  recentWin: { title: "First lesson finished", detail: "You finished a short lesson." },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.HQ_DESIGN_SYSTEM !== "1") notFound();

  return (
    <main className="hq-main" data-width="wide">
      <div className="hq-ds">
        <header className="hq-page-head">
          <p className="hq-label hq-cluster" style={{ gap: 6 }}>
            <HQIcon name="path" size={16} className="hq-tint-brand" /> HealthQuest design system
          </p>
          <h1 className="hq-display">Progress through understanding.</h1>
          <p className="hq-secondary" style={{ maxWidth: "40rem" }}>
            The visual reference for every HealthQuest screen. If a component looks wrong here, it looks wrong everywhere.
            Tokens live in <code>src/styles</code>, components in <code>src/components/hq</code>, rationale in{" "}
            <code>docs/design-system.md</code>.
          </p>
          <nav className="hq-ds__toc" aria-label="Sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </header>

        <Section id="principles" title="Principles" lede="Seven checks every screen passes before it ships.">
          <ol className="hq-stack" style={{ gap: 8, paddingLeft: 20, margin: 0, maxWidth: "44rem" }}>
            <li>One dominant action per screen. Everything else steps back.</li>
            <li>Progress is drawn as a path. Missed days are rest, never a break.</li>
            <li>XP measures participation and learning, never health.</li>
            <li>Red means real safety only. Ordinary wellness information is never alarming.</li>
            <li>Containment is earned. Not every group needs a card.</li>
            <li>Copy sounds like a thoughtful coach: short, specific, never shaming.</li>
            <li>Plain language first. Someone with low health literacy should follow every screen.</li>
          </ol>
        </Section>

        <Section id="color" title="Color" lede="Warm paper and botanical charcoal, fern for progress, sun for learning and reward. Brand fills are graphics; text uses the ink variants. Every text pair clears WCAG AA in both themes.">
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="hq-stack" style={{ gap: 10 }}>
              <h3 className="hq-label">{group.title}</h3>
              <div className="hq-ds__grid" style={{ "--hq-ds-min": "9rem" } as CSSProperties}>
                {group.tokens.map(([token, name]) => (
                  <div key={token} className="hq-ds__swatch">
                    <span className="hq-ds__swatch-chip" style={{ background: `var(${token})` }} />
                    <span className="hq-ds__swatch-meta">
                      <strong>{name}</strong>
                      <code>{token}</code>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section id="type" title="Typography" lede="Hanken Grotesk carries the interface. Newsreader is the voice — greetings, lessons, the assistant's plain answer. Weight does hierarchy work; bold is rare.">
          <div>
            {[
              ["Display · serif", <p key="d" className="hq-display" style={{ margin: 0 }}>Good morning, Chase.</p>],
              ["Title", <p key="t" className="hq-title" style={{ margin: 0 }}>This week&rsquo;s quests</p>],
              ["Section", <p key="s" className="hq-section-title" style={{ margin: 0 }}>Marks from your journey</p>],
              ["Reading · serif", <p key="r" className="hq-reading" style={{ margin: 0 }}>The Nutrition Facts label starts with a serving size. The numbers under it refer to that serving, not always the whole package.</p>],
              ["Body", <p key="b" className="hq-body" style={{ margin: 0 }}>Quests follow what you already do. Set any of them aside — there&rsquo;s no penalty.</p>],
              ["Secondary", <p key="2" className="hq-secondary" style={{ margin: 0 }}>You showed up today. Small steps count.</p>],
              ["Label", <p key="l" className="hq-label" style={{ margin: 0 }}>Your week</p>],
              ["Numeric", <p key="n" className="hq-numeric-lg" style={{ margin: 0 }}>1,280 · 3 of 4 · 20 min</p>],
            ].map(([name, specimen]) => (
              <div key={name as string} className="hq-ds__specimen">
                <span className="hq-micro">{name}</span>
                {specimen as ReactNode}
              </div>
            ))}
          </div>
        </Section>

        <Section id="space" title="Spacing & shape" lede="A 4px base. Radii stay restrained — 10px for controls, 16px for containers, pills for chips only. Tone and borders before shadows.">
          <div className="hq-stack" style={{ gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((step) => (
              <div key={step} className="hq-cluster" style={{ gap: 12 }}>
                <code className="hq-micro" style={{ width: 90 }}>--hq-space-{step}</code>
                <span style={{ height: 12, width: `var(--hq-space-${step})`, background: "var(--hq-brand)", borderRadius: 2 }} />
              </div>
            ))}
          </div>
          <div className="hq-cluster" style={{ gap: 16 }}>
            {["xs", "sm", "md", "lg"].map((radius) => (
              <div key={radius} className="hq-stack" style={{ gap: 6, alignItems: "center" }}>
                <span style={{ width: 64, height: 64, border: "1.5px solid var(--hq-line-strong)", borderRadius: `var(--hq-radius-${radius})`, background: "var(--hq-bg-raised)" }} />
                <code className="hq-micro">{radius}</code>
              </div>
            ))}
            {["low", "medium", "high"].map((shadow) => (
              <div key={shadow} className="hq-stack" style={{ gap: 6, alignItems: "center" }}>
                <span style={{ width: 64, height: 64, borderRadius: "var(--hq-radius-md)", background: "var(--hq-bg-raised)", boxShadow: `var(--hq-shadow-${shadow})` }} />
                <code className="hq-micro">shadow {shadow}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section id="icons" title="Symbols" lede="Drawn for HealthQuest on one 24px grid with a 1.75 stroke and round joins. Path, spark, and marker are the signatures; the heart is used sparingly.">
          <div className="hq-ds__grid" style={{ "--hq-ds-min": "6.5rem" } as CSSProperties}>
            {ICON_NAMES.map((name) => (
              <div key={name} className="hq-stack" style={{ gap: 6, alignItems: "center", padding: "14px 4px", border: "1px solid var(--hq-line)", borderRadius: "var(--hq-radius-md)" }}>
                <HQIcon name={name} size={24} />
                <code className="hq-micro">{name}</code>
              </div>
            ))}
          </div>
          <div className="hq-cluster" style={{ gap: 12 }}>
            <HQGlyph name="bowl" tone="sun" />
            <HQGlyph name="motion" tone="brand" />
            <HQGlyph name="moon" tone="night" />
            <HQGlyph name="book" />
            <span className="hq-micro">Glyph tiles: a symbol in its tinted field</span>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" lede="Primary appears once per view. Quiet buttons carry secondary choices like “Not this week”. Emergency styling exists only for safety actions.">
          <div className="hq-cluster" style={{ gap: 12 }}>
            <HQButton variant="primary" trailingIcon="arrow-right">Log movement</HQButton>
            <HQButton icon="sun">Check in</HQButton>
            <HQButton variant="quiet">Not this week</HQButton>
            <HQButton variant="primary" size="sm">Small primary</HQButton>
            <HQButton disabled>Disabled</HQButton>
            <button className="hq-icon-btn hq-icon-btn--outlined" type="button" aria-label="Ask HealthQuest">
              <HQIcon name="compass" />
            </button>
          </div>
          <div className="hq-cluster" style={{ gap: 12 }}>
            <HQChip tone="brand" icon="check">Checked in today</HQChip>
            <HQChip tone="sun" icon="spark">New lesson</HQChip>
            <HQChip tone="info">Education only</HQChip>
            <HQChip>This week</HQChip>
          </div>
        </Section>

        <Section id="fields" title="Fields" lede="Whole rows are targets. Selected choices take the fern tint, focus always shows a ring.">
          <div className="hq-ds__pair">
            <div className="hq-stack">
              <HQField label="What did you have?" hint="Plain words are fine — “oatmeal with banana”." htmlFor="ds-food">
                <input id="ds-food" className="hq-input" placeholder="oatmeal with banana and peanut butter" />
              </HQField>
              <HQField label="Notes" htmlFor="ds-notes">
                <textarea id="ds-notes" className="hq-textarea" rows={3} />
              </HQField>
            </div>
            <div className="hq-stack" style={{ gap: 8 }}>
              <HQChoice name="ds-goal" label="Build a realistic movement habit" icon="motion" defaultChecked />
              <HQChoice name="ds-goal" label="Learn about sleep consistency" icon="moon" />
              <HQChoice type="radio" name="ds-food-mode" label="Gentle food mode" hint="No calorie-focused feedback" icon="leaf" defaultChecked />
              <HQChoice type="radio" name="ds-food-mode" label="Show nutrition details" icon="book" />
            </div>
          </div>
        </Section>

        <Section id="path" title="The Path" lede="The signature. ● done, ◉ you are here, ○ ahead, · rest. Walked segments are solid; the road ahead is dotted. Each link bows in a soft arc. A missed day is a rest, never a break in the line.">
          <div className="hq-ds__frame hq-stack" style={{ gap: 28 }}>
            <HQPath label="Week" nodes={TODAY_FIXTURE.week.map((day) => ({ state: day.state, label: day.letter }))} />
            <HQPath label="Quest progress" nodes={stepsToNodes(3, 4, ["Mon", "Wed", "Thu", "Sat"])} />
            <HQPath size="sm" showLabels={false} label="Onboarding" nodes={stepsToNodes(2, 5)} />
            <HQPath size="lg" label="Levels" nodes={stepsToNodes(2, 5, ["Bronze", "Silver", "Gold", "Platinum", "Diamond"])} />
          </div>
          <div className="hq-ds__frame" style={{ maxWidth: 420 }}>
            <HQPath
              orientation="vertical"
              size="sm"
              label="Lesson sections"
              nodes={[
                { state: "done", body: <><strong>Serving size</strong><span className="hq-micro">Read</span></> },
                { state: "current", body: <><strong>Comparing two labels</strong><span className="hq-micro">You are here</span></> },
                { state: "todo", body: <><strong>Quick question</strong><span className="hq-micro">+10 XP</span></> },
              ]}
            />
          </div>
        </Section>

        <Section id="quests" title="Quests" lede="Objective, progress on the path, reward, effort, and why it matters — with a no-penalty way to set it aside.">
          <div className="hq-ds__pair">
            <HQQuestCard
              quest={SAMPLE_QUEST}
              headingLevel={3}
              primaryAction={<HQButton variant="primary" trailingIcon="arrow-right">Log a walk</HQButton>}
              secondaryAction={<HQButton variant="quiet">Not this week</HQButton>}
            />
            <div className="hq-stack">
              <HQQuestCard quest={{ ...SAMPLE_QUEST, id: "q2", category: "Rest quest", symbol: "moon", title: "Record sleep on two nights", steps: { done: 1, total: 2 }, progressText: "1 of 2 nights" }} emphasis="quiet" headingLevel={3} />
              <HQQuestCard quest={{ ...SAMPLE_QUEST, id: "q3", category: "Learning quest", symbol: "book", title: "Finish the food-label lesson", status: "completed", steps: { done: 1, total: 1 } }} emphasis="quiet" headingLevel={3} />
            </div>
          </div>
        </Section>

        <Section id="learning" title="Learning" lede="Lessons read like a good magazine: serif, short segments, one takeaway.">
          <div className="hq-ds__pair">
            <HQLessonFeature href="#learning" lesson={{ id: "sleep", title: "Sleep consistency", minutes: 4, rewardXp: 25, reason: "Pairs with your rest goal" }} />
            <div>
              <HQLessonRow href="#learning" lesson={{ id: "a", title: "Understanding food labels", minutes: 5, rewardXp: 25, completed: true }} />
              <HQLessonRow href="#learning" lesson={{ id: "b", title: "Sodium basics", minutes: 4, rewardXp: 25 }} />
              <HQLessonRow href="#learning" lesson={{ id: "c", title: "Fiber basics", minutes: 4, rewardXp: 25 }} />
            </div>
          </div>
          <div className="hq-surface hq-surface--sun" style={{ maxWidth: "36rem" }}>
            <p className="hq-label" style={{ color: "var(--hq-sun-ink)", margin: "0 0 6px" }}>Takeaway</p>
            <p className="hq-reading" style={{ margin: 0 }}>Read the serving size before comparing nutrients.</p>
          </div>
        </Section>

        <Section id="marks" title="Marks & XP" lede="Mementos, not trophies. A softened octagon with a double rule; unearned marks are dotted outlines of what's ahead. XP is a small spark and a number.">
          <ul className="hq-badge-grid">
            <li><HQAchievementBadge title="First meal logged" symbol="bowl" tier="sun" /></li>
            <li><HQAchievementBadge title="First movement" symbol="motion" tier="brand" /></li>
            <li><HQAchievementBadge title="Seven active days" symbol="path" tier="gold" /></li>
            <li><HQAchievementBadge title="Visit question" symbol="question" tier="platinum" /></li>
            <li><HQAchievementBadge title="First lesson" detail="Finish a lesson" symbol="book" locked /></li>
          </ul>
          <div className="hq-cluster" style={{ gap: 20 }}>
            <HQXp value={1280} />
            <HQXp value={40} reward />
            <span className="hq-numeric-lg"><HQXp value={185} /></span>
          </div>
        </Section>

        <Section id="assistant" title="Assistant" lede="A structured reading page, not a chat transcript: what this means, why it matters for you, try this, good to know, sources.">
          <div className="hq-surface" style={{ maxWidth: "42rem" }}>
            <HQAssistantResponse question={SAMPLE_ANSWER.question} response={SAMPLE_ANSWER.response} sample />
          </div>
          <div className="hq-composer" style={{ maxWidth: "42rem" }}>
            <textarea aria-label="Composer example" rows={1} placeholder="Ask about a food, habit, or term" />
            <button className="hq-btn hq-btn--primary" type="button" aria-label="Send" style={{ minHeight: 44, padding: "0 14px" }}>
              <HQIcon name="arrow-up" />
            </button>
          </div>
        </Section>

        <Section id="feedback" title="Feedback" lede="Three intensities. Level 1 is frequent and nearly silent. Level 2 moves the path. Level 3 is rare — celebration loses meaning if everything celebrates.">
          <FeedbackDemo />
        </Section>

        <Section id="callouts" title="Callouts & safety" lede="Calm tones for information. The safety banner is the only loud red in the product.">
          <div className="hq-ds__pair">
            <div className="hq-stack" style={{ gap: 10 }}>
              <HQCallout title="Good to know">One label can&rsquo;t tell you your cholesterol. Only a lab result can.</HQCallout>
              <HQCallout tone="positive" title="Saved">Logging a meal earns 5 XP. That&rsquo;s participation, not a grade.</HQCallout>
              <HQCallout tone="caution">Add a food name before saving.</HQCallout>
              <HQCallout tone="sun" title="Small steps count">You learned something useful today.</HQCallout>
            </div>
            <HQSafetyBanner
              message="If you or someone else may be in danger, get help now. You can call or text 988 any time."
              actions={[
                { label: "Call 988", href: "tel:988", primary: true },
                { label: "Text 988", href: "sms:988", primary: true },
                { label: "Call 911", href: "tel:911" },
              ]}
            />
          </div>
        </Section>

        <Section id="states" title="Empty & loading" lede="Empty states invite, never make anyone feel behind. The loader is three waypoints taking turns — the only looping motion.">
          <div className="hq-ds__pair">
            <div className="hq-stack" style={{ gap: 10 }}>
              <HQEmptyState title="Your movement journey starts whenever you're ready." body="A walk, chores, a stretch — it all counts." action={{ href: "#states", label: "Log movement" }} />
              <HQEmptyState title="Log something when it helps you understand your day." />
            </div>
            <div className="hq-surface hq-stack" style={{ gap: 12 }}>
              <HQLoader label="Finding your lesson" />
              <HQSkeleton width="40%" height={12} />
              <HQSkeleton width="80%" height={24} />
              <HQSkeleton height={120} radius={16} />
              <div className="hq-cluster"><HQSkeleton width={96} height={40} radius={10} /><HQSkeleton width={96} height={40} radius={10} /></div>
            </div>
          </div>
        </Section>

        <Section id="today" title="Today · 390px" lede="The proving ground. Greeting, the week as a path, one quest, quick logging, one lesson, the assistant, a recent win.">
          <div className="hq-ds__phone">
            <TodayScreen model={TODAY_FIXTURE} embedded />
          </div>
        </Section>

        <Section id="themes" title="Dark & contrast" lede="Dark is designed, not inverted: botanical charcoal, warm ink, softened accents. High contrast strengthens lines and ink.">
          <div className="hq-ds__pair">
            {(["light", "dark"] as const).map((theme) => (
              <div key={theme} data-theme={theme} className="hq-ds__frame hq-stack">
                <span className="hq-label">{theme === "light" ? "Light" : "Dark"}</span>
                <HQQuestCard quest={SAMPLE_QUEST} emphasis="quiet" headingLevel={3} />
                <HQCallout tone="positive" title="Nice. You showed up today." >One more step on your HealthQuest.</HQCallout>
              </div>
            ))}
            <div className="hq-ds__frame hq-stack hq-contrast">
              <span className="hq-label">High contrast</span>
              <HQQuestCard quest={SAMPLE_QUEST} emphasis="quiet" headingLevel={3} />
            </div>
          </div>
          <div className="hq-surface" style={{ maxWidth: "32rem" }}>
            <HQPreferenceControls />
          </div>
        </Section>

        <Section id="a11y" title="Accessibility" lede="Targets are 44px or larger. Focus shows a 2px ring everywhere. Nothing relies on color alone: every path node has a shape and a spoken state. Reduced motion collapses movement to fades.">
          <div className="hq-cluster" style={{ gap: 12 }}>
            <HQButton variant="primary" data-focus-demo style={{ outline: "2px solid var(--hq-focus)", outlineOffset: 2 }}>Focused primary</HQButton>
            <HQButton style={{ outline: "2px solid var(--hq-focus)", outlineOffset: 2 }}>Focused secondary</HQButton>
            <span className="hq-micro">Tab through this page to see live focus.</span>
          </div>
          <ul className="hq-stack" style={{ gap: 6, paddingLeft: 20, margin: 0, maxWidth: "44rem" }}>
            <li>Path nodes: done carries a check, current a ring and dot, rest a small dot — shape, not just color.</li>
            <li>Toasts announce politely; safety banners assertively.</li>
            <li>Onboarding moves focus to each new question.</li>
            <li>All type is in rem and reflows at 200% zoom.</li>
          </ul>
        </Section>
      </div>
    </main>
  );
}

function Section({ id, title, lede, children }: { id: string; title: string; lede: string; children: ReactNode }) {
  return (
    <section id={id} className="hq-ds__section" aria-labelledby={`${id}-h`}>
      <header>
        <h2 id={`${id}-h`} className="hq-title">
          {title}
        </h2>
        <p className="hq-secondary">{lede}</p>
      </header>
      {children}
    </section>
  );
}
