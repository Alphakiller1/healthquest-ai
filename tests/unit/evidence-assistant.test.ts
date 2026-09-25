import { describe, expect, it, vi } from "vitest";
import { composeFromClaims, createEvidenceAssistant, NOT_COVERED_SUMMARY } from "@/lib/ai/evidence-provider";
import { createOpenAIAssistant } from "@/lib/ai/openai";
import { runAssistantPipeline } from "@/lib/ai/pipeline";
import { prepareAssistantInput } from "@/lib/ai/prepare";
import { REQUIRED_DISCLAIMER, type AssistantResponse, type HealthAssistantProvider } from "@/lib/ai/types";
import { validateAssistantResponse } from "@/lib/ai/validate";
import { activeClaims, EVIDENCE_CLAIMS } from "@/lib/evidence/claims";
import { activeSourceIds, EVIDENCE_SOURCES } from "@/lib/evidence/registry";
import { selectEvidence } from "@/lib/evidence/select";
import type { DemoUser } from "@/lib/demo/store";

const user: DemoUser = {
  id: "user-123",
  email: "person@example.com",
  birthDate: "1980-01-01",
  goals: ["understand_nutrition"],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
  healthContextIds: ["elevated_cholesterol"],
};

const ok = (overrides: Partial<AssistantResponse> = {}): AssistantResponse => ({
  status: "ok",
  summary: "Eating patterns lower in saturated fat are associated with healthier cholesterol.",
  practicalOptions: ["You could compare the saturated fat line on two labels."],
  sourceIds: ["nhlbi-blood-cholesterol"],
  disclaimer: REQUIRED_DISCLAIMER,
  ...overrides,
});

describe("evidence claims", () => {
  it("every claim points at a registered source and has a unique id", () => {
    const sourceIds = new Set(EVIDENCE_SOURCES.map((source) => source.id));
    const ids = new Set<string>();
    for (const claim of EVIDENCE_CLAIMS) {
      expect(sourceIds.has(claim.sourceId), claim.id).toBe(true);
      expect(ids.has(claim.id), claim.id).toBe(false);
      ids.add(claim.id);
    }
  });

  it("no claim trips HealthQuest's own output checks, even in Gentle Food Mode where it would be offered", () => {
    for (const claim of activeClaims()) {
      const gentleEligible = !/calorie/i.test(claim.claim);
      const result = validateAssistantResponse(
        ok({ summary: claim.claim, sourceIds: [claim.sourceId], practicalOptions: [] }),
        activeSourceIds(),
        { gentleFoodMode: gentleEligible },
      );
      expect(result.ok, `${claim.id}: ${result.ok ? "" : result.reason}`).toBe(true);
    }
  });
});

describe("evidence selection", () => {
  const select = (message: string, extra: Partial<Parameters<typeof selectEvidence>[0]> = {}) =>
    selectEvidence({ message, contextIds: [], goals: [], coachingMode: "contextual_education", gentleFoodMode: false, ...extra });

  it("finds saturated fat for a steak cooked in butter", () => {
    const { claims } = select("How does this meal relate?", { foodDescription: "ribeye steak cooked with butter" });
    expect(claims.map((claim) => claim.id)).toContain("fat.pattern");
  });

  it("answers the prompt's core questions from the right topics", () => {
    expect(select("What does family history mean for my health?").claims[0]?.id).toMatch(/^family\./);
    expect(select("What could I choose instead that is affordable?").claims.some((claim) => claim.id.startsWith("afford."))).toBe(true);
    expect(select("What should I ask my doctor at my next appointment?").claims.some((claim) => claim.id.startsWith("visit."))).toBe(true);
    expect(select("why does saturated fat matter for cholesterol").claims.some((claim) => claim.id === "fat.pattern")).toBe(true);
  });

  it("leaves out claims that are unsafe as personal coaching in education-only mode", () => {
    const { claims } = select("how much sodium should I have", { coachingMode: "education_only" });
    expect(claims.length).toBeGreaterThan(0);
    expect(claims.every((claim) => claim.educationOnlySafe)).toBe(true);
  });

  it("never offers calorie claims in Gentle Food Mode", () => {
    const { claims } = select("how do I read calories on a nutrition label", { gentleFoodMode: true });
    expect(claims.some((claim) => /calorie/i.test(claim.claim))).toBe(false);
  });

  it("returns nothing for topics HealthQuest has not reviewed", () => {
    expect(select("what is the capital of france").claims).toHaveLength(0);
  });
});

describe("prepared model input", () => {
  it("carries claims and only their sources, never identity", () => {
    const input = prepareAssistantInput(user, "What does LDL mean?");
    const serialized = JSON.stringify(input);
    expect(input.claims?.length).toBeGreaterThan(0);
    expect(new Set(input.allowedSourceIds)).toEqual(new Set(input.claims?.map((claim) => claim.sourceId)));
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("user-123");
    expect(serialized).not.toContain("1980");
  });
});

