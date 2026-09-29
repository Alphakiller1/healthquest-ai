"use client";

import { useEffect, useRef, useState } from "react";
import { HQAssistantResponse } from "@/components/hq/assistant-response";
import { HQCallout } from "@/components/hq/primitives";
import type { DetailLevel } from "@/lib/experience/depth";
import type { MealExplanation } from "@/lib/journey/record-meal";
import { explainMealNow } from "./actions";

/**
 * The explanation for a just-saved meal. The meal is already saved when this
 * appears; the explanation is fetched here so saving never waits for it.
 */
export function MealInsight({
  mealId,
  foodName,
  initial,
  level,
}: {
  mealId: string;
  foodName: string;
  initial: MealExplanation | null;
  level: DetailLevel;
}) {
  const [explanation, setExplanation] = useState<MealExplanation | null>(initial);
  const [failed, setFailed] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    if (initial || asked.current) return;
    asked.current = true;
    explainMealNow(mealId)
      .then((result) => (result ? setExplanation(result) : setFailed(true)))
      .catch(() => setFailed(true));
  }, [initial, mealId]);

  return (
    <section id="meal-insight" className="hq-surface hq-stack hq-meal-insight" aria-labelledby="insight-title" aria-busy={!explanation && !failed}>
      <h2 id="insight-title" className="hq-section-title" style={{ margin: 0 }}>
        What this means for you
      </h2>
      {explanation ? (
        <>
          {explanation.demo ? (
            <HQCallout tone="neutral">Practice explanation. This was not sent to a live model.</HQCallout>
          ) : null}
          <HQAssistantResponse
            question={foodName}
            questionLabel="About your meal"
            level={level}
            response={{
              status: "ok",
              summary: explanation.summary,
              practicalOptions: explanation.practicalOptions.slice(0, 2),
              sourceIds: explanation.sourceIds,
              uncertainty: explanation.uncertainty,
              professionalFollowup: explanation.professionalFollowup,
              disclaimer: explanation.disclaimer,
            }}
          />
        </>
      ) : failed ? (
        <p className="hq-secondary" style={{ margin: 0 }}>
          The explanation didn&rsquo;t load. Your meal is saved — you can keep logging.
        </p>
      ) : (
        <div className="hq-stack" style={{ gap: 10 }}>
          <p className="hq-secondary" style={{ margin: 0 }}>
            Connecting your {foodName} to what you&rsquo;re working on…
          </p>
          <span className="hq-skeleton" style={{ width: "92%" }} />
          <span className="hq-skeleton" style={{ width: "76%" }} />
        </div>
      )}
    </section>
  );
}
