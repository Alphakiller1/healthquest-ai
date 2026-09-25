import {
  REQUIRED_DISCLAIMER,
  type AssistantClaim,
  type AssistantResponse,
  type HealthAssistantProvider,
  type SafeAssistantInput,
} from "./types";

/**
 * A deterministic answer assembled only from reviewed claims, with no model.
 * Used when no LLM is configured. Every sentence is a claim that was handed
 * in, so nothing here can be invented; the UI labels it as built from
 * reviewed sources rather than written by AI.
 */
export function createEvidenceAssistant(): HealthAssistantProvider {
  return {
    async generate(input: SafeAssistantInput): Promise<AssistantResponse> {
      return composeFromClaims(input);
    },
  };
}

export const NOT_COVERED_SUMMARY =
  "HealthQuest doesn't have reviewed material on that yet, so it won't guess. A clinician or pharmacist is the right person for this one.";

export function composeFromClaims(input: SafeAssistantInput): AssistantResponse {
  const claims = input.claims ?? [];
  const of = (...kinds: AssistantClaim["kind"][]) => claims.filter((claim) => kinds.includes(claim.kind));
  const status = input.coachingMode === "education_only" ? "education_only" : "ok";

  const lead = of("explain", "pattern").slice(0, 2);
  const practical = of("practical").slice(0, 3);
  const boundary = of("boundary")[0];
  const ask = of("ask")[0];

  if (lead.length === 0 && practical.length === 0 && !boundary) {
    return {
      status,
      summary: NOT_COVERED_SUMMARY,
      practicalOptions: ["Browse the lessons for topics HealthQuest has reviewed.", "Write the question down to bring to your next visit."],
      sourceIds: [],
      disclaimer: REQUIRED_DISCLAIMER,
    };
  }

  const used = [...lead, ...practical, boundary, ask].filter((claim): claim is AssistantClaim => Boolean(claim));
  const summary = (lead.length > 0 ? lead : [boundary ?? practical[0]]).map((claim) => claim.claim).join(" ");
  const foodLine = input.food?.description ? `This note is about ${input.food.description}.` : undefined;
  const contextLine =
    status === "education_only"
      ? "Because of a topic you chose, HealthQuest keeps this to general education rather than personal suggestions."
      : undefined;

  return {
    status,
    summary,
    context: [foodLine, contextLine].filter(Boolean).join(" ") || undefined,
    practicalOptions: status === "education_only" ? [] : practical.map((claim) => claim.claim),
    sourceIds: [...new Set(used.map((claim) => claim.sourceId))],
    uncertainty:
      input.food?.nutrientStatus === "uncertain"
        ? "No nutrition match was chosen, so this stays general."
        : boundary && lead.length > 0
          ? boundary.claim
          : undefined,
    professionalFollowup: ask?.claim,
    disclaimer: REQUIRED_DISCLAIMER,
  };
}
