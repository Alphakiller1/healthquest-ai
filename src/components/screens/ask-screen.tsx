import type { AssistantResponse } from "@/lib/ai/types";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";

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
