import type { SafetyRule } from "./types";

/**
 * Versioned acute-pattern groups. Topic words alone ("stroke", "chest pain")
 * are intentionally not rules. A match requires present-tense distress.
 */
export const SAFETY_RULES: readonly SafetyRule[] = [
  {
    id: "cardiac.having_heart_attack",
    category: "cardiac",
    responseKind: "medical",
    pattern:
      /\bi (?:am|'m|think i am|think i'm|might be) having (?:a )?heart attack\b/,
  },
  {
    id: "cardiac.chest_pain_first_person",
    category: "cardiac",
    responseKind: "medical",
    pattern:
      /\bi (?:have|am having|'m having|feel) (?:severe |crushing |bad |heavy )?(?:chest pain|chest pressure|pressure in my chest|pain in my chest)\b/,
  },
  {
    id: "cardiac.crushing_chest_pain",
    category: "cardiac",
    responseKind: "medical",
    pattern: /\bcrushing chest pain\b/,
  },
  {
    id: "cardiac.third_person_now",
    category: "cardiac",
    responseKind: "medical",
    pattern:
      /\b(?:he|she|they|my (?:dad|mom|father|mother|friend|partner|husband|wife)) (?:is|are|'s) having (?:a )?heart attack\b/,
  },
  {
    id: "stroke.having_stroke",
    category: "stroke",
    responseKind: "medical",
    pattern:
      /\bi (?:am|'m|think i am|think i'm|might be) having (?:a )?stroke\b/,
  },
  {
    id: "stroke.acute_signs_self",
    category: "stroke",
    responseKind: "medical",
    pattern:
      /\bmy face is drooping\b|\bmy speech is slurred\b|\bone side of my body (?:is|feels) (?:weak|numb)\b/,
  },
  {
    id: "stroke.third_person_now",
    category: "stroke",
    responseKind: "medical",
    pattern:
      /\b(?:he|she|they|my (?:dad|mom|father|mother|friend|partner|husband|wife)) (?:is|are|'s) having (?:a )?stroke\b/,
  },
  {
    id: "respiratory.cannot_breathe",
    category: "respiratory",
    responseKind: "medical",
    pattern: /\bi (?:can't|cannot) breathe\b/,
  },
  {
    id: "respiratory.gasping",
    category: "respiratory",
    responseKind: "medical",
    pattern: /\bgasping for air\b|\bsevere (?:trouble|difficulty) breathing\b/,
  },
  {
    id: "anaphylaxis.throat_or_named",
    category: "anaphylaxis",
    responseKind: "medical",
    pattern:
      /\b(?:anaphylaxis|anaphylactic|my throat is closing|throat is closing)\b/,
  },
  {
    id: "bleeding.will_not_stop",
    category: "bleeding",
    responseKind: "medical",
    pattern:
      /\b(?:bleeding (?:won't|will not|wont) stop|uncontrolled bleeding)\b|\bbleeding\b[^.]{0,48}\b(?:won't|will not|wont|can't|cannot) stop\b/,
  },
  {
    id: "consciousness.not_waking",
    category: "consciousness",
    responseKind: "medical",
    pattern:
      /\b(?:won't wake up|will not wake up|unresponsive|not waking up)\b/,
  },
  {
    id: "consciousness.just_passed_out",
    category: "consciousness",
    responseKind: "medical",
    pattern:
      /\bi (?:just )?(?:passed out|lost consciousness)\b(?!\s+(?:yesterday|last|a while|earlier))/,
  },
  {
    id: "overdose.first_person",
    category: "overdose",
    responseKind: "medical",
    pattern:
      /\bi overdosed\b|\bi (?:took|swallowed) (?:too many |a whole bottle of |the whole bottle of )?(?:pills|medication|medicine|tablets)\b/,
  },
  {
    id: "self_harm.intent",
    category: "self_harm",
    responseKind: "crisis",
    pattern:
      /\b(?:kill myself|end my life)\b|\bi (?:want to|wanna|am going to|'m going to) die\b|\bi (?:don't|do not) want to live\b|\bi(?:'m| am) suicidal\b|\bi (?:want to|am going to|'m going to) hurt myself\b/,
  },
];

const MEDIA =
  /\b(movie|film|tv show|television show|watched a|netflix)\b/;

const FIRST_PERSON_DISTRESS =
  /\bi (?:have|am|'m|took|swallowed|can't|cannot|want to|feel|just)\b/;

export function isMediaRetelling(text: string): boolean {
  return MEDIA.test(text) && !FIRST_PERSON_DISTRESS.test(text);
}
