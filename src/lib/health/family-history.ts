export const FAMILY_HISTORY_CATEGORIES = [
  { id: "heart_disease", label: "Heart disease in a biological relative" },
  { id: "stroke", label: "Stroke in a biological relative" },
  { id: "high_blood_pressure", label: "High blood pressure in a biological relative" },
  { id: "high_cholesterol", label: "High cholesterol in a biological relative" },
  { id: "type_2_diabetes", label: "Type 2 diabetes in a biological relative" },
] as const;

const ALLOWED = new Set<string>(FAMILY_HISTORY_CATEGORIES.map((item) => item.id));

export function normalizeFamilyHistory(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => ALLOWED.has(id)))];
}
