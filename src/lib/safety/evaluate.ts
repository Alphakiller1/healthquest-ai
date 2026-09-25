import { normalizeSafetyText, splitClauses, stripHyperbole, stripNegatedPhrases } from "./normalize";
import { isMediaRetelling, SAFETY_RULES } from "./rules";
import { SAFETY_RULE_VERSION, type SafetyDecision, type SafetyRule } from "./types";

const CLEAR: SafetyDecision = {
  emergency: false,
  category: null,
  responseKind: null,
  ruleVersion: SAFETY_RULE_VERSION,
  matchedRuleId: null,
};

/** Words that put a person in the clause, present tense. Their absence makes a question informational. */
const PERSON_PRESENT =
  /\b(?:i'm|i am|i've|i have|i feel|i can't|i cannot|i took|i just|i think i'm|i might be|my|he|she|they|he's|she's|they're|someone|somebody|right now|now|currently|help)\b/;

const INFORMATIONAL =
  /^(?:what|what's|whats|how|why|when|which|who|is|are|can|could|does|do|should|would|will|tell me|explain|define|describe|list)\b|\b(?:signs|symptoms|causes|risk factors|meaning|definition|warning signs|risks) of\b|\bwhat (?:is|are|does|do|happens)\b|\bhow (?:do|does|can|to|would)\b/;

const PAST =
  /\b(?:years? ago|months? ago|weeks? ago|days ago|yesterday|last (?:year|month|week|summer|winter|spring|fall|night)|in (?:19|20)\d{2}|back in|when i was (?:a )?(?:kid|child|little|young|younger|teen|teenager)|history of|used to|survived|had (?:a |an )?(?:heart attack|stroke|seizure|overdose|allergic reaction))\b/;

const PRESENT_NOW = /\b(?:right now|now|currently|today|tonight|this morning|just|again|still|is|am|are|i'm|he's|she's|they're|keeps?)\b/;

/** "If someone is choking…" asks about a scenario, not something happening now. */
const HYPOTHETICAL =
  /\b(?:if|in case|what if|when|whenever) (?:someone|somebody|a person|people|you|your|a child|a kid|a baby|my|he|she|they)\b/;

function suppressed(clause: string): boolean {
  if (HYPOTHETICAL.test(clause) && !/\bright now\b/.test(clause)) return true;
  if (INFORMATIONAL.test(clause) && !PERSON_PRESENT.test(clause)) return true;
  if (PAST.test(clause) && !PRESENT_NOW.test(clause)) return true;
  return false;
}

/**
 * Deterministic emergency pre-check. Runs before any model call and never
 * calls one. Text is split into clauses; each clause has negations and
 * hyperbole removed. Strong rules match regardless of question, hypothetical,
 * or past framing; other rules need the clause to describe something
 * happening now. A crisis (self-harm) match wins over a medical one because
 * its template also offers 911.
 */
export function evaluateSafety(raw: string): SafetyDecision {
  const normalized = normalizeSafetyText(raw);
  if (!normalized) return CLEAR;
  const media = isMediaRetelling(normalized);

  let medical: SafetyRule | null = null;
  for (const rawClause of splitClauses(normalized)) {
    const clause = stripHyperbole(stripNegatedPhrases(rawClause)).replace(/\s+/g, " ").trim();
    if (!clause) continue;
    const quiet = media || suppressed(clause);
    for (const rule of SAFETY_RULES) {
      if (quiet && !rule.strong) continue;
      if (media && rule.responseKind === "medical") continue;
      if (!rule.pattern.test(clause)) continue;
      if (rule.responseKind === "crisis") return decision(rule);
      medical ??= rule;
    }
  }
  return medical ? decision(medical) : CLEAR;
}

function decision(rule: SafetyRule): SafetyDecision {
  return {
    emergency: true,
    category: rule.category,
    responseKind: rule.responseKind,
    ruleVersion: SAFETY_RULE_VERSION,
    matchedRuleId: rule.id,
  };
}
