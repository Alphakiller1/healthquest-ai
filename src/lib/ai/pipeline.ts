import { evaluateSafety } from "@/lib/safety/evaluate";
import { emergencyTemplate } from "@/lib/safety/responses";
import type { SafetyDecision } from "@/lib/safety/types";
import type {
  AssistantResponse,
  HealthAssistantProvider,
  SafeAssistantInput,
} from "./types";
import { validateAssistantResponse } from "./validate";

export type AssistantTurnResult =
  | {
      type: "emergency";
      decision: SafetyDecision;
      message: string;
      actions: Array<"call_911" | "call_988" | "text_988">;
      providerCalled: false;
    }
  | {
      type: "answer";
      response: AssistantResponse;
      providerCalled: true;
    }
  | {
      type: "fallback";
      providerCalled: boolean;
      reason: string;
    };

const FALLBACK_SUMMARY =
  "I can only share general wellness education that passes HealthQuest safety checks. Please try rephrasing, or talk with a qualified healthcare professional about this.";

export async function runAssistantPipeline(
  input: SafeAssistantInput,
  provider: HealthAssistantProvider,
  knownSourceIds: ReadonlySet<string>,
): Promise<AssistantTurnResult> {
  const decision = evaluateSafety(input.message);
  if (decision.emergency && decision.responseKind) {
    const template = emergencyTemplate(decision.responseKind);
    return {
      type: "emergency",
      decision,
      message: template.message,
      actions: template.actions,
      providerCalled: false,
    };
  }

  let providerCalled = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    providerCalled = true;
    const generated = await provider.generate(input);
    const validated = validateAssistantResponse(generated, knownSourceIds);
    if (validated.ok) {
      if (
        input.coachingMode === "education_only" &&
        validated.response.status !== "education_only"
      ) {
        continue;
      }
      return {
        type: "answer",
        response: validated.response,
        providerCalled,
      };
    }
  }

  return {
    type: "fallback",
    providerCalled,
    reason: FALLBACK_SUMMARY,
  };
}
