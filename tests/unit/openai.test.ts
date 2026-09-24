import { describe, expect, it, vi } from "vitest";
import { createOpenAIAssistant } from "@/lib/ai/openai";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";

describe("OpenAI adapter", () => {
  it("sends store false and leaves email out of the body", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            status: "ok",
            summary: "A general note.",
            practicalOptions: [],
            sourceIds: ["myplate"],
            disclaimer: REQUIRED_DISCLAIMER,
          }),
        }),
        { status: 200 },
      ),
    );
    const assistant = createOpenAIAssistant({
      apiKey: "test-key",
      model: "gpt-5.6-luna",
      fetchImpl,
    });
    await assistant.generate({
      message: "How does oats fit?",
      wellnessContexts: [],
      goals: ["understand_nutrition"],
      gentleFoodMode: false,
      coachingMode: "contextual_education",
      allowedSourceIds: ["myplate"],
    });
    const calls = fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>;
    const body = JSON.parse(String(calls[0]?.[1].body));
    expect(body.store).toBe(false);
    expect(body.model).toBe("gpt-5.6-luna");
    expect(JSON.stringify(body)).not.toContain("email");
    expect(body.input).not.toContain("@");
  });
});
