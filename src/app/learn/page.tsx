import type { Metadata } from "next";
import Link from "next/link";
import { HQLessonFeature, HQLessonRow } from "@/components/hq/learning";
import { HQPath } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { XP_VALUES } from "@/lib/gamification/xp";
import { resolveCoachingMode } from "@/lib/health/contexts";
import { rankLessons } from "@/lib/profile/personalize";
import { experienceFor } from "@/lib/experience/current";
import { HQLayer } from "@/components/hq/layers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Learn · HealthQuest" };

const LESSON_XP = XP_VALUES.lesson_completed + XP_VALUES.quiz_completed;

export default async function LearnPage() {
  const user = await requireOnboardedUser();
  const done = new Set((await getDemoStore()).listLessonCompletions(user.id).map((item) => item.lessonId));
  const ranked = rankLessons(user, done);
  const { level: detail } = await experienceFor(user);
  // Simple: one pick and the rest one tap away. Otherwise two picks and the full list.
  const picks = ranked.filter((item) => !item.done && item.reason).slice(0, detail === "simple" ? 1 : 2);
  const pickIds = new Set(picks.map((item) => item.lesson.id));
  const finished = ranked.filter((item) => item.done).length;
  const educationOnly = resolveCoachingMode(user.healthContextIds ?? []) === "education_only";

  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 32 }}>
        <header className="hq-page-head">
          <p className="hq-label">Learn</p>
          <h1 className="hq-title">Understand one thing at a time</h1>
          <p className="hq-secondary">
            Short readings from reviewed public-health sources. Each ends with one question.
          </p>
          <details className="hq-about">
            <summary>What is this?</summary>
            <p>Short readings from reviewed public-health sources, each ending with one question. The ones at the top are picked from your health profile.</p>
          </details>
        </header>

        <section className="hq-stack" style={{ gap: 10 }} aria-labelledby="progress-title">
          <h2 id="progress-title" className="hq-label" style={{ margin: 0 }}>
            {finished} of {ranked.length} lessons read
          </h2>
          <HQPath
            size="sm"
            showLabels={false}
            label={`${finished} of ${ranked.length} lessons read`}
            nodes={ranked.map((item, index) => ({
              state: item.done ? "done" : index === finished ? "current" : "todo",
              description: `${item.lesson.title}, ${item.done ? "read" : "not read yet"}`,
            }))}
          />
        </section>

        {picks.length > 0 ? (
          <section className="hq-stack" style={{ gap: 12 }} aria-labelledby="picked-title">
            <div className="hq-section__head">
              <h2 id="picked-title" className="hq-section-title">
                Picked for you
              </h2>
              <Link className="hq-section__action" href="/you/profile">
                Change what shapes this
              </Link>
            </div>
            {picks.map((item) => (
              <HQLessonFeature
                key={item.lesson.id}
                href={`/learn/${item.lesson.id}`}
                lesson={{ id: item.lesson.id, title: item.lesson.title, minutes: item.lesson.minutes, rewardXp: LESSON_XP, reason: item.reason ?? undefined }}
              />
            ))}
          </section>
        ) : null}

        <section className="hq-section" aria-label="All lessons">
          {educationOnly ? (
            <p className="hq-micro" style={{ margin: 0 }}>
              Because of a topic you chose, you see general lessons only.
            </p>
          ) : null}
          <HQLayer
            depth={2}
            level={detail}
            label={`${picks.length > 0 ? "More lessons" : "All lessons"} (${ranked.length - picks.length})`}
            hint="Everything HealthQuest has reviewed"
          >
          <ul className="hq-lesson-list">
            {ranked
              .filter((item) => !pickIds.has(item.lesson.id))
              .map((item) => (
                <li key={item.lesson.id}>
                  <HQLessonRow
                    href={`/learn/${item.lesson.id}`}
                    lesson={{ id: item.lesson.id, title: item.lesson.title, minutes: item.lesson.minutes, rewardXp: LESSON_XP, completed: item.done }}
                  />
                </li>
              ))}
          </ul>
          </HQLayer>
        </section>
      </div>
    </main>
  );
}
