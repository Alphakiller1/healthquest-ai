import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HQIcon } from "@/components/hq/icon";
import { HQLessonFeature } from "@/components/hq/learning";
import { HQButton, HQCallout, HQChoice, HQXp } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { getActiveSource } from "@/lib/evidence/registry";
import { XP_VALUES } from "@/lib/gamification/xp";
import { getLesson } from "@/lib/learn/lessons";
import { experienceFor } from "@/lib/experience/current";
import { HQLayer } from "@/components/hq/layers";
import { rankLessons } from "@/lib/profile/personalize";
import { submitLesson } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const lesson = getLesson((await params).lessonId);
  return { title: lesson ? `${lesson.title} · HealthQuest` : "Lesson · HealthQuest" };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  const query = await searchParams;
  const done = new Set((await getDemoStore()).listLessonCompletions(user.id).map((item) => item.lessonId));
  const next = query.result === "correct" ? rankLessons(user, done).find((item) => !item.done && item.lesson.id !== lesson.id) : undefined;
  const sources = lesson.sourceIds.map((id) => getActiveSource(id)).filter((source): source is NonNullable<typeof source> => Boolean(source));

  const { level: detail } = await experienceFor(user);
  const takeawayFirst = user.plainLanguage || detail === "simple";
  const takeaway = (
    <aside className="hq-takeaway" aria-label="Key takeaway">
      <p className="hq-label" style={{ color: "var(--hq-sun-ink)", marginBottom: 6 }}>
        The takeaway
      </p>
      <p className="hq-reading" style={{ margin: 0 }}>
        {lesson.takeaway}
      </p>
    </aside>
  );

  return (
    <main className="hq-main">
      <article className="hq-reader">
        <header className="hq-stack" style={{ gap: 12 }}>
          <Link href="/learn" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> All lessons
          </Link>
          <h1 className="hq-reader__title">{lesson.title}</h1>
          <p className="hq-cluster hq-micro" style={{ gap: 12, margin: 0 }}>
            <span className="hq-cluster" style={{ gap: 4 }}>
              <HQIcon name="clock" size={14} /> {lesson.minutes} minute read
            </span>
            {done.has(lesson.id) ? (
              <span className="hq-cluster" style={{ gap: 4 }}>
                <HQIcon name="check" size={14} /> Read
              </span>
            ) : (
              <HQXp value={XP_VALUES.lesson_completed + XP_VALUES.quiz_completed} reward />
            )}
          </p>
        </header>

        {takeawayFirst ? takeaway : null}

        {/* Simple: the takeaway leads and the full reading is one tap away. */}
        {detail === "simple" ? (
          <HQLayer depth={2} level={detail} label={`Read the full lesson (${lesson.minutes} min)`} hint="The explanation behind the takeaway">
            <div className="hq-reader__body hq-reading">
              <p>{lesson.body}</p>
            </div>
          </HQLayer>
        ) : (
          <div className="hq-reader__body hq-reading">
            <p>{lesson.body}</p>
          </div>
        )}

        {takeawayFirst ? null : takeaway}

        {sources.length > 0 ? (
          <HQLayer depth={3} level={detail} label={`Sources (${sources.length})`} hint="Where this lesson comes from">
            <ol className="hq-sources">
              {sources.map((source) => (
                <li key={source.id} className="hq-source">
                  <a href={source.url} rel="noreferrer">
                    {source.organization}: {source.title}
                  </a>
                </li>
              ))}
            </ol>
          </HQLayer>
        ) : null}

        {query.result === "correct" ? (
          <div role="status">
            <HQCallout tone="positive" title="Quiz recorded">
              That&rsquo;s one more thing you understand about your health. Points were awarded once for this lesson.
            </HQCallout>
          </div>
        ) : null}
        {query.result === "retry" ? (
          <div role="status">
            <HQCallout tone="sun" title="Lesson saved">
              Not quite — have another look at the takeaway and try the question again whenever you like.
            </HQCallout>
          </div>
        ) : null}

        {next ? (
          <section className="hq-stack" style={{ gap: 8 }} aria-label="Next lesson">
            <HQLessonFeature
              href={`/learn/${next.lesson.id}`}
              lesson={{
                id: next.lesson.id,
                title: next.lesson.title,
                minutes: next.lesson.minutes,
                rewardXp: XP_VALUES.lesson_completed + XP_VALUES.quiz_completed,
                reason: next.reason ?? "Next up for you",
              }}
            />
          </section>
        ) : (
          <form action={submitLesson} className="hq-quiz">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <fieldset className="hq-stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
              <legend>{lesson.quiz.prompt}</legend>
              {lesson.quiz.choices.map((choice, index) => (
                <HQChoice key={choice} type="radio" name="answer" value={String(index)} label={choice} required />
              ))}
            </fieldset>
            <HQButton type="submit" variant="primary" block icon="check">
              Save lesson
            </HQButton>
          </form>
        )}
      </article>
    </main>
  );
}
