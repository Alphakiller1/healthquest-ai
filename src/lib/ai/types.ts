export type WellnessContextId = string;

export type SafeFoodContext = {
  description: string;
  nutrients?: Record<string, number | null>;
  nutrientStatus?: "matched" | "uncertain";
  demoNutrition?: boolean;
};

/** Fields the model is allowed to see. Identity and contact data are excluded. */
export type SafeAssistantInput = {
  message: string;
  wellnessContexts: WellnessContextId[];
  goals: string[];
  gentleFoodMode: boolean;
  coachingMode: "contextual_education" | "education_only";
  food?: SafeFoodContext;
  allowedSourceIds: string[];
};

export type AssistantResponse = {
  status: "ok" | "education_only";
  summary: string;
  context?: string;
  practicalOptions: string[];
  sourceIds: string[];
  uncertainty?: string;
  professionalFollowup?: string;
  disclaimer: string;
};

export interface HealthAssistantProvider {
  generate(input: SafeAssistantInput): Promise<AssistantResponse>;
}

export const REQUIRED_DISCLAIMER =
  "HealthQuest provides educational wellness information, not medical advice, diagnosis, or treatment. For medical decisions, talk with a qualified healthcare professional.";
