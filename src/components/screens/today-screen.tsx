import Link from "next/link";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";
import type { TodayModel } from "@/lib/today/today";
import { HQToast } from "@/components/hq/feedback";
import { HQGlyph, HQIcon } from "@/components/hq/icon";
import { HQLayer } from "@/components/hq/layers";
import { HQLessonFeature } from "@/components/hq/learning";
import { HQButton, HQButtonLink, HQPath, HQXp, stepsToNodes } from "@/components/hq/primitives";
import { encouragement } from "@/lib/moments/encouragement";

type FormAction = (formData: FormData) => void | Promise<void>;

export type TodayNotice = "checkin" | "skipped" | null;

const NOTICES: Record<Exclude<TodayNotice, null>, { message: string; xp?: number }> = {
  checkin: { message: encouragement("checkin", new Date().toDateString()), xp: 5 },
  skipped: { message: "Set aside for this week. No penalty." },
};

const RIGHT_NOW = [
  { href: "/now/food", label: "Choose food", hint: "Tips or compare", icon: "bowl", tone: "sun" },
  { href: "/now/move", label: "Move a little", hint: "Fits your time", icon: "motion", tone: "brand" },
  { href: "/now/calm", label: "Feel calmer", hint: "One minute", icon: "moon", tone: "night" },
] as const;

const LOG = [
  { href: "/journal", label: "Meal", icon: "bowl" },
  { href: "/move", label: "Movement", icon: "motion" },
  { href: "/habits", label: "Sleep & notes", icon: "moon" },
] as const;

/**
 * The emotional centre of HealthQuest. It answers three questions in order:
 * where am I, what is one useful thing to do, and am I making progress.
 * One action dominates; everything else is a tap away but quieter.
 */
