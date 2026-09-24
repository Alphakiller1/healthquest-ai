import Link from "next/link";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";
import type { TodayModel } from "@/lib/today/today";
import { HQToast } from "@/components/hq/feedback";
import { HQIcon } from "@/components/hq/icon";
import { HQButton, HQButtonLink, HQPath } from "@/components/hq/primitives";

type FormAction = (formData: FormData) => void | Promise<void>;

export type TodayNotice = "checkin" | "skipped" | null;

const NOTICES: Record<Exclude<TodayNotice, null>, { message: string; xp?: number }> = {
  checkin: { message: "Checked in. One step forward.", xp: 5 },
  skipped: { message: "Set aside for this week. No penalty." },
};

/**
 * The emotional centre of HealthQuest. It answers three questions in order:
 * where am I, what is one useful thing to do, and am I making progress.
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
  const quest = model.quest;
  const justCheckedIn = notice === "checkin";

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

        <section className="hq-today__journey" aria-labelledby="journey-title">
          <div className="hq-today__journey-head">
            <h2 id="journey-title" className="hq-label">
              Your week
            </h2>
            {model.checkedInToday ? (
              <span className="hq-chip" data-tone="brand">
                <HQIcon name="check" size={14} />
                Checked in today
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
          <p className="hq-today__journey-foot hq-micro">
            <span>
              {model.activeDaysThisWeek === 0
                ? "Your week starts whenever you do."
                : `${model.activeDaysThisWeek} ${model.activeDaysThisWeek === 1 ? "day" : "days"} you showed up`}
            </span>
            <Link href="/you" className="hq-link-quiet">
              {model.level.name}
              {model.level.next ? ` · ${model.level.next}` : ""}
            </Link>
          </p>
        </section>

        <section className="hq-today__quest" aria-labelledby="focus-title">
          <p className="hq-label">One thing for today</p>
          <h2 id="focus-title" className="hq-quest__title">{model.focus.title}</h2>
          <p className="hq-secondary">{model.focus.why}</p>
          <HQButtonLink href={model.focus.href} variant="primary" trailingIcon="arrow-right">
            {model.focus.label}
          </HQButtonLink>
        </section>

        {quest && quest.presentation.action.href !== model.focus.href ? (
          <p className="hq-secondary">
            This week you can also{" "}
            <Link className="underline" href={quest.presentation.action.href}>
              {quest.detail.replace(/\.$/, "").toLowerCase()}
            </Link>
            .
          </p>
        ) : null}
        {quest && quest.presentation.action.href !== model.focus.href && skipQuestAction ? (
          <form action={skipQuestAction}>
            <input type="hidden" name="questId" value={quest.id} />
            <HQButton type="submit" variant="quiet">
              Not this week
            </HQButton>
          </form>
        ) : null}

        <div className="hq-today__rail">
          <section className="hq-today__log" aria-labelledby="log-title">
            <h2 id="log-title" className="hq-label">
              When you want more
            </h2>
            <ul className="hq-list-links">
              {[
                ["/journal", "Log a meal"],
                ["/move", "Log movement"],
                ["/habits", "Sleep and notes"],
                ["/learn", "Lessons"],
                ["/quests", "This week's quests"],
              ]
                .filter(([href]) => href !== model.focus.href)
                .map(([href, label]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
            </ul>
          </section>

          <Link className="hq-ask hq-today__ask" href="/ask">
            <HQIcon name="compass" size={20} className="hq-tint-brand" />
            <span className="hq-ask__text">Ask about a food, habit, or term</span>
            <span className="hq-ask__go" aria-hidden>
              <HQIcon name="arrow-right" size={18} />
            </span>
          </Link>

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
        </div>

        <p className="hq-today__fine hq-micro">{REQUIRED_DISCLAIMER}</p>
      </div>

      {notice ? <HQToast message={NOTICES[notice].message} xp={NOTICES[notice].xp} /> : null}
    </Root>
  );
}
