import type { Metadata } from "next";
import { HQGlyph } from "@/components/hq/icon";
import { HQButton, HQCallout, HQEmptyState, HQSafetyBanner } from "@/components/hq/primitives";
import { PrintButton, VisitForm } from "@/components/screens/visit-form";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { activeClaims } from "@/lib/evidence/claims";
import { profileTopics } from "@/lib/profile/personalize";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { removeVisitQuestion, saveVisitQuestion } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Visit questions · HealthQuest" };

/** Reviewed "ask a clinician" prompts, rephrased as questions in the person's voice. */
const QUESTION_FOR_CLAIM: Record<string, string> = {
  "chol.ask": "What do my cholesterol results mean for me?",
  "family.ask": "Given my family history, is there anything you'd want to check?",
  "sodium.ask": "How much sodium fits me?",
  "stress.professional": "Stress is getting in the way of my days. What could help?",
  "visit.examples": "Which habits matter most for my results, on my grocery budget?",
  "bp.urgent": "What blood pressure numbers should make me call you?",
  "diabetes.general": "What should I know about my blood sugar results?",
};

export default async function VisitPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; emergency?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const questions = (await getDemoStore()).listVisitQuestions(user.id);
  const topics = new Set(profileTopics(user).map((topic) => topic.topic));
  const saved = new Set(questions.map((question) => question.text.toLowerCase()));
  const suggestions = activeClaims()
    .filter((claim) => QUESTION_FOR_CLAIM[claim.id])
    .map((claim) => ({ text: QUESTION_FOR_CLAIM[claim.id], relevant: claim.topics.some((topic) => topics.has(topic)) }))
    .sort((a, b) => Number(b.relevant) - Number(a.relevant))
    .map((item) => item.text)
    .filter((text) => !saved.has(text.toLowerCase()))
    .slice(0, 4);

  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 28, maxWidth: "40rem" }}>
        <header className="hq-page-head">
          <p className="hq-label">Visit</p>
          <h1 className="hq-onboard__question">What do you want to ask?</h1>
          <p className="hq-secondary">
            Write questions for your next appointment. HealthQuest keeps the list; your clinician answers them.
          </p>
        </header>

        {params.emergency === "medical" ? (
          <HQSafetyBanner message={MEDICAL_EMERGENCY_MESSAGE} actions={[{ label: "Call 911", href: "tel:911", primary: true }]} />
        ) : null}
        {params.emergency === "crisis" ? (
          <HQSafetyBanner
            message={CRISIS_MESSAGE}
            actions={[
              { label: "Call 988", href: "tel:988", primary: true },
              { label: "Text 988", href: "sms:988", primary: true },
              { label: "Call 911", href: "tel:911" },
            ]}
          />
        ) : null}
        {params.saved ? (
          <div role="status">
            <HQCallout tone="positive">Saved. Bring this list to your visit.</HQCallout>
          </div>
        ) : null}
        {params.error ? (
          <div role="alert">
            <HQCallout tone="caution">Write a question between 3 and 280 characters. It wasn&rsquo;t saved.</HQCallout>
          </div>
        ) : null}

        <div className="hq-print-hide">
          <VisitForm action={saveVisitQuestion} suggestions={suggestions} />
        </div>

        <section className="hq-section hq-print-area" aria-labelledby="list-title">
          <div className="hq-section__head">
            <h2 id="list-title" className="hq-section-title">
              Your list{questions.length ? ` (${questions.length})` : ""}
            </h2>
            {questions.length > 0 ? (
              <span className="hq-print-hide">
                <PrintButton />
              </span>
            ) : null}
          </div>
          {questions.length === 0 ? (
            <HQEmptyState title="Your list starts with one question." body="Tap a suggestion above or write your own." />
          ) : (
            <ol className="hq-log-list">
              {questions.map((question, index) => (
                <li key={question.id} className="hq-log-item">
                  <HQGlyph name="question" tone="info" />
                  <span>
                    <span className="hq-sr-only">Question {index + 1}: </span>
                    {question.text}
                  </span>
                  <form action={removeVisitQuestion} className="hq-print-hide">
                    <input type="hidden" name="questionId" value={question.id} />
                    <HQButton type="submit" variant="quiet" size="sm" aria-label={`Remove question ${index + 1}`}>
                      Remove
                    </HQButton>
                  </form>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
