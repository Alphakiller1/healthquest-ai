import { createMockAssistant, selectAssistantMode } from "./mock-provider";
import { createOpenAIAssistant } from "./openai";
import type { HealthAssistantProvider } from "./types";

export function createAssistant(): { provider: HealthAssistantProvider | null; demo: boolean } {
  const mode = selectAssistantMode({
    nodeEnv: process.env.NODE_ENV,
    apiKey: process.env.OPENAI_API_KEY,
  });
  if (mode === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider: createOpenAIAssistant({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      }),
      demo: false,
    };
  }
  if (mode === "demo") return { provider: createMockAssistant(), demo: true };
  return { provider: null, demo: false };
}
