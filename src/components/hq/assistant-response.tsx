import type { AssistantResponse } from "@/lib/ai/types";
import { getActiveSource } from "@/lib/evidence/registry";
import { HQIcon } from "./icon";

/**
 * The assistant answers as a short structured page, not a chat bubble:
 * the plain answer first, then context, options, caveats, and sources.
 * Shape follows AssistantResponse so a live answer drops straight in.
 */
export function HQAssistantResponse({
  question,
  response,
  sample,
  questionLabel,
}: {
  question: string;
  /** Overrides the "You asked" label, e.g. for a meal explanation. */
  questionLabel?: string;
  response: AssistantResponse;
  /** Marks a design-time example so it is never mistaken for a live answer. */
  sample?: boolean;
}) {
  const sources = response.sourceIds
    .map((id) => getActiveSource(id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));

  return (
    <article className="hq-answer" aria-label="HealthQuest answer">
      <header className="hq-answer__question">
        <span className="hq-label">{questionLabel ?? (sample ? "Example question" : "You asked")}</span>
        <p>{question}</p>
      </header>

      <section className="hq-answer__part" data-part="means">
        <HQIcon name="spark" />
        <h3>What this means</h3>
        <p className="hq-answer__lead">{response.summary}</p>
      </section>

      {response.context ? (
        <section className="hq-answer__part">
          <HQIcon name="compass" />
          <h3>Why it matters for you</h3>
          <p className="hq-answer__text">{response.context}</p>
        </section>
      ) : null}

      {response.practicalOptions.length > 0 ? (
        <section className="hq-answer__part" data-part="try">
          <HQIcon name="path" />
          <h3>Try this</h3>
          <ul className="hq-answer__steps">
            {response.practicalOptions.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {response.uncertainty ? (
        <section className="hq-answer__part">
          <HQIcon name="info" />
          <h3>Good to know</h3>
          <p className="hq-answer__text">{response.uncertainty}</p>
        </section>
      ) : null}

      {response.professionalFollowup ? (
        <section className="hq-answer__part">
          <HQIcon name="question" />
          <h3>Worth asking a clinician</h3>
          <p className="hq-answer__text">{response.professionalFollowup}</p>
        </section>
      ) : null}

      {sources.length > 0 ? (
        <section className="hq-answer__part">
          <HQIcon name="book" />
          <h3>Sources</h3>
          <ol className="hq-sources">
            {sources.map((source) => (
              <li className="hq-source" key={source.id}>
                <span>
                  <a href={source.url} rel="noreferrer">
                    {source.title}
                  </a>
                  <span className="hq-source__org">{source.organization}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="hq-micro">{response.disclaimer}</p>
    </article>
  );
}
