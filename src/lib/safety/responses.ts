import type { EmergencyResponseKind } from "./types";

export const MEDICAL_EMERGENCY_MESSAGE =
  "This could describe a medical emergency. Call 911 now or go to the nearest emergency department. Do not rely on HealthQuest for emergency medical care.";

export const CRISIS_MESSAGE =
  "If you may hurt yourself or are in immediate danger, call 911. In the U.S., you can also call or text 988 to reach the Suicide & Crisis Lifeline for immediate crisis support.";

export type EmergencyTemplate = {
  kind: EmergencyResponseKind;
  message: string;
  actions: Array<"call_911" | "call_988" | "text_988">;
};

export function emergencyTemplate(
  kind: EmergencyResponseKind,
): EmergencyTemplate {
  if (kind === "crisis") {
    return {
      kind,
      message: CRISIS_MESSAGE,
      actions: ["call_988", "text_988", "call_911"],
    };
  }
  return {
    kind,
    message: MEDICAL_EMERGENCY_MESSAGE,
    actions: ["call_911"],
  };
}
