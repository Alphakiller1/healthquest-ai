import type { DemoUser } from "@/lib/demo/store";
import { selectEvidence } from "@/lib/evidence/select";
import { resolveCoachingMode, shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { buildMinimalAssistantInput } from "@/lib/privacy/payload";
import type { SafeAssistantInput, SafeFoodContext } from "./types";

/**
 * Builds the only thing a model ever sees: the question, broad context ids,
 * goals, the food if any, and the reviewed claims selected for this question.
 * Identity fields are checked out by buildMinimalAssistantInput.
 */
export function prepareAssistantInput(user: DemoUser, message: string, food?: SafeFoodContext): SafeAssistantInput {
  const contexts = user.healthContextIds ?? [];
  const coachingMode = resolveCoachingMode(contexts);
  const gentleFoodMode = user.gentleFoodMode || shouldRecommendGentleFoodMode(contexts);
  const evidence = selectEvidence({
    message,
    foodDescription: food?.description,
    contextIds: contexts,
    goals: user.goals,
    coachingMode,
    gentleFoodMode,
  });
  const claims = evidence.claims.map(({ id, sourceId, kind, claim }) => ({ id, sourceId, kind, claim }));
  return buildMinimalAssistantInput({
    email: user.email,
    userId: user.id,
    message,
    wellnessContexts: contexts,
    goals: user.goals,
    gentleFoodMode,
    coachingMode,
    food,
    allowedSourceIds: [...new Set(claims.map((claim) => claim.sourceId))],
    claims,
  });
}
