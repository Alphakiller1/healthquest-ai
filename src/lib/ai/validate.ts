import { z } from "zod";
import { REQUIRED_DISCLAIMER, type AssistantResponse } from "./types";

const PROHIBITED = [
  /\bthis will (?:lower|cure|prevent|treat)\b/i,
  /\byou (?:should|need to) treat\b/i,
  /\bthis means you have\b/i,
  /\byour risk is \d/i,
  /\byou are diagnosed\b/i,
];

export const assistantResponseSchema = z.object({
  status: z.enum(["ok", "education_only"]),
  summary: z.string().min(1).max(1200),
  context: z.string().max(800).optional(),
  practicalOptions: z.array(z.string().min(1).max(400)).max(6),
  sourceIds: z.array(z.string().min(1)).max(8),
  uncertainty: z.string().max(600).optional(),
  professionalFollowup: z.string().max(600).optional(),
  disclaimer: z.literal(REQUIRED_DISCLAIMER),
});

export type ValidationResult =
  | { ok: true; response: AssistantResponse }
  | { ok: false; reason: string };

export function validateAssistantResponse(
  value: unknown,
  knownSourceIds: ReadonlySet<string>,
): ValidationResult {
  const parsed = assistantResponseSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, reason: "schema" };
  }
  const response = parsed.data;
  const blob = [
    response.summary,
    response.context ?? "",
    response.uncertainty ?? "",
    response.professionalFollowup ?? "",
    ...response.practicalOptions,
  ].join("\n");
  if (PROHIBITED.some((pattern) => pattern.test(blob))) {
    return { ok: false, reason: "prohibited_pattern" };
  }
  const unknown = response.sourceIds.find((id) => !knownSourceIds.has(id));
  if (unknown) {
    return { ok: false, reason: "unknown_citation" };
  }
  return { ok: true, response };
}
