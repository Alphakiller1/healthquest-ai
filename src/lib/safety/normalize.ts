const MISSPELLINGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bchest pane\b/g, "chest pain"],
  [/\bchestpain\b/g, "chest pain"],
  [/\bheartattack\b/g, "heart attack"],
  [/\bhart attack\b/g, "heart attack"],
  [/\bstroak\b/g, "stroke"],
  [/\bstrok\b/g, "stroke"],
  [/\banaph[a-z]*l[a-z]*xis\b/g, "anaphylaxis"],
  [/\banaph[a-z]*l[a-z]*ctic\b/g, "anaphylactic"],
  [/\boverdoss/g, "overdos"],
  [/\bsuicid(?:le|el|ale)\b/g, "suicidal"],
  [/\bsuiside\b/g, "suicide"],
  [/\bbreating\b/g, "breathing"],
  [/\bbreahting\b/g, "breathing"],
  [/\bbleding\b/g, "bleeding"],
  [/\bunconcious\b/g, "unconscious"],
  [/\bseizure?ing\b/g, "seizing"],
  [/\bpils\b/g, "pills"],
  [/\bmyslef\b/g, "myself"],
];

/** Apostrophe-less contractions people type on phones, restored so rules can use one spelling. */
const CONTRACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bim\b/g, "i'm"],
  [/\bive\b/g, "i've"],
  [/\bcant\b/g, "can't"],
  [/\bcan not\b/g, "cannot"],
  [/\bdont\b/g, "don't"],
  [/\bdoesnt\b/g, "doesn't"],
  [/\bdidnt\b/g, "didn't"],
  [/\bisnt\b/g, "isn't"],
  [/\barent\b/g, "aren't"],
  [/\bwasnt\b/g, "wasn't"],
  [/\bwont\b/g, "won't"],
  [/\bhes\b/g, "he's"],
  [/\bshes\b/g, "she's"],
  [/\btheyre\b/g, "they're"],
  [/\bwanna\b/g, "want to"],
  [/\bgonna\b/g, "going to"],
];

export function normalizeSafetyText(raw: string): string {
  let text = raw.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  text = text.replace(/[’‘`´]/g, "'");
  text = text.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of MISSPELLINGS) {
    text = text.replace(pattern, replacement);
  }
  // "can't breath" is the most common way people type it.
  text = text.replace(/\b(can't|cannot|unable to|struggling to|fighting to|barely|not|hard to) breath\b/g, "$1 breathe");
  return text;
}

/** Split into clauses so a negation or question in one part cannot hide distress in another. */
export function splitClauses(text: string): string[] {
  return text
    .split(/[.!?;\n]+|,? \bbut\b |,? \bhowever\b |,? \bthough\b /)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

/** Remove clearly negated symptom phrases so "I don't have chest pain" cannot match. */
export function stripNegatedPhrases(text: string): string {
  return text
    .replace(/\b(?:do not|don't|never) want to (?:kill myself|die|hurt myself|end my life|harm myself)\b[^,;]*/g, " ")
    .replace(/\b(?:do not|don't|did not|didn't|never|without|no longer)\s+(?:have|feel|get|experience|had|having)\b[^,;]*/g, " ")
    .replace(/\bnot having\b[^,;]*/g, " ")
    .replace(/\bno\s+(?:more )?(?:chest pain|stroke|bleeding|shortness of breath|trouble breathing|swelling)\b[^,;]*/g, " ");
}

/** Everyday exaggeration that uses emergency words. */
export function stripHyperbole(text: string): string {
  return text
    .replace(/\bheart attack (?:burger|sandwich|on a plate|in a (?:bun|box|bowl)|food|fries|dessert)\b/g, " ")
    .replace(/\b(?:you're|you are|this is|that's|it's|this|that|these|those|work|school|it) (?:\w+ )?(?:is |are )?killing me\b/g, " ")
    .replace(/\b(?:dying|die|dead) (?:for|to (?:try|see|know|eat|go|get|hear|watch))\b/g, " ")
    .replace(/\bi'm (?:dead|dying)(?: lol| lmao| haha)\b|\b(?:lol|lmao|haha) i'm dead\b/g, " ")
    .replace(/\bscared to death\b|\bbored to death\b|\bto death of\b/g, " ");
}
