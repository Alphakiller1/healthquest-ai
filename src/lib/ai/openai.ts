import { REQUIRED_DISCLAIMER, type AssistantResponse, type HealthAssistantProvider, type SafeAssistantInput } from "./types";

type FetchLike = typeof fetch;

export function createOpenAIAssistant(options: {
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
}): HealthAssistantProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async generate(input: SafeAssistantInput): Promise<AssistantResponse> {
      const response = await fetchImpl("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model,
          store: false,
          instructions:
            "You write educational wellness explanations. Use only the source IDs provided. Do not diagnose, prescribe, or invent citations. Set status to education_only when coachingMode is education_only. The disclaimer must match exactly.",
          input: JSON.stringify({
            message: input.message,
            wellnessContexts: input.wellnessContexts,
            goals: input.goals,
            gentleFoodMode: input.gentleFoodMode,
            coachingMode: input.coachingMode,
            food: input.food,
            allowedSourceIds: input.allowedSourceIds,
            disclaimer: REQUIRED_DISCLAIMER,
          }),
        }),
      });
      if (!response.ok) {
        throw new Error("Assistant provider request failed");
      }
      const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
      const text =
        payload.output_text ??
        payload.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").join("") ??
        "";
      return JSON.parse(text) as AssistantResponse;
    },
  };
}
