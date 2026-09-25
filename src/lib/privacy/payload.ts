import type { SafeAssistantInput } from "@/lib/ai/types";

const FORBIDDEN_KEYS = [
  "email",
  "fullName",
  "full_name",
  "name",
  "phone",
  "userId",
  "user_id",
  "authId",
  "auth_id",
] as const;

export type RawUserContext = {
  email?: string;
  fullName?: string;
  userId?: string;
  phone?: string;
  wellnessContexts: string[];
  goals: string[];
  gentleFoodMode: boolean;
  coachingMode: SafeAssistantInput["coachingMode"];
  message: string;
  food?: SafeAssistantInput["food"];
  allowedSourceIds: string[];
  claims?: SafeAssistantInput["claims"];
  unrelatedNotes?: string;
};

export function buildMinimalAssistantInput(
  raw: RawUserContext,
): SafeAssistantInput {
  const input: SafeAssistantInput = {
    message: raw.message,
    wellnessContexts: raw.wellnessContexts,
    goals: raw.goals,
    gentleFoodMode: raw.gentleFoodMode,
    coachingMode: raw.coachingMode,
    food: raw.food,
    allowedSourceIds: raw.allowedSourceIds,
    ...(raw.claims ? { claims: raw.claims } : {}),
  };
  const serialized = JSON.stringify(input);
  for (const key of FORBIDDEN_KEYS) {
    if (serialized.includes(`"${key}"`)) {
      throw new Error(`LLM payload included forbidden field: ${key}`);
    }
  }
  if (raw.email && serialized.includes(raw.email)) {
    throw new Error("LLM payload included an email address");
  }
  if (raw.fullName && serialized.includes(raw.fullName)) {
    throw new Error("LLM payload included a full name");
  }
  if (raw.userId && serialized.includes(raw.userId)) {
    throw new Error("LLM payload included an authentication identifier");
  }
  return input;
}
