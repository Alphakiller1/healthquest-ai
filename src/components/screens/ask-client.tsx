"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { AskResult } from "@/app/ask/actions";
import { HQAssistantResponse } from "@/components/hq/assistant-response";
import { HQIcon } from "@/components/hq/icon";
import { HQCallout, HQChip, HQLoader, HQSafetyBanner } from "@/components/hq/primitives";

const PROMPTS = [
  "What does family history mean for my health?",
  "Why does saturated fat matter for cholesterol?",
  "What are affordable foods with fiber?",
  "What should I ask my doctor at my next visit?",
  "What do the two blood pressure numbers mean?",
  "How can I get more consistent sleep?",
];

const EMERGENCY_ACTIONS = {
  call_911: { label: "Call 911", href: "tel:911" },
  call_988: { label: "Call 988", href: "tel:988" },
  text_988: { label: "Text 988", href: "sms:988" },
} as const;

/**
 * The assistant as a reading surface. Each question becomes a structured
 * answer page in the thread; the composer stays in reach at the bottom.
 */
export function AskClient({
  ask,
  aiConfigured,
  aiEnabled,
  savingConversations,
}: {
  ask: (formData: FormData) => Promise<AskResult>;
  aiConfigured: boolean;
  aiEnabled: boolean;
  savingConversations: boolean;
}) {
  const [thread, setThread] = useState<AskResult[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread.length > 0 || pendingQuestion) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, pendingQuestion]);

  function submit(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    const data = new FormData();
    data.set("q", text);
    setPendingQuestion(text);
    setDraft("");
    startTransition(async () => {
      try {
        const result = await ask(data);
        setThread((items) => [...items, result]);
      } catch {
        setThread((items) => [
          ...items,
          { id: crypto.randomUUID(), kind: "unavailable", question: text, message: "Something went wrong reaching HealthQuest. Try again in a moment." },
        ]);
      } finally {
        setPendingQuestion(null);
      }
    });
  }

  const madeByAi = aiConfigured && aiEnabled;

  return (
    <div className="hq-ask-screen">
      <header className="hq-page-head">
        <p className="hq-label hq-cluster" style={{ gap: 6 }}>
          <HQIcon name="compass" size={16} className="hq-tint-brand" />
          Ask HealthQuest
        </p>
        <h1 className="hq-display" style={{ fontSize: "2rem" }}>
          What would you like to understand?
        </h1>
        <p className="hq-secondary">
          Plain-language answers from reviewed public-health sources. Education, not a diagnosis.
        </p>
      </header>

      {thread.length === 0 && !pendingQuestion ? (
        <>
          <HQCallout tone="neutral" icon="shield" title={madeByAi ? "How answers are made" : "Answers from reviewed sources"}>
            {madeByAi
              ? "An AI model writes each answer using only statements HealthQuest has reviewed, and every answer is checked before you see it. Only your question and the topics you chose are sent — never your name or email."
              : "Each answer is put together from statements HealthQuest has reviewed against public-health sources. Nothing you type is sent to an AI provider."}
          </HQCallout>
          <section className="hq-stack" style={{ gap: 10 }} aria-labelledby="prompts-title">
            <h2 id="prompts-title" className="hq-label" style={{ margin: 0 }}>
              Try one of these
            </h2>
            <div className="hq-prompts">
              {PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="hq-prompt" onClick={() => submit(prompt)} disabled={pending}>
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <div className="hq-stack" style={{ gap: 32 }} aria-live="polite">
        {thread.map((item) => (
          <ThreadItem key={item.id} item={item} />
        ))}
        {pendingQuestion ? (
          <div className="hq-answer__question" aria-busy="true">
            <span className="hq-label">You asked</span>
            <p>{pendingQuestion}</p>
            <div style={{ paddingTop: 12 }}>
              <HQLoader label="Finding reviewed sources" />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        className="hq-ask-screen__composer"
        aria-label="Ask a question"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <div className="hq-composer">
          <label htmlFor="ask-input" className="hq-sr-only">
            Your question
          </label>
          <textarea
            id="ask-input"
            name="q"
            rows={1}
            maxLength={500}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(draft);
              }
            }}
            placeholder="Ask about food, habits, or a term"
          />
          <button
            className="hq-btn hq-btn--primary"
            type="submit"
            disabled={pending || draft.trim().length < 3}
            aria-label="Send question"
            style={{ minHeight: 44, padding: "0 14px" }}
          >
            <HQIcon name="arrow-up" />
          </button>
        </div>
        <p className="hq-micro" style={{ margin: "8px 4px 0" }}>
          {savingConversations ? "Saving questions is on. " : "Questions aren't saved. "}
          <Link href="/settings">Change in Settings</Link>
        </p>
      </form>
    </div>
  );
}

function ThreadItem({ item }: { item: AskResult }) {
  if (item.kind === "invalid") {
    return <HQCallout tone="caution">{item.message}</HQCallout>;
  }
  if (item.kind === "emergency") {
    return (
      <HQSafetyBanner
        message={item.message}
        actions={item.actions.map((action, index) => ({ ...EMERGENCY_ACTIONS[action], primary: index === 0 || action !== "call_911" }))}
      />
    );
  }
  if (item.kind === "unavailable") {
    return (
      <div className="hq-stack" style={{ gap: 12 }}>
        <div className="hq-answer__question">
          <span className="hq-label">You asked</span>
          <p>{item.question}</p>
        </div>
        <HQCallout tone="neutral">{item.message}</HQCallout>
      </div>
    );
  }
  return (
    <div className="hq-stack" style={{ gap: 12 }}>
      <HQAssistantResponse question={item.question} response={item.response} />
      <span>
        <HQChip tone={item.madeBy === "ai" ? "info" : "brand"} icon={item.madeBy === "ai" ? "spark" : "book"}>
          {item.madeBy === "ai" ? "Written by AI from reviewed sources" : "Built from reviewed sources"}
        </HQChip>
      </span>
    </div>
  );
}
