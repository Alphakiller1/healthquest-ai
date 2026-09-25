import { createEvidenceAssistant } from "./evidence-provider";
import { createOpenAIAssistant } from "./openai";
import type { HealthAssistantProvider } from "./types";

export type AssistantMode = "openai" | "evidence";

/**
 * With an OpenAI key, a model writes the answer from reviewed claims. Without
 * one, answers are assembled directly from those claims — no model and no
 * invented content — and the UI says so. Either way the same pipeline runs:
 * safety pre-check, evidence selection, validation, citation checks.
 */
export function createAssistant(): { provider: HealthAssistantProvider; mode: AssistantMode; demo: boolean } {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: createOpenAIAssistant({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      }),
      mode: "openai",
      demo: false,
    };
  }
  return { provider: createEvidenceAssistant(), mode: "evidence", demo: false };
}
