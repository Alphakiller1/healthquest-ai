import { randomUUID } from "node:crypto";
import { ASSISTANT_LIMIT_MESSAGE, assistantDailyLimit } from "@/lib/ai/daily-limit";
import { createEvidenceAssistant } from "@/lib/ai/evidence-provider";
import { activeSourceIds } from "@/lib/evidence/registry";
import { usCalendarDate } from "@/lib/health/calendar";
import { runAssistantPipeline } from "@/lib/ai/pipeline";
import { prepareAssistantInput } from "@/lib/ai/prepare";
import type { HealthAssistantProvider } from "@/lib/ai/types";
import { awardSevenDayMilestone } from "@/lib/gamification/milestone";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { countSafetyCategory } from "@/lib/privacy/ops";
import { evaluateSafety } from "@/lib/safety/evaluate";
import { emergencyTemplate } from "@/lib/safety/responses";
import {
  MEAL_PORTIONS,
  MEAL_SLOTS,
  type DemoStore,
  type DemoUser,
  type MealPortion,
  type MealRecord,
  type MealSlot,
} from "@/lib/demo/store";
import type { NutritionProvider } from "@/lib/nutrition/types";
import { clip, FIELD_LIMITS } from "@/lib/validation/limits";

export type MealDraft = {
  foodName: string;
  quantity: string;
  servingUnit: string;
  preparation: string;
  approximateCost: string;
  notes: string;
  fdcId: string | null;
  mealSlot?: string;
  portion?: string;
};

export type MealExplanation = NonNullable<MealRecord["explanation"]>;

export type RecordMealResult =
  | { status: "saved"; meal: MealRecord; awarded: boolean; totalXp: number }
  | { status: "emergency"; message: string; actions: Array<"call_911" | "call_988" | "text_988"> }
  | { status: "invalid"; message: string };

const DISCLAIMER =
  "HealthQuest provides educational wellness information, not medical advice, diagnosis, or treatment. For medical decisions, talk with a qualified healthcare professional.";

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/**
 * Saves a meal at once. The explanation is separate (explainMeal) so logging
 * never waits on a model: saving takes a moment, and the meaning follows.
 */
export async function recordMeal(input: {
  store: DemoStore;
  user: DemoUser;
  draft: MealDraft;
  nutrition: NutritionProvider | null;
}): Promise<RecordMealResult> {
  const foodName = clip(input.draft.foodName, FIELD_LIMITS.foodName);
  if (foodName.length < 2) {
    return { status: "invalid", message: "Add the food name before saving." };
  }
  const notes = clip(input.draft.notes, FIELD_LIMITS.notes);
  const preparation = clip(input.draft.preparation, FIELD_LIMITS.preparation);
  const decision = evaluateSafety([foodName, notes, preparation].join(". "));
  if (decision.emergency && decision.responseKind) {
    const template = emergencyTemplate(decision.responseKind);
    countSafetyCategory(decision.category ?? "unknown");
    input.store.recordSafetyEvent({
      userId: input.user.id,
      category: decision.category ?? "unknown",
      ruleVersion: decision.ruleVersion,
      action: decision.responseKind,
      createdAt: new Date().toISOString(),
    });
    return { status: "emergency", message: template.message, actions: template.actions };
  }

  const matched = input.draft.fdcId && input.nutrition ? await input.nutrition.getById(input.draft.fdcId) : null;
  const meal: MealRecord = {
    id: randomUUID(),
    userId: input.user.id,
    foodName,
    quantity: clip(input.draft.quantity, FIELD_LIMITS.quantity),
    servingUnit: clip(input.draft.servingUnit, FIELD_LIMITS.servingUnit),
    preparation,
    approximateCost: clip(input.draft.approximateCost, FIELD_LIMITS.approximateCost),
    notes,
    fdcId: matched?.fdcId ?? null,
    nutritionDemo: matched?.demo ?? false,
    mealSlot: oneOf<MealSlot>(input.draft.mealSlot, MEAL_SLOTS),
    portion: oneOf<MealPortion>(input.draft.portion, MEAL_PORTIONS),
    nutrition: matched
      ? {
          description: matched.description,
          servingLabel: matched.servingLabel,
          sourceDataset: matched.demo ? "Sample data, not USDA" : matched.sourceDataset,
          calories: matched.calories,
          sodium: matched.sodium,
          saturatedFat: matched.saturatedFat,
          fiber: matched.fiber,
          carbohydrates: matched.carbohydrates,
          protein: matched.protein,
          sugars: matched.sugars,
        }
      : null,
    createdAt: new Date().toISOString(),
    explanation: null,
  };
  input.store.addMeal(meal);
  const xp = input.store.award({ userId: input.user.id, eventType: "meal_logged", sourceEntityId: meal.id });
  awardSevenDayMilestone(input.store, input.user.id);
  return { status: "saved", meal, awarded: xp.awarded, totalXp: xp.total };
}

