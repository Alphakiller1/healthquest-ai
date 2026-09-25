import { getActiveSource } from "./registry";

/*
 * Evidence claims: short statements tied to one reviewed source. They restate
 * what the lessons already say about each source; nothing here is new medical
 * content. The assistant may only state and cite what it is handed from this
 * list, and a claim whose source is not active is never handed out.
 */

export type ClaimKind =
  | "explain" // what something is
  | "pattern" // what population guidance associates with it
  | "practical" // an option a person could try
  | "boundary" // what HealthQuest can and cannot tell you
  | "ask"; // a question to bring to a clinician

export type EvidenceClaim = {
  id: string;
  sourceId: string;
  topics: string[];
  kind: ClaimKind;
  claim: string;
  /** Contexts where this claim should not be offered as personal coaching. */
  educationOnlySafe: boolean;
  version: number;
  reviewedAt: string;
};

const REVIEWED = "2026-09-25";

const c = (
  id: string,
  sourceId: string,
  topics: string[],
  kind: ClaimKind,
  claim: string,
  educationOnlySafe = true,
): EvidenceClaim => ({ id, sourceId, topics, kind, claim, educationOnlySafe, version: 1, reviewedAt: REVIEWED });

export const EVIDENCE_CLAIMS: readonly EvidenceClaim[] = [
  // Cholesterol
  c("chol.what", "nhlbi-blood-cholesterol", ["cholesterol", "ldl", "hdl", "lipids"], "explain",
    "Cholesterol is a waxy substance the body uses. LDL and HDL describe different lipoprotein patterns that clinicians look at together, not as a single good-or-bad label."),
  c("chol.factors", "nhlbi-blood-cholesterol", ["cholesterol", "family history", "movement", "eating"], "pattern",
    "Eating patterns, physical activity, and family history are among the factors people discuss with a healthcare professional when talking about cholesterol."),
  c("chol.one_meal", "medlineplus-cholesterol", ["cholesterol", "meal", "labs"], "boundary",
    "One meal or one lesson cannot tell you your lab result. Cholesterol is understood with your own results."),
  c("chol.ask", "medlineplus-cholesterol", ["cholesterol", "labs", "visit"], "ask",
    "You could ask a clinician what your cholesterol results mean for you and which habits are most relevant to them."),

  // Fats
  c("fat.pattern", "nhlbi-blood-cholesterol", ["saturated fat", "fat", "cholesterol", "meat", "butter", "cheese", "fried"], "pattern",
    "Eating patterns that are lower in saturated fat are associated with healthier blood cholesterol levels in population guidance.", false),
  c("fat.unsaturated", "nhlbi-blood-cholesterol", ["unsaturated fat", "fat", "olive oil", "nuts", "fish"], "explain",
    "Foods contain different mixes of fats. Unsaturated fats are common in foods such as olive oil, nuts, and fish."),
  c("fat.compare_label", "fda-nutrition-facts", ["saturated fat", "label", "compare", "fat"], "practical",
    "The Nutrition Facts label lists saturated fat for one serving, which is a way to compare two similar products."),

  // Labels
  c("label.serving", "fda-nutrition-facts", ["label", "serving size", "nutrition facts", "calories", "sodium", "fiber"], "explain",
    "The Nutrition Facts label starts with a serving size. The numbers under it refer to that serving, not always the whole package."),
  c("label.compare", "fda-nutrition-facts", ["label", "compare", "serving size"], "practical",
    "Comparing two products works better when their serving sizes are similar. Read the serving size before comparing nutrients."),

  // Affordable meals
  c("afford.plate", "myplate", ["affordable", "budget", "meal", "plate", "vegetables", "grains", "protein"], "pattern",
    "A practical plate can include vegetables, fruit, grains, and a protein food."),
  c("afford.staples", "myplate", ["affordable", "budget", "cheap", "beans", "oats", "lentils", "frozen", "canned", "grains"], "practical",
    "Canned beans, oats, lentils, frozen vegetables, and bulk grains are often inexpensive and widely available."),
  c("afford.price", "who-healthy-diet", ["affordable", "budget", "price", "expensive", "healthy"], "boundary",
    "A higher price does not by itself mean a food is more supportive of health."),
  c("afford.varied", "who-healthy-diet", ["affordable", "varied", "diet", "eating"], "pattern",
    "Budget-oriented staples can be part of a varied eating pattern."),

  // Sleep
  c("sleep.consistency", "nhlbi-sleep", ["sleep", "bedtime", "rest", "tired"], "pattern",
    "Sleep is part of general wellness, and a steadier bedtime is a common focus in sleep education."),
  c("sleep.track", "nhlbi-sleep", ["sleep", "track", "log", "pattern"], "practical",
    "Tracking a few nights can help you notice your own sleep pattern."),
  c("sleep.boundary", "nhlbi-sleep", ["sleep", "insomnia", "disorder", "apnea"], "boundary",
    "A sleep log is a record of your pattern. HealthQuest does not diagnose a sleep disorder from a log."),

  // Movement
  c("move.guidance", "odphp-physical-activity", ["movement", "exercise", "activity", "walk", "fitness"], "pattern",
    "Federal guidance encourages adults to move regularly, in amounts that fit their situation."),
  c("move.counts", "odphp-physical-activity", ["movement", "exercise", "walk", "chores", "workout"], "practical",
    "A walk, chores, or a short workout can all count as movement you chose."),
  c("move.boundary", "odphp-physical-activity", ["movement", "calories burned", "exercise"], "boundary",
    "HealthQuest records the activity and duration you enter. It does not calculate calories burned or decide whether a session was enough."),

  // Family history
  c("family.what", "medlineplus-family-history", ["family history", "genetics", "relatives", "parents", "inherited"], "explain",
    "Family history is health information about you and your close relatives. Families share genes, surroundings, and habits."),
  c("family.meaning", "medlineplus-family-history", ["family history", "heart disease", "stroke", "risk", "inherited"], "explain",
    "A condition in a relative can mean a higher chance of some problems, including heart disease and stroke. It does not mean you will develop that condition."),
  c("family.ask", "medlineplus-family-history", ["family history", "visit", "doctor"], "ask",
    "Family history is useful context to share with a clinician, who can say what it means for you."),

  // Blood pressure
  c("bp.what", "nhlbi-high-blood-pressure", ["blood pressure", "hypertension", "systolic", "diastolic"], "explain",
    "Blood pressure is the force of blood on artery walls, written as two numbers: systolic, when the heart pumps, and diastolic, when the heart fills."),
  c("bp.ranges", "nhlbi-high-blood-pressure", ["blood pressure", "hypertension", "numbers", "reading"], "explain",
    "NHLBI describes under 120 systolic and under 80 diastolic as a healthy range, and consistent readings of 130 or higher systolic, or 80 or higher diastolic, as high blood pressure."),
  c("bp.urgent", "nhlbi-high-blood-pressure", ["blood pressure", "reading", "high", "urgent"], "boundary",
    "A systolic reading higher than 180 or a diastolic reading higher than 120 is urgent: contact a healthcare provider."),
  c("bp.topics", "nhlbi-high-blood-pressure", ["blood pressure", "hypertension", "eating", "movement", "sleep", "stress", "smoking"], "pattern",
    "A clinician may discuss eating pattern, movement, smoking, stress, sleep, and sometimes medicine when talking about blood pressure.", false),

  // Sodium
  c("sodium.what", "medlineplus-sodium", ["sodium", "salt"], "explain",
    "Your body needs some sodium for nerves, muscles, and fluid balance. Extra sodium is associated with high blood pressure."),
  c("sodium.guideline", "medlineplus-sodium", ["sodium", "salt", "how much"], "pattern",
    "Most adults in the United States get more sodium than they need. Dietary Guidelines recommend less than 2.3 grams a day for most adults, about one teaspoon of salt.", false),
  c("sodium.label", "fda-nutrition-facts", ["sodium", "salt", "label"], "practical",
    "The Nutrition Facts label lists sodium for one serving."),
  c("sodium.ask", "medlineplus-sodium", ["sodium", "salt", "blood pressure", "kidney", "diabetes"], "ask",
    "People with high blood pressure, diabetes, or kidney disease can ask a clinician what sodium amount fits them."),

  // Fiber
  c("fiber.what", "medlineplus-fiber", ["fiber", "whole grains", "beans", "fruit", "vegetables", "digestion"], "explain",
    "Dietary fiber is a carbohydrate from plants, found in whole grains, nuts, seeds, fruit, and vegetables. It helps digestion and can make a meal feel filling."),
  c("fiber.slowly", "medlineplus-fiber", ["fiber", "gas", "bloating"], "practical",
    "Adding a lot of fiber at once can cause gas, bloating, and cramps, so it helps to increase it slowly."),

  // Stress
  c("stress.what", "nimh-stress", ["stress", "anxiety", "worried", "overwhelmed"], "explain",
    "Stress is a physical or mental response to an outside cause. Anxiety is a reaction that can continue when there is no current threat. Everyone feels stress."),
  c("stress.ideas", "nimh-stress", ["stress", "anxiety", "coping", "relax"], "practical",
    "Ideas that may help with stress include keeping a journal, moving, eating regular meals, keeping a sleep routine, and talking with people who help."),
  c("stress.professional", "nimh-stress", ["stress", "anxiety", "mental health", "therapy"], "ask",
    "If stress or anxiety gets in the way of daily life, it may be time to talk with a professional."),
  c("crisis.988", "988-lifeline", ["crisis", "988", "suicide", "distress", "hotline"], "boundary",
    "In the U.S., you can call or text 988 to reach the Suicide & Crisis Lifeline any time."),

  // Visits
  c("visit.prepare", "medlineplus-cholesterol", ["visit", "doctor", "appointment", "questions", "clinician"], "practical",
    "A useful visit often starts with your questions. Bring them written down; the clinician interprets your results."),
  c("visit.examples", "medlineplus-cholesterol", ["visit", "doctor", "appointment", "questions", "budget", "labs"], "ask",
    "You might ask what a result means for you, which habits are most relevant, and what is realistic on your grocery budget."),

  // Diabetes (general only)
  c("diabetes.general", "ada-home", ["diabetes", "prediabetes", "blood sugar", "glucose", "a1c"], "boundary",
    "Diabetes and prediabetes are managed with a healthcare team. HealthQuest can explain terms but does not set blood-sugar targets.", true),
];

export function activeClaims(): EvidenceClaim[] {
  return EVIDENCE_CLAIMS.filter((claim) => Boolean(getActiveSource(claim.sourceId)));
}

export function getClaim(id: string): EvidenceClaim | undefined {
  return activeClaims().find((claim) => claim.id === id);
}
