const MISSPELLINGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bchest pane\b/g, "chest pain"],
  [/\bchestpain\b/g, "chest pain"],
  [/\bcant breath\b/g, "can't breathe"],
  [/\bcannot breath\b/g, "can't breathe"],
  [/\bcan not breathe\b/g, "can't breathe"],
  [/\bstroak\b/g, "stroke"],
  [/\banaphalaxis\b/g, "anaphylaxis"],
  [/\banaphilaxis\b/g, "anaphylaxis"],
  [/\boverdoss\b/g, "overdose"],
];

export function normalizeSafetyText(raw: string): string {
  let text = raw.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  text = text.replace(/[’‘]/g, "'");
  text = text.replace(/\bim\b/g, "i'm");
  text = text.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of MISSPELLINGS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

/** Remove clearly negated symptom phrases so "I don't have chest pain" cannot match. */
export function stripNegatedPhrases(text: string): string {
  return text
    .replace(
      /\b(?:do not|don't|dont) want to (?:kill myself|die|hurt myself|end my life)\b[^.,;!?]*/g,
      " ",
    )
    .replace(
      /\b(?:do not|don't|dont|did not|didn't|never|without)\s+(?:have|feel|get|experience|had)\b[^.,;!?]*?(?=\bbut\b|$)/g,
      " ",
    )
    .replace(/\bnot having\b[^.,;!?]*/g, " ")
    .replace(
      /\bno\s+(?:chest pain|stroke|bleeding|shortness of breath|trouble breathing)\b[^.,;!?]*/g,
      " ",
    );
}
