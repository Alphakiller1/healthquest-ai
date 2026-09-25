"use server";

import { randomUUID } from "node:crypto";
import { assistantDailyLimit } from "@/lib/ai/daily-limit";
import { createAssistant } from "@/lib/ai/create-assistant";
import { createEvidenceAssistant } from "@/lib/ai/evidence-provider";
import { runAssistantPipeline } from "@/lib/ai/pipeline";
import { prepareAssistantInput } from "@/lib/ai/prepare";
import type { AssistantResponse } from "@/lib/ai/types";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore, withPersist } from "@/lib/demo/store";
import { activeSourceIds } from "@/lib/evidence/registry";
import { usCalendarDate } from "@/lib/health/calendar";
import { countSafetyCategory } from "@/lib/privacy/ops";

export type AskResult =
  | { id: string; kind: "answer"; question: string; response: AssistantResponse; madeBy: "ai" | "sources" }
  | { id: string; kind: "emergency"; question: string; message: string; actions: Array<"call_911" | "call_988" | "text_988"> }
  | { id: string; kind: "unavailable"; question: string; message: string }
  | { id: string; kind: "invalid"; message: string };

const MAX_LENGTH = 500;

async function askQuestionAction(formData: FormData): Promise<AskResult> {
  const id = randomUUID();
  const user = await requireOnboardedUser();
  const question = String(formData.get("q") ?? "").replace(/\s+/g, " ").trim();
  if (question.length < 3) return { id, kind: "invalid", message: "Type a question first." };
  if (question.length > MAX_LENGTH) {
    return { id, kind: "invalid", message: `Keep it under ${MAX_LENGTH} characters so the answer stays focused.` };
  }

  const store = await getDemoStore();
  const day = usCalendarDate(new Date().toISOString());

  // A model is used only with the person's consent and within the daily cap.
  // Otherwise the answer is assembled from reviewed claims, which sends nothing to a third party.
  const configured = createAssistant();
  const modelAllowed =
    configured.mode === "openai" &&
    user.aiEnabled !== false &&
    store.countAssistantUses(user.id, day) < assistantDailyLimit();
  const provider = modelAllowed ? configured.provider : createEvidenceAssistant();

  const input = prepareAssistantInput(user, question);
  const result = await runAssistantPipeline(input, provider, activeSourceIds());

  if (result.type === "emergency") {
    countSafetyCategory(result.decision.category ?? "unknown");
    store.recordSafetyEvent({
      userId: user.id,
      category: result.decision.category ?? "unknown",
      ruleVersion: result.decision.ruleVersion,
      action: result.decision.responseKind ?? "medical",
      createdAt: new Date().toISOString(),
    });
    return { id, kind: "emergency", question, message: result.message, actions: result.actions };
  }

  if (modelAllowed && result.providerCalled) store.recordAssistantUse(user.id, day);

  if (result.type === "fallback") {
    return {
      id,
      kind: "unavailable",
      question,
      message: "HealthQuest couldn't produce an answer that passed its checks. Try asking a different way, or bring this question to a clinician.",
    };
  }

  if (user.saveAiConversations) {
    const createdAt = new Date().toISOString();
    store.addConversation({ id: randomUUID(), userId: user.id, role: "user", body: question, createdAt });
    store.addConversation({ id: randomUUID(), userId: user.id, role: "assistant", body: result.response.summary, createdAt });
  }

  return { id, kind: "answer", question, response: result.response, madeBy: modelAllowed ? "ai" : "sources" };
}

export const askQuestion = withPersist(askQuestionAction);