describe("evidence answers without a model", () => {
  it("builds a cited answer that passes the full pipeline", async () => {
    const input = prepareAssistantInput(user, "Why does saturated fat matter if I'm concerned about cholesterol?");
    const result = await runAssistantPipeline(input, createEvidenceAssistant(), activeSourceIds());
    expect(result.type).toBe("answer");
    if (result.type !== "answer") return;
    expect(result.response.sourceIds.length).toBeGreaterThan(0);
    for (const id of result.response.sourceIds) expect(input.allowedSourceIds).toContain(id);
    const claimText = new Set(input.claims?.map((claim) => claim.claim));
    for (const option of result.response.practicalOptions) expect(claimText.has(option)).toBe(true);
  });

  it("says plainly when it has nothing reviewed", () => {
    const answer = composeFromClaims({ ...prepareAssistantInput(user, "what is the capital of france"), claims: [] });
    expect(answer.summary).toBe(NOT_COVERED_SUMMARY);
    expect(answer.sourceIds).toEqual([]);
  });

  it("keeps education-only answers general", async () => {
    const restricted = { ...user, healthContextIds: ["type_1_diabetes"] };
    const input = prepareAssistantInput(restricted, "what should my blood sugar be");
    const result = await runAssistantPipeline(input, createEvidenceAssistant(), activeSourceIds());
    expect(result.type).toBe("answer");
    if (result.type === "answer") {
      expect(result.response.status).toBe("education_only");
      expect(result.response.practicalOptions).toEqual([]);
    }
  });
});

describe("pipeline checks", () => {
  it("rejects a citation that is active but was not handed in for this question", async () => {
    const provider: HealthAssistantProvider = { generate: async () => ok({ sourceIds: ["nhlbi-sleep"] }) };
    const result = await runAssistantPipeline(
      { ...prepareAssistantInput(user, "what is LDL"), allowedSourceIds: ["nhlbi-blood-cholesterol"] },
      provider,
      activeSourceIds(),
    );
    expect(result.type).toBe("fallback");
  });

  it("retries once with the rejection reason, then accepts a fixed answer", async () => {
    const generate = vi
      .fn<HealthAssistantProvider["generate"]>()
      .mockResolvedValueOnce(ok({ summary: "This will lower your cholesterol." }))
      .mockResolvedValueOnce(ok());
    const result = await runAssistantPipeline(
      { ...prepareAssistantInput(user, "does oatmeal help cholesterol"), allowedSourceIds: ["nhlbi-blood-cholesterol"] },
      { generate },
      activeSourceIds(),
    );
    expect(result.type).toBe("answer");
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1]?.[1]).toMatch(/promised an outcome/);
  });

  const BAD: Array<[string, Partial<AssistantResponse>]> = [
    ["diagnosis", { summary: "This means you have high cholesterol." }],
    ["label", { summary: "You're diabetic, so watch sugar." }],
    ["dose", { practicalOptions: ["Take 81 mg aspirin daily."] }],
    ["medication change", { practicalOptions: ["You could stop taking your statin."] }],
    ["medication advice", { summary: "You should take a statin." }],
    ["promise", { summary: "Doing this will prevent heart disease." }],
    ["risk number", { summary: "Your risk of a heart attack is 12 percent, about 12%." }],
    ["risk percent", { summary: "There is a 20% chance of stroke." }],
    ["food morality", { summary: "Steak is a bad food." }],
    ["cheat meal", { practicalOptions: ["Save it for a cheat meal."] }],
    ["restriction", { practicalOptions: ["Aim for a calorie deficit to lose 10 pounds."] }],
    ["wrong disclaimer", { disclaimer: "Not medical advice." }],
  ];

  it.each(BAD)("rejects an answer with %s", (_, overrides) => {
    expect(validateAssistantResponse(ok(overrides), activeSourceIds()).ok).toBe(false);
  });

  it("rejects calorie and weight talk only when Gentle Food Mode is on", () => {
    const answer = ok({ summary: "The label lists calories for one serving." });
    expect(validateAssistantResponse(answer, activeSourceIds()).ok).toBe(true);
    expect(validateAssistantResponse(answer, activeSourceIds(), { gentleFoodMode: true }).ok).toBe(false);
  });
});

describe("OpenAI adapter request", () => {
  const reply = (body: unknown) =>
    vi.fn(async () =>
      new Response(JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(body) }] }] }), {
        status: 200,
      }),
    );

  it("asks for strict structured output and sends the claims", async () => {
    const fetchImpl = reply({ ...ok(), context: null, uncertainty: null, professionalFollowup: null });
    const assistant = createOpenAIAssistant({ apiKey: "k", model: "m", fetchImpl });
    const input = prepareAssistantInput(user, "what is LDL");
    const answer = await assistant.generate(input, "gave a dose");
    const [, init] = (fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    const body = JSON.parse(String(init.body));
    expect(body.store).toBe(false);
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(body.text.format.schema.required).toContain("context");
    expect(JSON.parse(body.input).claims.length).toBeGreaterThan(0);
    expect(body.instructions).toContain("gave a dose");
    // nulls from strict mode become absent fields
    expect("context" in answer).toBe(false);
  });

  it("treats a refusal as a failed attempt", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] }), { status: 200 }),
    );
    const assistant = createOpenAIAssistant({ apiKey: "k", model: "m", fetchImpl });
    await expect(assistant.generate(prepareAssistantInput(user, "what is LDL"))).rejects.toThrow(/refused/);
  });
});

describe("profile never answers an unrelated question", () => {
  it("returns no claims for an off-topic question even with health topics saved", () => {
    const { claims } = selectEvidence({
      message: "what is the capital of france",
      contextIds: ["elevated_cholesterol", "high_blood_pressure"],
      goals: ["understand_nutrition"],
      coachingMode: "contextual_education",
      gentleFoodMode: false,
    });
    expect(claims).toHaveLength(0);
  });
});
