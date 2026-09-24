export type CoachingMode = "contextual_education" | "education_only";

export type HealthContextDefinition = {
  id: string;
  label: string;
  mode: CoachingMode;
  recommendGentleFoodMode?: boolean;
};

export const HEALTH_CONTEXTS: readonly HealthContextDefinition[] = [
  { id: "elevated_cholesterol", label: "Elevated cholesterol", mode: "contextual_education" },
  { id: "high_blood_pressure", label: "High blood pressure", mode: "contextual_education" },
  { id: "prediabetes", label: "Prediabetes", mode: "contextual_education" },
  { id: "cardiovascular_wellness", label: "General cardiovascular wellness", mode: "contextual_education" },
  { id: "healthy_eating", label: "General healthy eating", mode: "contextual_education" },
  { id: "fitness", label: "General fitness", mode: "contextual_education" },
  { id: "sleep", label: "Sleep improvement", mode: "contextual_education" },
  { id: "pregnancy", label: "Pregnancy or trying to conceive", mode: "education_only" },
  { id: "dialysis", label: "Dialysis", mode: "education_only" },
  { id: "kidney_disease", label: "Significant kidney disease", mode: "education_only" },
  { id: "active_cancer_treatment", label: "Active cancer treatment", mode: "education_only" },
  {
    id: "eating_disorder_history",
    label: "History of an eating disorder",
    mode: "education_only",
    recommendGentleFoodMode: true,
  },
  { id: "type_1_diabetes", label: "Type 1 diabetes", mode: "education_only" },
];

export function resolveCoachingMode(
  selectedIds: readonly string[],
): CoachingMode {
  const selected = HEALTH_CONTEXTS.filter((context) =>
    selectedIds.includes(context.id),
  );
  if (selected.some((context) => context.mode === "education_only")) {
    return "education_only";
  }
  return "contextual_education";
}

export function shouldRecommendGentleFoodMode(
  selectedIds: readonly string[],
): boolean {
  return HEALTH_CONTEXTS.some(
    (context) =>
      selectedIds.includes(context.id) && context.recommendGentleFoodMode,
  );
}
