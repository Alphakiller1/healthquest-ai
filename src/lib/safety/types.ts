export const SAFETY_RULE_VERSION = "2026.09.25.2";

export const SAFETY_CATEGORIES = [
  "cardiac",
  "stroke",
  "respiratory",
  "anaphylaxis",
  "bleeding",
  "consciousness",
  "overdose",
  "poisoning",
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
  /**
   * Strong rules describe distress so specific ("my throat is closing") that an
   * educational or past-tense frame elsewhere in the clause does not cancel them.
   */
  strong?: boolean;
};
