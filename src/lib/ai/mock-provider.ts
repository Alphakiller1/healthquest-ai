import { getActiveSource } from "@/lib/evidence/registry";
import {
  REQUIRED_DISCLAIMER,
  type AssistantResponse,
  type HealthAssistantProvider,
  type SafeAssistantInput,
} from "./types";

const SATURATED_FAT_CLAIM =
  "Eating patterns that are lower in saturated fat are associated with healthier blood cholesterol levels. One meal does not determine a lab result.";

const LABEL_CLAIM =
  "The Nutrition Facts label lists a serving size and nutrients such as saturated fat and sodium for that serving.";

const PLATE_CLAIM =
  "Meals built from vegetables, fruit, grains, and protein foods such as beans or lentils are a practical pattern. Canned or frozen options are often budget-oriented.";

export function createMockAssistant(): HealthAssistantProvider {
  return {
    async generate(input: SafeAssistantInput): Promise<AssistantResponse> {
      const saturated = input.food?.nutrients?.saturatedFat;
      const useFat =
        typeof saturated === "number" &&
        saturated >= 4 &&
        input.allowedSourceIds.includes("nhlbi-blood-cholesterol");
      const sourceIds = [
        useFat ? "nhlbi-blood-cholesterol" : null,
        input.allowedSourceIds.includes("fda-nutrition-facts") ? "fda-nutrition-facts" : null,
        input.allowedSourceIds.includes("myplate") ? "myplate" : null,
      ].filter((id): id is string => id !== null && Boolean(getActiveSource(id)));

      const practicalOptions = [
        "You could compare the saturated fat line on two products you already buy.",
        "Beans, oats, and frozen vegetables are often inexpensive stand-ins when you want a different meal.",
      ];
      if (input.gentleFoodMode) {
        practicalOptions.splice(0, practicalOptions.length, "You can describe how the meal fits your day without tracking calories.");
      }

      const summary = useFat
        ? `${SATURATED_FAT_CLAIM} ${LABEL_CLAIM}`
        : `${PLATE_CLAIM} ${LABEL_CLAIM}`;

      return {
        status: input.coachingMode === "education_only" ? "education_only" : "ok",
        summary,
        context: input.food?.description
          ? `This note is about ${input.food.description}.`
          : undefined,
        practicalOptions,
        sourceIds: sourceIds.length > 0 ? sourceIds : input.allowedSourceIds.slice(0, 1),
        uncertainty: input.food?.nutrientStatus === "uncertain"
          ? "Nutrient numbers were not matched, so this stays general."
          : input.food?.demoNutrition
            ? "These nutrient numbers are local sample data, not a USDA lookup."
            : undefined,
        professionalFollowup:
          "You could ask a clinician or dietitian how this pattern fits your own lab results.",
        disclaimer: REQUIRED_DISCLAIMER,
      };
    },
  };
}

export function selectAssistantMode(input: {
  nodeEnv: string | undefined;
  apiKey: string | undefined;
}): "openai" | "demo" | "unavailable" {
  if (input.apiKey) return "openai";
  if (input.nodeEnv === "production") return "unavailable";
  return "demo";
}