/**
 * What a saved meal means for this person's goals, checked like every answer.
 * Runs once per meal: a stored explanation is returned as is. If the model is
 * unavailable or nothing it writes passes the checks, the answer is built from
 * reviewed sources instead.
 */
export async function explainMeal(input: {
  store: DemoStore;
  user: DemoUser;
  meal: MealRecord;
  assistant: HealthAssistantProvider | null;
  assistantDemo: boolean;
}): Promise<MealExplanation> {
  if (input.meal.explanation) return input.meal.explanation;
  const base: MealExplanation = { summary: "", practicalOptions: [], sourceIds: [], disclaimer: DISCLAIMER, demo: false };
  const day = usCalendarDate(new Date().toISOString());
  const store = input.store;

  let explanation: MealExplanation;
  if (input.user.aiEnabled === false) {
    explanation = { ...base, summary: "Education explanations are off in settings. The meal is saved." };
  } else if (store.countAssistantUses(input.user.id, day) >= assistantDailyLimit()) {
    explanation = { ...base, summary: ASSISTANT_LIMIT_MESSAGE };
  } else {
    const { meal, user } = input;
    const gentle = user.gentleFoodMode || shouldRecommendGentleFoodMode(user.healthContextIds ?? []);
    const facts = meal.nutrition;
    const assistantInput = prepareAssistantInput(user, `How does this meal relate to what I'm trying to learn? ${meal.foodName}`, {
      description: [meal.foodName, meal.preparation].filter(Boolean).join(", "),
      nutrientStatus: facts ? "matched" : "uncertain",
      demoNutrition: meal.nutritionDemo,
      nutrients: facts
        ? {
            calories: gentle ? null : facts.calories,
            saturatedFat: facts.saturatedFat,
            sodium: facts.sodium,
            fiber: facts.fiber,
            protein: facts.protein,
          }
        : undefined,
    });
    const evidence = createEvidenceAssistant();
    const primary = input.assistant ?? evidence;
    let pipeline = await runAssistantPipeline(assistantInput, primary, activeSourceIds());
    if (pipeline.providerCalled && input.assistant) store.recordAssistantUse(user.id, day);
    let demo = input.assistantDemo;
    if (pipeline.type === "fallback" && primary !== evidence) {
      pipeline = await runAssistantPipeline(assistantInput, evidence, activeSourceIds());
      demo = false;
    }
    const response = pipeline.type === "answer" ? pipeline.response : null;
    explanation = {
      summary: response?.summary ?? "There isn't a checked explanation for this one. The meal is still saved.",
      practicalOptions: response?.practicalOptions ?? [],
      sourceIds: response?.sourceIds ?? [],
      uncertainty: response?.uncertainty,
      professionalFollowup: response?.professionalFollowup,
      disclaimer: response?.disclaimer ?? DISCLAIMER,
      demo,
    };
  }

  store.setMealExplanation(input.user.id, input.meal.id, explanation);
  if (input.user.saveAiConversations) {
    const createdAt = new Date().toISOString();
    store.addConversation({ id: randomUUID(), userId: input.user.id, role: "user", body: input.meal.foodName, createdAt });
    store.addConversation({ id: randomUUID(), userId: input.user.id, role: "assistant", body: explanation.summary, createdAt });
  }
  return explanation;
}
