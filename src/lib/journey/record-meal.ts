import { randomUUID } from "node:crypto";
import { ASSISTANT_LIMIT_MESSAGE, assistantDailyLimit } from "@/lib/ai/daily-limit";
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
import type { DemoStore, DemoUser, MealRecord } from "@/lib/demo/store";
import type { NutritionProvider } from "@/lib/nutrition/types";

export type MealDraft = {
  foodName: string;
  quantity: string;
  servingUnit: string;
  preparation: string;
  approximateCost: string;
  notes: string;
  fdcId: string | null;
};

export type RecordMealResult =
  | {
      status: "saved";
      meal: MealRecord;
      awarded: boolean;
      totalXp: number;
      explanation: {
        summary: string;
        practicalOptions: string[];
        sourceIds: string[];
        uncertainty?: string;
        professionalFollowup?: string;
        disclaimer: string;
        demo: boolean;
      };
    }
  | {
      status: "emergency";
      message: string;
      actions: Array<"call_911" | "call_988" | "text_988">;
    }
  | { status: "invalid"; message: string };

export async function recordMeal(input: {
  store: DemoStore;
  user: DemoUser;
  draft: MealDraft;
  nutrition: NutritionProvider | null;
  assistant: HealthAssistantProvider | null;
  assistantDemo: boolean;
}): Promise<RecordMealResult> {
  const foodName = input.draft.foodName.trim();
  if (foodName.length < 2) {
    return { status: "invalid", message: "Add the food name before saving." };
  }
  const safetyText = [foodName, input.draft.notes, input.draft.preparation].join(". ");
  const decision = evaluateSafety(safetyText);
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

  const matched = input.draft.fdcId && input.nutrition
    ? await input.nutrition.getById(input.draft.fdcId)
    : null;
  const meal: MealRecord = {
    id: randomUUID(),
    userId: input.user.id,
    foodName,
    quantity: input.draft.quantity.trim(),
    servingUnit: input.draft.servingUnit.trim(),
    preparation: input.draft.preparation.trim(),
    approximateCost: input.draft.approximateCost.trim(),
    notes: input.draft.notes.trim(),
    fdcId: matched?.fdcId ?? null,
    nutritionDemo: matched?.demo ?? false,
    createdAt: new Date().toISOString(),
    explanation: null,
  };

  let explanation: NonNullable<MealRecord["explanation"]> = {
    summary: "The meal is saved. An explanation is unavailable until the assistant is configured.",
    practicalOptions: [],
    sourceIds: [],
    disclaimer:
      "HealthQuest provides educational wellness information, not medical advice, diagnosis, or treatment. For medical decisions, talk with a qualified healthcare professional.",
    demo: false,
  };

  const contexts = input.user.healthContextIds ?? [];
  const gentle = input.user.gentleFoodMode || shouldRecommendGentleFoodMode(contexts);
  const day = usCalendarDate(new Date().toISOString());
  const explanationsOff = input.user.aiEnabled === false;
  const limitReached =
    !explanationsOff &&
    input.store.countAssistantUses(input.user.id, day) >= assistantDailyLimit();
  if (explanationsOff) {
    explanation = {
      ...explanation,
      summary: "Education explanations are off in settings. The meal is saved.",
      demo: false,
    };
  } else if (limitReached) {
    explanation = {
      ...explanation,
      summary: ASSISTANT_LIMIT_MESSAGE,
      demo: false,
    };
  } else if (input.assistant) {
    const pipeline = await runAssistantPipeline(
      prepareAssistantInput(input.user, `How does this meal relate to what I'm trying to learn? ${foodName}`, {
        description: [foodName, input.draft.preparation].filter(Boolean).join(", "),
        nutrientStatus: matched ? "matched" : "uncertain",
        demoNutrition: matched?.demo ?? false,
        nutrients: matched
          ? {
              calories: gentle ? null : matched.calories,
              saturatedFat: matched.saturatedFat,
              sodium: matched.sodium,
              fiber: matched.fiber,
              protein: matched.protein,
            }
          : undefined,
      }),
    input.assistant,
    activeSourceIds(),
  );

    if (pipeline.type === "emergency") {
      return {
        status: "emergency",
        message: pipeline.message,
        actions: pipeline.actions,
      };
    }
    const response = pipeline.type === "answer" ? pipeline.response : null;
    explanation = {
      summary:
        response?.summary ??
        (pipeline.type === "fallback"
          ? "I could not produce a checked explanation for that meal. The meal is still saved."
          : "The meal is saved."),
      practicalOptions: response?.practicalOptions ?? [],
      sourceIds: response?.sourceIds ?? [],
      uncertainty: response?.uncertainty,
      professionalFollowup: response?.professionalFollowup,
      disclaimer:
        response?.disclaimer ??
        "HealthQuest provides educational wellness information, not medical advice, diagnosis, or treatment. For medical decisions, talk with a qualified healthcare professional.",
      demo: input.assistantDemo,
    };
    if (pipeline.providerCalled) input.store.recordAssistantUse(input.user.id, day);
  }

  meal.explanation = explanation;
  if (input.user.saveAiConversations) {
    const createdAt = new Date().toISOString();
    input.store.addConversation({
      id: randomUUID(),
      userId: input.user.id,
      role: "user",
      body: foodName,
      createdAt,
    });
    input.store.addConversation({
      id: randomUUID(),
      userId: input.user.id,
      role: "assistant",
      body: explanation.summary,
      createdAt,
    });
  }
  input.store.addMeal(meal);
  const xp = input.store.award({
    userId: input.user.id,
    eventType: "meal_logged",
    sourceEntityId: meal.id,
  });
  awardSevenDayMilestone(input.store, input.user.id);
  return { status: "saved", meal, awarded: xp.awarded, totalXp: xp.total, explanation };
}
