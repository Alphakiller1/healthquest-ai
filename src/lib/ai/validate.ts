import { z } from "zod";
import { REQUIRED_DISCLAIMER, type AssistantResponse } from "./types";

/*
 * Output boundary checks. A match rejects the whole answer; the text is never
 * edited to remove words, because that can change its meaning. Each rule has
 * a reason that is sent back to the model for its one retry.
 */
const PROHIBITED: ReadonlyArray<readonly [RegExp, string]> = [
  // Diagnosis
  [/\b(?:this|that|it) (?:means|shows|suggests|sounds like) you (?:have|might have|may have|probably have)\b/i, "stated or implied a diagnosis"],
  [/\byou (?:have|probably have|likely have|might have|may have|are suffering from) (?:high |low )?(?:diabetes|prediabetes|hypertension|high blood pressure|heart disease|an? (?:eating )?disorder|depression|anxiety disorder|kidney disease|cancer|high cholesterol|sleep apnea|insomnia)\b/i, "stated or implied a diagnosis"],
  [/\byou(?:'re| are) (?:diabetic|hypertensive|pre-?diabetic|anorexic|bulimic|depressed|obese)\b/i, "labelled the person with a condition"],
  [/\b(?:i|we) (?:can )?diagnose\b|\byou are diagnosed\b/i, "claimed to diagnose"],
  // Treatment and medication
  [/\b(?:take|taking|start taking|try taking) \d+(?:\.\d+)?\s?(?:mg|mcg|milligrams?|micrograms?|units?|iu|grams? of)\b/i, "gave a dose"],
  [/\b(?:stop|quit|skip|pause|reduce|lower|increase|double|change) (?:taking )?(?:your|the) (?:medication|medicine|meds|dose|dosage|insulin|statin|prescription|pills)\b/i, "advised changing medication"],
  [/\byou (?:should|need to|must|have to) (?:take|start|use) (?:a |an )?(?:statin|metformin|insulin|medication|medicine|supplement|aspirin)\b/i, "recommended a medication or supplement"],
  [/\b(?:treat|cure|reverse|heal) (?:your|this|the) (?:condition|disease|diabetes|hypertension|blood pressure|cholesterol)\b/i, "offered treatment"],
  [/\byou (?:should|need to) treat\b/i, "offered treatment"],
  // Outcome promises and risk numbers
  [/\b(?:this|it|that|doing this) will (?:lower|reduce|cure|prevent|reverse|fix|treat|eliminate|normalize)\b/i, "promised an outcome"],
  [/\bguarantee[sd]?\b/i, "promised an outcome"],
  [/\byour (?:risk|chance|odds|likelihood) (?:is|of)\b[^.]{0,40}\d/i, "estimated a personal risk"],
  [/\b\d{1,3}\s?% (?:risk|chance|likely|likelihood)\b/i, "gave a risk percentage"],
  // Food morality and restriction
  [/\b(?:bad|junk|toxic|poison|forbidden|cheat|guilty|sinful|clean) (?:foods?|meals?|eating)\b/i, "labelled food as good or bad"],
  [/\b(?:good|great|perfect|healthy) (?:choice|job|meal)\b[^.]{0,30}\b(?:skipp|less|fewer|restrict|cut)/i, "praised restriction"],
  [/\b(?:calorie deficit|eat (?:less than|under) \d+ calories|lose \d+ (?:pounds|lbs|kg)|skip (?:a |the )?meals?|fasting (?:to|for) (?:lose|weight))\b/i, "encouraged restriction or weight loss"],
];

const GENTLE: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:calorie|calories|kcal|weight|pounds|lbs|bmi|slim|thin|burn off)\b/i, "mentioned calories or weight while Gentle Food Mode is on"],
];

export const assistantResponseSchema = z.object({
  status: z.enum(["ok", "education_only"]),
  summary: z.string().min(1).max(1200),
  context: z.string().max(800).optional(),
  practicalOptions: z.array(z.string().min(1).max(400)).max(6),
  sourceIds: z.array(z.string().min(1)).max(8),
  uncertainty: z.string().max(600).optional(),
  professionalFollowup: z.string().max(600).optional(),
  disclaimer: z.literal(REQUIRED_DISCLAIMER),
});

export type ValidationResult =
  | { ok: true; response: AssistantResponse }
  | { ok: false; reason: string };

export function validateAssistantResponse(
  value: unknown,
  knownSourceIds: ReadonlySet<string>,
  options: { gentleFoodMode?: boolean } = {},
): ValidationResult {
  const parsed = assistantResponseSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, reason: "schema" };
  }
  const response = parsed.data;
  const blob = [
    response.summary,
    response.context ?? "",
    response.uncertainty ?? "",
    response.professionalFollowup ?? "",
    ...response.practicalOptions,
  ].join("\n");
  const rules = options.gentleFoodMode ? [...PROHIBITED, ...GENTLE] : PROHIBITED;
  const hit = rules.find(([pattern]) => pattern.test(blob));
  if (hit) {
    return { ok: false, reason: `prohibited_pattern: ${hit[1]}` };
  }
  const unknown = response.sourceIds.find((id) => !knownSourceIds.has(id));
  if (unknown) {
    return { ok: false, reason: "unknown_citation" };
  }
  return { ok: true, response };
}
