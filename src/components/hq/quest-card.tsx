import type { ReactNode } from "react";
import { HQIcon, type HQIconName } from "./icon";
import { HQPath, HQXp, stepsToNodes } from "./primitives";

export type QuestCardData = {
  id: string;
  category: string;
  symbol: HQIconName;
  title: string;
  why: string;
  effort: string;
  rewardXp: number;
  steps: { done: number; total: number; labels?: string[] };
  progressText: string;
  status: "active" | "completed" | "skipped";
  periodLabel: string;
};

/**
 * The quest is the product's unit of intent: one objective, visible progress
 * on the path, the reward, the effort, and why it matters. Actions are passed
 * in so the card works with server actions or links.
 */
export function HQQuestCard({
  quest,
  emphasis = "primary",
  primaryAction,
  secondaryAction,
  headingLevel = 2,
}: {
  quest: QuestCardData;
  emphasis?: "primary" | "quiet";
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const titleId = `quest-${quest.id}-title`;
  const labels =
    quest.steps.labels ??
    (quest.steps.total > 1 ? Array.from({ length: quest.steps.total }, (_, i) => `${i + 1}`) : undefined);
  const nodes =
    quest.status === "completed"
      ? stepsToNodes(quest.steps.total, quest.steps.total, labels)
      : stepsToNodes(quest.steps.done, quest.steps.total, labels);
  // A single-step quest reads better as start → finish than as one lonely node.
  const pathNodes =
    quest.steps.total === 1
      ? quest.status === "completed"
        ? [
            { state: "done" as const, label: "Started" },
            { state: "done" as const, label: "Done" },
          ]
        : [
            { state: "current" as const, label: "You are here" },
            { state: "todo" as const, label: "Done" },
          ]
      : nodes;

  return (
    <article
      className="hq-quest"
      data-emphasis={emphasis}
      data-status={quest.status}
      aria-labelledby={titleId}
    >
      {emphasis === "primary" && quest.status === "active" ? <QuestArc /> : null}
      <div className="hq-quest__kicker">
        <span className="hq-quest__category">
          <HQIcon name={quest.symbol} size={18} />
          {quest.category}
        </span>
        {emphasis === "primary" ? <span className="hq-label">{quest.periodLabel}</span> : null}
      </div>

      <Heading className="hq-quest__title" id={titleId}>
        {quest.title}
      </Heading>

      <div className="hq-quest__progress">
        <HQPath
          nodes={pathNodes}
          label={`Progress: ${quest.progressText}`}
          size={emphasis === "primary" ? "md" : "sm"}
          showLabels={emphasis === "primary"}
        />
      </div>

      <div className="hq-quest__meta">
        <span>
          {quest.status === "completed" ? (
            <>
              <HQIcon name="check" size={16} /> Completed this week
            </>
          ) : quest.status === "skipped" ? (
            <>Set aside this week</>
          ) : (
            quest.progressText
          )}
        </span>
        {quest.status === "active" && quest.effort ? (
          <span>
            <HQIcon name="clock" size={16} />
            {quest.effort}
          </span>
        ) : null}
        <HQXp value={quest.rewardXp} reward />
      </div>

      {emphasis === "primary" ? (
        <details className="hq-quest__why">
          <summary>
            <HQIcon name="chevron-right" size={16} />
            Why this matters
          </summary>
          <p>{quest.why}</p>
        </details>
      ) : null}

      {primaryAction || secondaryAction ? (
        <div className="hq-quest__actions">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </article>
  );
}

/** Brand motif: a faint route bowing through the card's corner. */
function QuestArc() {
  return (
    <svg className="hq-quest__arc" viewBox="0 0 120 72" aria-hidden>
      <path d="M6 70C40 68 52 40 76 30S104 8 118 2" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