export function TodayScreen({
  model,
  checkInAction,
  skipQuestAction,
  notice = null,
  embedded = false,
}: {
  model: TodayModel;
  checkInAction?: FormAction;
  skipQuestAction?: FormAction;
  notice?: TodayNotice;
  /** Render inside another page (design-system preview) without a second <main>. */
  embedded?: boolean;
}) {
  const Root = embedded ? "div" : "main";
  const focus = model.focus;
  const quest = model.quest;
  const focusIsQuest = Boolean(quest && quest.presentation.action.href === focus.href);
  const justCheckedIn = notice === "checkin";
  const lessonIsFocus = model.lesson ? focus.href === `/learn/${model.lesson.id}` : false;

  return (
    <Root className="hq-main" data-width="wide">
      <div className="hq-today">
        <header className="hq-today__greeting hq-rise-in">
          <p className="hq-label">{model.dateLabel}</p>
          <h1 className="hq-display">
            {model.greeting}
            {model.firstName ? `, ${model.firstName}` : ""}.
          </h1>
          <p className="hq-secondary">{model.subline}</p>
        </header>

        <section className="hq-today__quest" aria-labelledby="focus-title">
          <article className="hq-quest hq-today__focus">
            <div className="hq-quest__kicker">
              <span className="hq-quest__category">
                <HQIcon name={focus.symbol} size={18} />
                One thing for today
              </span>
              {focus.rewardXp ? <HQXp value={focus.rewardXp} reward /> : null}
            </div>
            <h2 id="focus-title" className="hq-quest__title">
              {focus.title}
            </h2>
            {focus.progress ? (
              <div className="hq-quest__progress">
                <HQPath
                  label={`${focus.progress.done} of ${focus.progress.total} done`}
                  nodes={stepsToNodes(focus.progress.done, focus.progress.total)}
                  showLabels={false}
                  size="md"
                  surface="raised"
                />
              </div>
            ) : null}
            <p className="hq-secondary" style={{ margin: 0 }}>
              {focus.why}
            </p>
            <div className="hq-quest__actions">
              <HQButtonLink href={focus.href} variant="primary" trailingIcon="arrow-right" block>
                {focus.label}
              </HQButtonLink>
              {focusIsQuest && quest && skipQuestAction ? (
                <form action={skipQuestAction} style={{ width: "100%" }}>
                  <input type="hidden" name="questId" value={quest.id} />
                  <HQButton type="submit" variant="quiet" block>
                    Not this week
                  </HQButton>
                </form>
              ) : null}
            </div>
          </article>
        </section>

        <section className="hq-today__log" aria-labelledby="now-title">
          <h2 id="now-title" className="hq-label">
            Right now
          </h2>
          <div className="hq-quick-grid">
            {RIGHT_NOW.map((item) => (
              <Link key={item.href} className="hq-quick" href={item.href}>
                <HQGlyph name={item.icon} tone={item.tone} />
                <span className="hq-quick__label">
                  {item.label}
                  <span className="hq-quick__hint">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
          <nav className="hq-recent" aria-label="Log something">
            {LOG.map((item) => (
              <Link key={item.href} href={item.href} className="hq-log-chip">
                <HQIcon name="plus" size={14} />
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <div className="hq-today__rail">
          <section className="hq-today__journey" aria-labelledby="journey-title">
            <div className="hq-today__journey-head">
              <h2 id="journey-title" className="hq-label">
                Your week
              </h2>
              {model.checkedInToday ? (
                <span className="hq-chip" data-tone="brand">
                  <HQIcon name="check" size={14} />
                  Checked in
                </span>
              ) : checkInAction ? (
                <form action={checkInAction}>
                  <HQButton type="submit" size="sm" variant="secondary" icon="sun">
                    Check in
                  </HQButton>
                </form>
              ) : null}
            </div>
            <HQPath
              label="This week, Monday to Sunday"
              nodes={model.week.map((day) => ({
                state: day.state === "current" && day.active ? "done" : day.state,
                label: day.letter,
                arrived: justCheckedIn && day.state === "current",
                description: `${day.weekday}${day.state === "current" ? ", today" : ""}${
                  day.active ? ", you showed up" : day.state === "rest" ? ", rest day" : ""
                }`,
              }))}
            />
          </section>

          {!model.profileSet ? (
            <Link href="/you/profile" className="hq-today__nudge">
              <HQGlyph name="compass" tone="brand" />
              <span>
                <span className="hq-today__win-title">Shape HealthQuest around you</span>
                <span className="hq-micro" style={{ display: "block" }}>
                  A few optional answers size your quests and pick your lessons.
                </span>
              </span>
              <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
            </Link>
          ) : null}

          <div className="hq-today__more">
            <HQLayer depth={2} level={model.detail} label="More for today" hint="Your week in words, a moment, a lesson, and Ask">
              <ul className="hq-today__reflection">
                {model.reflection.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <Link href={model.moment.href} className="hq-today__nudge" style={{ borderStyle: "solid" }}>
                <HQGlyph name={model.moment.id === "midday" ? "motion" : model.moment.id === "morning" ? "sun" : "moon"} tone="brand" />
                <span>
                  <span className="hq-today__win-title">{model.moment.title}</span>
                  <span className="hq-micro" style={{ display: "block" }}>
                    {model.moment.body}
                  </span>
                </span>
                <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
              </Link>

              {model.lesson && !lessonIsFocus ? <HQLessonFeature lesson={model.lesson} href={`/learn/${model.lesson.id}`} /> : null}

              <Link className="hq-ask" href="/ask">
                <HQIcon name="compass" size={20} className="hq-tint-brand" />
                <span className="hq-ask__text">Ask about food, habits, or a term</span>
                <span className="hq-ask__go" aria-hidden>
                  <HQIcon name="arrow-right" size={18} />
                </span>
              </Link>
            </HQLayer>
          </div>

          <div className="hq-today__deeper">
            <HQLayer depth={3} level={model.detail} label="Tips, wins, and progress" hint="Today's tip, your latest mark, quests, and level">
              {model.tip ? (
                <aside className="hq-takeaway" aria-labelledby="tip-title">
                  <p id="tip-title" className="hq-label" style={{ color: "var(--hq-sun-ink)", marginBottom: 6 }}>
                    Today&rsquo;s tip
                  </p>
                  <p style={{ margin: 0 }}>{model.tip.text}</p>
                  <p className="hq-micro" style={{ margin: "6px 0 0" }}>
                    <a href={model.tip.url}>{model.tip.organization}</a>
                  </p>
                </aside>
              ) : null}

              {model.recentWin ? (
                <Link href="/you" className="hq-today__win hq-link-quiet">
                  <HQIcon name="spark" size={18} className="hq-xp__spark" />
                  <span>
                    <span className="hq-today__win-title">{model.recentWin.title}</span>
                    <span className="hq-micro" style={{ display: "block" }}>
                      {model.recentWin.detail}
                    </span>
                  </span>
                </Link>
              ) : null}

              <p className="hq-today__journey-foot hq-micro">
                <Link href="/quests" className="hq-link-quiet">
                  {model.questsDoneThisWeek > 0
                    ? `${model.questsDoneThisWeek} ${model.questsDoneThisWeek === 1 ? "quest" : "quests"} done · See quests`
                    : "See this week's quests"}
                </Link>
                <Link href="/you" className="hq-link-quiet">
                  {model.level.name}
                  {model.level.next ? ` · ${model.level.next}` : ""}
                </Link>
              </p>
            </HQLayer>
          </div>
        </div>

        {model.detailNote ? (
          <p className="hq-today__detail-note hq-micro">
            {model.detailNote} <Link href="/settings#display">Change detail level</Link>
          </p>
        ) : null}

        <p className="hq-today__fine hq-micro">{REQUIRED_DISCLAIMER}</p>
      </div>

      {notice ? <HQToast message={NOTICES[notice].message} xp={NOTICES[notice].xp} /> : null}
    </Root>
  );
}
