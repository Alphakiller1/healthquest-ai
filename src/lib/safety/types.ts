export const SAFETY_RULE_VERSION = "2026.09.24.1";

export const SAFETY_CATEGORIES = [
  "cardiac",
  "stroke",
  "respiratory",
  "anaphylaxis",
  "bleeding",
  "consciousness",
  "overdose",
  "self_harm",
] as const;

export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export type EmergencyResponseKind = "medical" | "crisis";

export type SafetyDecision = {
  emergency: boolean;
  category: SafetyCategory | null;
  responseKind: EmergencyResponseKind | null;
  ruleVersion: string;
  matchedRuleId: string | null;
};

export type SafetyRule = {
  id: string;
  category: SafetyCategory;
  responseKind: EmergencyResponseKind;
  pattern: RegExp;
};
