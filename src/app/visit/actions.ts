"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { countSafetyCategory } from "@/lib/privacy/ops";
import { evaluateSafety } from "@/lib/safety/evaluate";
import { normalizeVisitQuestion } from "@/lib/visit/questions";

export async function saveVisitQuestion(formData: FormData) {
  const user = await requireOnboardedUser();
  const parsed = normalizeVisitQuestion(String(formData.get("question") ?? ""));
  if (!parsed.ok) redirect(`/visit?error=${parsed.reason}`);
  const decision = evaluateSafety(parsed.text);
  if (decision.emergency && decision.responseKind) {
    countSafetyCategory(decision.category ?? "unknown");
    getDemoStore().recordSafetyEvent({
      userId: user.id,
      category: decision.category ?? "unknown",
      ruleVersion: decision.ruleVersion,
      action: decision.responseKind,
      createdAt: new Date().toISOString(),
    });
    redirect(`/visit?emergency=${decision.responseKind === "crisis" ? "crisis" : "medical"}`);
  }
  getDemoStore().addVisitQuestion({
    id: randomUUID(),
    userId: user.id,
    text: parsed.text,
    createdAt: new Date().toISOString(),
  });
  redirect("/visit?saved=1");
}

export async function removeVisitQuestion(formData: FormData) {
  const user = await requireOnboardedUser();
  getDemoStore().deleteVisitQuestion(user.id, String(formData.get("questionId") ?? ""));
  redirect("/visit");
}
