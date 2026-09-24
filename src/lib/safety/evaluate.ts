import { normalizeSafetyText, stripNegatedPhrases } from "./normalize";
import { isMediaRetelling, SAFETY_RULES } from "./rules";
import {
  SAFETY_RULE_VERSION,
  type SafetyDecision,
} from "./types";

const CLEAR: SafetyDecision = {
  emergency: false,
  category: null,
  responseKind: null,
  ruleVersion: SAFETY_RULE_VERSION,
  matchedRuleId: null,
};

export function evaluateSafety(raw: string): SafetyDecision {
  const normalized = normalizeSafetyText(raw);
  if (!normalized) return CLEAR;
  if (isMediaRetelling(normalized)) return CLEAR;

  const text = stripNegatedPhrases(normalized);
  for (const rule of SAFETY_RULES) {
    if (rule.pattern.test(text)) {
      return {
        emergency: true,
        category: rule.category,
        responseKind: rule.responseKind,
        ruleVersion: SAFETY_RULE_VERSION,
        matchedRuleId: rule.id,
      };
    }
  }
  return CLEAR;
}
