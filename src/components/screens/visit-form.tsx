"use client";

import { useRef } from "react";
import { HQButton, HQField } from "@/components/hq/primitives";

type FormAction = (formData: FormData) => void | Promise<void>;

/** A question box with tap-to-use suggestions. Suggestions fill the box; the person edits and saves. */
export function VisitForm({ action, suggestions }: { action: FormAction; suggestions: string[] }) {
  const box = useRef<HTMLTextAreaElement>(null);
  return (
    <form action={action} className="hq-log-form">
      {suggestions.length > 0 ? (
        <div className="hq-stack" style={{ gap: 8 }}>
          <span className="hq-label">Questions people often bring</span>
          <div className="hq-prompts">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="hq-prompt"
                onClick={() => {
                  if (!box.current) return;
                  box.current.value = suggestion;
                  box.current.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <HQField label="Question" htmlFor="question" hint="In your own words. Up to 280 characters.">
        <textarea ref={box} id="question" name="question" required maxLength={280} rows={3} className="hq-textarea" />
      </HQField>
      <HQButton type="submit" variant="primary" block icon="plus">
        Save question
      </HQButton>
    </form>
  );
}

export function PrintButton() {
  return (
    <HQButton type="button" size="sm" icon="journal" onClick={() => window.print()}>
      Print list
    </HQButton>
  );
}
