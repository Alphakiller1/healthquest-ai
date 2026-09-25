import type { SafetyRule } from "./types";

/*
 * Versioned acute-pattern groups, matched per clause on normalized text.
 * Topic words alone ("stroke", "chest pain") are not rules: a match needs
 * present distress in the person writing or someone with them. Educational
 * questions, past history, media retellings, and hyperbole are removed by
 * evaluate.ts before non-strong rules run.
 *
 * Every change here needs a matching case in tests/unit/safety-corpus.test.ts.
 */

// Someone present: the writer, or a person with them right now.
const WHO = String.raw`(?:i|i'm|i am|he|she|they|he's|she's|they're|someone|somebody|(?:my|our|the|this) [a-z]+)`;
const THEIR = String.raw`(?:my|his|her|their)`;
const DRUGS = String.raw`(?:pills|tablets|capsules|meds|medication|medications|medicine|painkillers|tylenol|acetaminophen|ibuprofen|advil|aspirin|xanax|benadryl|opioids|oxy[a-z]*|fentanyl|heroin|insulin|antidepressants|sleeping pills|sleep aids?)`;
const LOTS = String.raw`(?:too many|way too many|a (?:whole |full |entire )?bottle(?: of)?|the (?:whole |entire )?bottle(?: of)?|all (?:of )?(?:my|his|her|their|the)|a bunch of|a handful of|handfuls of|lots of|a lot of|a ton of|\d{2,}|twenty|thirty|forty|fifty|a hundred|double|triple)`;
const HOUSEHOLD = String.raw`(?:bleach|cleaning (?:fluid|product|spray|solution|supplies|chemicals?)|cleaner|detergent|laundry pods?|tide pods?|dishwasher (?:pods?|detergent)|antifreeze|drain cleaner|oven cleaner|pesticide|bug spray|weed killer|rat poison|poison|lighter fluid|gasoline|kerosene|lamp oil|paint thinner|button batter(?:y|ies)|nicotine(?: liquid)?|vape (?:juice|liquid)|e-liquid|windshield washer fluid|ammonia)`;

const r = (source: string) => new RegExp(source);

