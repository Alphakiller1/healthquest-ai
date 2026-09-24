"use client";

import { useState } from "react";
import { HQConfirmButton, HQMilestone, HQToast } from "@/components/hq/feedback";
import { HQButton } from "@/components/hq/primitives";

/** Plays the three reinforcement levels on demand. */
export function FeedbackDemo() {
  const [toastKey, setToastKey] = useState(0);
  const [milestone, setMilestone] = useState(false);
  return (
    <div className="hq-cluster" style={{ gap: 12 }}>
      <HQButton onClick={() => setToastKey((key) => key + 1)} icon="check">
        Level 1 · Toast
      </HQButton>
      <HQConfirmButton doneLabel="Logged" icon="plus">
        Level 2 · Log
      </HQConfirmButton>
      <HQButton onClick={() => setMilestone(true)} icon="spark">
        Level 3 · Milestone
      </HQButton>
      {toastKey > 0 ? <HQToast key={toastKey} message="Logged. One step forward." xp={5} /> : null}
      <HQMilestone
        open={milestone}
        onClose={() => setMilestone(false)}
        title="Movement quest complete"
        body="Four walks this week. Small choices add up."
        badge={{ title: "Quest complete", symbol: "motion", tier: "brand" }}
      />
    </div>
  );
}
