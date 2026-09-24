import { describe, expect, it, vi } from "vitest";
import { REQUIRED_DISCLAIMER, type HealthAssistantProvider } from "@/lib/ai/types";
import { runAssistantPipeline } from "@/lib/ai/pipeline";
import { activeSourceIds } from "@/lib/evidence/registry";
import { evaluateSafety } from "@/lib/safety/evaluate";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";

const emergencies = [
  ["I have crushing chest pain and my left arm is numb", "cardiac", "medical"],
  ["I think I'm having a heart attack", "cardiac", "medical"],
  ["I think im having a stroak", "stroke", "medical"],
  ["my face is drooping and my speech is slurred", "stroke", "medical"],
  ["I can't breathe", "respiratory", "medical"],
  ["I cant breath", "respiratory", "medical"],
  ["my throat is closing after I was stung", "anaphylaxis", "medical"],
  ["I think this is anaphylaxis", "anaphylaxis", "medical"],
  ["I took a whole bottle of pills", "overdose", "medical"],
  ["I overdosed", "overdose", "medical"],
  ["I'm bleeding and it won't stop", "bleeding", "medical"],
  ["he won't wake up", "consciousness", "medical"],
  ["I just passed out", "consciousness", "medical"],
  ["I want to kill myself", "self_harm", "crisis"],
  ["I'm suicidal", "self_harm", "crisis"],
] as const;

const nonEmergencies = [
  "What is chest pain?",
  "What are signs of stroke?",
  "I don't have chest pain.",
  "My grandfather had a stroke years ago.",
  "I watched a movie where someone overdosed.",
  "What is the suicide hotline?",
  "Can you explain saturated fat?",
  "I do not want to hurt myself.",
];

describe("evaluateSafety", () => {
  it.each(emergencies)("flags %s as %s", (text, category, kind) => {
    const decision = evaluateSafety(text);
    expect(decision.emergency).toBe(true);
    expect(decision.category).toBe(category);
    expect(decision.responseKind).toBe(kind);
    expect(decision.ruleVersion).toBeTruthy();
  });

  it.each(nonEmergencies)("does not flag educational or negated text: %s", (text) => {
    expect(evaluateSafety(text).emergency).toBe(false);
  });

  it("still flags a later clause after a negation", () => {
    const decision = evaluateSafety("I don't have chest pain but I can't breathe");
    expect(decision.emergency).toBe(true);
    expect(decision.category).toBe("respiratory");
  });
});

describe("assistant pipeline", () => {
  it("does not call the provider for emergency input", async () => {
    const generate = vi.fn();
    const provider: HealthAssistantProvider = { generate };
    const result = await runAssistantPipeline(
      {
        message: "I have crushing chest pain",
        wellnessContexts: [],
        goals: [],
        gentleFoodMode: false,
        coachingMode: "contextual_education",
        allowedSourceIds: [],
      },
      provider,
      activeSourceIds(),
    );
    expect(generate).not.toHaveBeenCalled();
    expect(result.type).toBe("emergency");
    if (result.type === "emergency") {
      expect(result.message).toBe(MEDICAL_EMERGENCY_MESSAGE);
      expect(result.actions).toContain("call_911");
    }
  });

  it("uses the crisis template for self-harm", async () => {
    const provider: HealthAssistantProvider = { generate: vi.fn() };
    const result = await runAssistantPipeline(
      {
        message: "I want to kill myself",
        wellnessContexts: [],
        goals: [],
        gentleFoodMode: false,
        coachingMode: "contextual_education",
        allowedSourceIds: [],
      },
      provider,
      activeSourceIds(),
    );
    expect(result.type).toBe("emergency");
    if (result.type === "emergency") {
      expect(result.message).toBe(CRISIS_MESSAGE);
      expect(result.actions).toEqual(["call_988", "text_988", "call_911"]);
    }
  });

  it("rejects unknown citation ids and falls back", async () => {
    const provider: HealthAssistantProvider = {
      generate: async () => ({
        status: "ok",
        summary: "Saturated fat is associated with higher LDL in population research.",
        practicalOptions: ["You could compare labels."],
        sourceIds: ["made-up-source"],
        disclaimer: REQUIRED_DISCLAIMER,
      }),
    };
    const result = await runAssistantPipeline(
      {
        message: "What does saturated fat mean?",
        wellnessContexts: ["elevated_cholesterol"],
        goals: ["understand_nutrition"],
        gentleFoodMode: false,
        coachingMode: "contextual_education",
        allowedSourceIds: ["nhlbi-blood-cholesterol"],
      },
      provider,
      activeSourceIds(),
    );
    expect(result.type).toBe("fallback");
  });

  it("accepts a validated educational answer", async () => {
    const provider: HealthAssistantProvider = {
      generate: async () => ({
        status: "education_only",
        summary: "Cholesterol is a waxy substance the body uses. Patterns of eating may be associated with LDL levels.",
        practicalOptions: ["You could ask a clinician what your lipid panel means."],
        sourceIds: ["nhlbi-blood-cholesterol"],
        disclaimer: REQUIRED_DISCLAIMER,
      }),
    };
    const result = await runAssistantPipeline(
      {
        message: "What is cholesterol?",
        wellnessContexts: ["type_1_diabetes"],
        goals: [],
        gentleFoodMode: false,
        coachingMode: "education_only",
        allowedSourceIds: ["nhlbi-blood-cholesterol"],
      },
      provider,
      activeSourceIds(),
    );
    expect(result.type).toBe("answer");
  });
});
