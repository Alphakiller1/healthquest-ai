import type { Metadata } from "next";
import Link from "next/link";
import { HQLessonFeature, HQLessonRow } from "@/components/hq/learning";
import { HQPath } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { XP_VALUES } from "@/lib/gamification/xp";
import { resolveCoachingMode } from "@/lib/health/contexts";
import { rankLessons } from "@/lib/profile/personalize";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Learn · HealthQuest" };

const LESSON_XP = XP_VALUES.lesson_completed + XP_VALUES.quiz_completed;

export default async function LearnPage() {
  const user = await requireOnboardedUser();
  const done = new Set((await getDemoStore()).listLessonCompletions(user.id).map((item) => item.lessonId));
  const ranked = rankLessons(user, done);
  const picks = ranked.filter((item) => !item.done && item.reason).slice(0, 2);
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

        <section className="hq-section" aria-labelledby="all-title">
          <div className="hq-section__head">
            <h2 id="all-title" className="hq-section-title">
              {picks.length > 0 ? "Everything else" : "All lessons"}
            </h2>
          </div>
          {educationOnly ? (
            <p className="hq-micro" style={{ margin: 0 }}>
              Because of a topic you chose, you see general lessons only.
            </p>
          ) : null}
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
        </section>
      </div>
    </main>
  );
}
