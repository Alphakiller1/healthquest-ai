import type { QuestView } from "@/lib/gamification/quests";
import { QUEST_PRESENTATION, questSteps } from "@/lib/today/today";
import { HQButton, HQButtonLink, HQPath, HQXp } from "@/components/hq/primitives";
import { HQQuestCard, type QuestCardData } from "@/components/hq/quest-card";

type FormAction = (formData: FormData) => void | Promise<void>;

function toCard(quest: QuestView): QuestCardData {
  const presentation = QUEST_PRESENTATION[quest.id];
  const steps = questSteps(quest);
  return {
    id: quest.id,
    category: presentation?.category ?? quest.title,
    symbol: presentation?.symbol ?? "marker",
    title: quest.detail.replace(/\.$/, ""),
    why: presentation?.why ?? "",
    effort: steps.total > 1 ? (presentation?.effort ?? "") : "",
    rewardXp: presentation?.rewardXp ?? 0,
    steps,
    progressText: steps.total > 1 ? `${steps.done} of ${steps.total} this week` : presentation?.effort ?? "",
    status: quest.status,
    periodLabel: "This week",
  };
}

/**
 * Quests: one featured quest, the rest quieter, and the whole week drawn as
 * a single path so progress reads at a glance. Setting a quest aside is a
 * choice, never a failure.
 */
export function QuestsScreen({
  quests,
  weekLabel,
  skipAction,
}: {
  quests: QuestView[];
  weekLabel: string;
  skipAction?: FormAction;
}) {
  const open = quests.filter((quest) => quest.status === "active");
  const started = open.filter((quest) => questSteps(quest).done > 0);
  const featured = started[0] ?? open[0];
  const rest = open.filter((quest) => quest !== featured);
  const closed = quests.filter((quest) => quest.status !== "active");
  const earned = quests
    .filter((quest) => quest.status === "completed")
    .reduce((sum, quest) => sum + (QUEST_PRESENTATION[quest.id]?.rewardXp ?? 0), 0);

  const skipButton = (id: string) =>
    skipAction ? (
      <form action={skipAction}>
        <input type="hidden" name="questId" value={id} />
        <HQButton type="submit" variant="quiet" size="sm">
          Not this week
        </HQButton>
      </form>
    ) : null;

  return (
    <main className="hq-main" data-width="wide">
      <div className="hq-quests">
        <header className="hq-page-head">
          <p className="hq-label">{weekLabel}</p>
          <h1 className="hq-title">This week&rsquo;s quests</h1>
          <p className="hq-secondary">
            Quests follow what you already do. Set any of them aside — there&rsquo;s no penalty.
          </p>
        </header>

        <div className="hq-stack" style={{ gap: 32 }}>
          {featured ? (
            <HQQuestCard
              quest={toCard(featured)}
              primaryAction={
                <HQButtonLink href={QUEST_PRESENTATION[featured.id]?.action.href ?? "/today"} variant="primary" trailingIcon="arrow-right">
                  {QUEST_PRESENTATION[featured.id]?.action.label ?? "Continue"}
                </HQButtonLink>
              }
              secondaryAction={skipButton(featured.id)}
            />
          ) : null}

          {rest.length > 0 ? (
            <section className="hq-section" aria-labelledby="open-quests">
              <h2 id="open-quests" className="hq-section-title">
                Also open
              </h2>
              <ul className="hq-quests__list">
                {rest.map((quest) => (
                  <li key={quest.id}>
                    <HQQuestCard
                      quest={toCard(quest)}
                      emphasis="quiet"
                      headingLevel={3}
                      primaryAction={
                        <HQButtonLink href={QUEST_PRESENTATION[quest.id]?.action.href ?? "/today"} size="sm">
                          {QUEST_PRESENTATION[quest.id]?.action.label ?? "Open"}
                        </HQButtonLink>
                      }
                      secondaryAction={skipButton(quest.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {closed.length > 0 ? (
            <section className="hq-section" aria-labelledby="closed-quests">
              <h2 id="closed-quests" className="hq-section-title">
                Finished and set aside
              </h2>
              <ul className="hq-quests__list">
                {closed.map((quest) => (
                  <li key={quest.id}>
                    <HQQuestCard quest={toCard(quest)} emphasis="quiet" headingLevel={3} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="hq-quests__aside" aria-labelledby="week-path">
          <div className="hq-quests__week">
            <h2 id="week-path" className="hq-section-title">
              Your week in quests
            </h2>
            <HQPath
              orientation="vertical"
              size="sm"
              surface="soft"
              label="Quests this week"
              nodes={quests.map((quest) => ({
                state:
                  quest.status === "completed" ? "done" : quest === featured ? "current" : quest.status === "skipped" ? "rest" : "todo",
                description: `${quest.title}: ${quest.status === "completed" ? "finished" : quest.status === "skipped" ? "set aside" : "open"}`,
                body: (
                  <>
                    <span className="hq-body" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {QUEST_PRESENTATION[quest.id]?.category ?? quest.title}
                    </span>
                    <span className="hq-micro">
                      {quest.status === "completed" ? "Finished" : quest.status === "skipped" ? "Set aside" : quest.progress}
                    </span>
                  </>
                ),
              }))}
            />
            <hr className="hq-divider" />
            <p className="hq-cluster hq-secondary" style={{ margin: 0, justifyContent: "space-between" }}>
              <span>Earned from quests</span>
              <HQXp value={earned} />
            </p>
            <p className="hq-micro" style={{ margin: 0 }}>
              New quests arrive Monday. Finished ones can be earned again.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