export const SAFETY_RULES: readonly SafetyRule[] = [
  // ── Self-harm and suicide: always strong. A question frame never cancels these.
  {
    id: "self_harm.kill_self",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:kill|killing|hang|hanging|shoot|shooting|drown|drowning|unalive|unaliving) myself\b|\bkms\b`),
  },
  {
    id: "self_harm.end_life",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:end|ending|take|taking) my (?:own )?life\b|\bend(?:ing)? it all\b|\bend it (?:tonight|today|now|soon)\b`),
  },
  {
    id: "self_harm.want_to_die",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:want|wanna|going|gonna|plan|planning|trying|ready) to die\b|\bwish i (?:was|were|could be) dead\b|\bwish i (?:had )?never (?:been born|existed)\b|\bdon't want to (?:be alive|live|exist|be here anymore|wake up)\b|\bno (?:reason|point) (?:to|in) (?:live|living|keep going|going on)\b|\bnothing (?:left )?to live for\b`),
  },
  {
    id: "self_harm.better_off",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\bbetter off (?:dead|without me|if i (?:was|were|died|wasn't here|weren't here)(?: dead| gone)?)\b`),
  },
  {
    id: "self_harm.thinking_about",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:thinking|thought|think|thoughts) (?:about|of) (?:suicide|killing myself|ending (?:it|it all|my life)|taking my (?:own )?life|dying|not being here)\b`),
  },
  {
    id: "self_harm.self_injury",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:cutting|burning|hurting|harming|starving) myself\b|\b(?:want|going|gonna|plan|planning|need) to (?:hurt|cut|harm|burn) myself\b`),
  },
  {
    id: "self_harm.suicidal_first_person",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\bi(?:'m| am| feel| feel so| have been| 've been| keep feeling) (?:really |so |very )?suicidal\b|\b(?:suicide|goodbye) (?:note|letter)\b`),
  },
  {
    id: "self_harm.other_person",
    category: "self_harm",
    responseKind: "crisis",
    strong: true,
    pattern: r(String.raw`\b(?:kill|killing|hurt|hurting) (?:himself|herself|themselves)\b|\b${WHO} (?:is|are|keeps|has been) (?:talking about|threatening|planning) (?:suicide|to die|to end (?:his|her|their) life)\b`),
  },
  {
    id: "self_harm.suicidal_thoughts",
    category: "self_harm",
    responseKind: "crisis",
    pattern: r(String.raw`\b(?:having|have|had|get|getting) suicidal (?:thoughts|feelings)\b|\bself[- ]harm(?:ing)?\b`),
  },

  // ── Cardiac
  {
    id: "cardiac.heart_attack_now",
    category: "cardiac",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:having|is having|'s having|are having|getting) (?:a |an |another )?heart attack\b`),
  },
  {
    id: "cardiac.chest_symptom_self",
    category: "cardiac",
    responseKind: "medical",
    pattern: r(
      String.raw`\bmy chest (?:hurts|is hurting|really hurts|is killing me|feels (?:tight|heavy|crushed|like)|is (?:tight|heavy|squeezing|pounding|burning))\b` +
        String.raw`|\b(?:pain|pressure|tightness|squeezing|heaviness) in my chest\b` +
        String.raw`|\bi (?:have|am having|'m having|got|feel|am feeling|'m feeling|keep getting|keep having)(?: [a-z']+){0,4}? chest (?:pain|pressure|tightness|pains)\b` +
        String.raw`|\bchest (?:feels|is) (?:so |really )?(?:tight|heavy|crushed)\b|\bcrushing chest\b`,
    ),
  },
  {
    id: "cardiac.chest_symptom_other",
    category: "cardiac",
    responseKind: "medical",
    pattern: r(String.raw`\b${WHO} (?:has|have|is having|'s having|are having|is complaining of|complains of|says (?:he|she|they) (?:has|have))(?: [a-z']+){0,3}? chest (?:pain|pressure|tightness)\b|\b(?:his|her|their) chest (?:hurts|is hurting)\b`),
  },

  // ── Stroke
  {
    id: "stroke.having_stroke",
    category: "stroke",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:having|is having|'s having|are having) (?:a |another )?stroke\b`),
  },
  {
    id: "stroke.face_droop",
    category: "stroke",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\b(?:face|mouth|smile|lip|eye) (?:is |has |just |started |suddenly )*(?:drooping|droopy|drooped|sagging|twisted|gone numb|numb on one side)\b`),
  },
  {
    id: "stroke.speech",
    category: "stroke",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:speech|words|talking|voice) (?:is |are |sounds? |suddenly )*(?:slurred|slurring|garbled|jumbled)\b|\bslurring (?:my|his|her|their) (?:words|speech)\b|\b(?:can't|cannot) (?:talk|speak|get (?:my|his|her) words out) (?:properly|right|clearly|anymore)\b`),
  },
  {
    id: "stroke.limb_weakness",
    category: "stroke",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:can't|cannot|unable to) (?:lift|raise|move|feel|use) ${THEIR} (?:arm|leg|hand|left|right)\b|\bone side of ${THEIR} (?:body|face) (?:is|feels|went|has gone|suddenly (?:is|went)) (?:weak|numb|dead|limp|droopy|heavy)\b`),
  },
  {
    id: "stroke.sudden_signs",
    category: "stroke",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\bsudden(?:ly)?\b[^.]{0,40}\b(?:numb|numbness|weak|weakness|paralyzed|can't see|lost (?:my|his|her|their) vision|blind in|confused and)\b[^.]{0,30}\b(?:one side|left side|right side|face|arm|leg|eye)\b|\bworst headache of ${THEIR} life\b|\bthunderclap headache\b`),
  },

  // ── Breathing
  {
    id: "respiratory.cannot_breathe",
    category: "respiratory",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:can't|cannot|unable to|struggling to|fighting to|barely) (?:breathe|catch ${THEIR} breath|get (?:any |enough )?air)\b`),
  },
  {
    id: "respiratory.trouble_breathing_now",
    category: "respiratory",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:having|is having|'s having|are having) (?:a )?(?:really |very |such a |so much )?(?:hard time|trouble|difficulty|difficulties|a hard time) breathing\b|\bgasping(?: for (?:air|breath))?\b|\bsevere (?:trouble|difficulty|shortness of) breath(?:ing)?\b`),
  },
  {
    id: "respiratory.not_breathing",
    category: "respiratory",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\b(?:isn't|is not|aren't|are not|wasn't|stopped|not) breathing\b|\b(?:lips|face|skin|fingers|baby|he|she|they) (?:is |are |'s )?(?:turning|turned|going|gone) (?:blue|gray|grey)\b|\bturning blue\b`),
  },
  {
    id: "respiratory.choking",
    category: "respiratory",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:is|'s|am|'m|are|keeps) choking\b|\bchoking (?:on|and)\b`),
  },

  // ── Severe allergic reaction
  {
    id: "anaphylaxis.airway",
    category: "anaphylaxis",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\bthroat (?:is |feels |keeps )?(?:closing|swelling|swollen|tight|tightening|closing up|getting tight)\b|\b(?:can't|cannot) swallow\b`),
  },
  {
    id: "anaphylaxis.swelling",
    category: "anaphylaxis",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:tongue|lips|face|mouth|eyes) (?:is |are |started |keep |keeps |suddenly )*(?:swelling|swollen|swelled|puffing up|blowing up)\b`),
  },
  {
    id: "anaphylaxis.named_or_epipen",
    category: "anaphylaxis",
    responseKind: "medical",
    pattern: r(String.raw`\b(?:is|this is|having|going into|in|think (?:it's|this is)) (?:an? )?anaphyla(?:xis|ctic)\b|\b(?:used|use|need|needs|give|gave|giving) (?:my|an|his|her|their|the) epi ?-?pen\b`),
  },

  // ── Bleeding
  {
    id: "bleeding.uncontrolled",
    category: "bleeding",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\bbleeding (?:won't|will not|wont|doesn't|does not) stop\b|\buncontrolled bleeding\b|\bbleeding\b[^.]{0,48}\b(?:won't|will not|wont|can't|cannot) stop\b|\b(?:won't|will not|can't|cannot) stop (?:the )?bleeding\b`),
  },
  {
    id: "bleeding.heavy",
    category: "bleeding",
    responseKind: "medical",
    pattern: r(String.raw`\bbleeding (?:a lot|heavily|badly|everywhere|so much|like crazy|through)\b|\b(?:spurting|gushing|pouring) blood\b|\bblood (?:is )?(?:spurting|gushing|pouring)\b|\b(?:coughing|throwing|vomiting|puking) up blood\b|\bvomiting blood\b`),
  },

  // ── Consciousness and seizures
  {
    id: "consciousness.unresponsive",
    category: "consciousness",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\b(?:won't|will not|can't|cannot) wake (?:him |her |them )?up\b|\bwon't wake up\b|\bunresponsive\b|\b(?:isn't|is not|not|stopped) (?:waking up|responding to (?:me|us|anything|anyone|his name|her name))\b`),
  },
  {
    id: "consciousness.collapsed",
    category: "consciousness",
    responseKind: "medical",
    pattern: r(String.raw`\b${WHO} (?:just )?(?:collapsed|passed out|fainted|blacked out|went limp|lost consciousness)\b|\b(?:is|'s|are) (?:unconscious|seizing|having a seizure|convulsing)\b|\bhaving a seizure\b`),
  },

  // ── Overdose
  {
    id: "overdose.named",
    category: "overdose",
    responseKind: "medical",
    pattern: r(String.raw`\b${WHO} (?:just |might have |may have |think i )?(?:overdosed|is overdosing|'s overdosing|are overdosing|od'd|od'ed)\b|\bi overdosed\b`),
  },
  {
    id: "overdose.quantity",
    category: "overdose",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\b(?:took|swallowed|taken|ate|had|popped|downed|chugged)(?: [a-z']+){0,3}? ${LOTS}(?: [a-z']+){0,4}? ${DRUGS}\b`),
  },

  // ── Poisoning
  {
    id: "poisoning.household",
    category: "poisoning",
    responseKind: "medical",
    strong: true,
    pattern: r(String.raw`\b(?:swallowed|drank|drunk|ate|eaten|drinking|swallowing|got into|ingested|chewed|licked|sipped)(?: [a-z']+){0,3}? ${HOUSEHOLD}\b`),
  },
  {
    id: "poisoning.named",
    category: "poisoning",
    responseKind: "medical",
    pattern: r(String.raw`\b${WHO} (?:was|got|has been|might have been|may have been|think (?:i|he|she|they) (?:was|were|got)) poisoned\b|\bcall(?:ing)? poison control\b`),
  },
];

const MEDIA = /\b(?:movie|film|tv show|television|series|episode|watched a|watching a|netflix|novel|in the book|documentary)\b/;

const FIRST_PERSON_DISTRESS =
  /\bi (?:have|am|'m|took|swallowed|can't|cannot|want to|feel|just)\b|\bi'm\b|\bright now\b|\bmy (?:chest|throat|face)\b/;

/** A retelling of media ("in the movie someone overdosed") without the writer in distress. */
export function isMediaRetelling(text: string): boolean {
  return MEDIA.test(text) && !FIRST_PERSON_DISTRESS.test(text);
}
