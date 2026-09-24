import type { AssistantResponse } from "@/lib/ai/types";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";
import { HQAssistantResponse } from "@/components/hq/assistant-response";
import { HQIcon } from "@/components/hq/icon";
import { HQCallout } from "@/components/hq/primitives";

/** A design-time answer. Every fact here also appears in a reviewed lesson. */
export const SAMPLE_ANSWER: { question: string; response: AssistantResponse } = {
  question: "What does the saturated fat number on a label actually tell me?",
  response: {
    status: "ok",
    summary:
      "It's the grams of saturated fat in one serving — the serving size printed at the top of the label, which isn't always the whole package.",
    context:
      "You mentioned you're exploring cholesterol. Eating patterns lower in saturated fat are associated with healthier blood cholesterol in population guidance, so the label is a handy way to compare two similar foods.",
    practicalOptions: [
      "Check the serving size first, then the saturated fat line.",
      "Compare two products with similar servings side by side.",
      "Treat the number as a comparison, not a verdict on the food.",
    ],
    sourceIds: ["fda-nutrition-facts", "nhlbi-blood-cholesterol"],
    uncertainty: "One label can't tell you your own cholesterol. Only a lab result can.",
    professionalFollowup: "If you have a recent lipid panel, ask what a reasonable saturated fat range looks like for you.",
    disclaimer: REQUIRED_DISCLAIMER,
  },
};

const PROMPTS = [
  "What does “serving size” mean on a label?",
  "Why does sleep consistency matter?",
  "What counts as moderate movement?",
  "What should I ask about my blood pressure?",
];

/**
 * The assistant as a reading surface. The composer stays in reach; answers
 * arrive as a structured page, not a thread of bubbles.
 */
export function AskScreen({ live = false }: { live?: boolean }) {
  return (
    <main className="hq-main">
      <div className="hq-ask-screen">
        <header className="hq-page-head">
          <p className="hq-label hq-cluster" style={{ gap: 6 }}>
            <HQIcon name="compass" size={16} className="hq-tint-brand" />
            Ask HealthQuest
          </p>
          <h1 className="hq-display" style={{ fontSize: "2rem" }}>
            What would you like to understand?
          </h1>
          <p className="hq-secondary">
            Plain-language answers from reviewed public-health sources. Education, not a diagnosis.
          </p>
        </header>

        {live ? null : (
          <HQCallout tone="neutral" title="Live answers are being connected">
            Below is an example of how an answer will look. Nothing you type here is sent yet.
          </HQCallout>
        )}

        <p className="hq-label" style={{ margin: "0 0 -12px" }}>People often ask</p>
        <div className="hq-prompts">
          {PROMPTS.map((prompt) => (
            <span key={prompt} className="hq-prompt">
              {prompt}
            </span>
          ))}
        </div>

        <HQAssistantResponse question={SAMPLE_ANSWER.question} response={SAMPLE_ANSWER.response} sample />

        <form className="hq-ask-screen__composer" aria-label="Ask a question" action="">
          <div className="hq-composer">
            <label htmlFor="ask-input" className="hq-sr-only">
              Your question
            </label>
            <textarea id="ask-input" name="q" rows={1} placeholder="Ask about a food, habit, or health term" />
            <button className="hq-btn hq-btn--primary" type="submit" disabled={!live} aria-label="Send question" style={{ minHeight: 44, padding: "0 14px" }}>
              <HQIcon name="arrow-up" />
            </button>
          </div>
          <p className="hq-micro" style={{ margin: "8px 4px 0" }}>
            <HQIcon name="shield" size={14} /> Only what an answer needs is shared, and only with your consent.
          </p>
        </form>
      </div>
    </main>
  );
}
