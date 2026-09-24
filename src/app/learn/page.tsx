import Link from "next/link";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { LESSONS } from "@/lib/learn/lessons";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await requireOnboardedUser();
  const done = new Set((await getDemoStore()).listLessonCompletions(user.id).map((item) => item.lessonId));
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Lessons</h1>
      <p className="leading-7">Short reading tied to reviewed sources. Finishing one earns engagement XP.</p>
      <ul className="flex flex-col gap-3">
        {LESSONS.map((lesson) => (
          <li key={lesson.id}>
            <Link className="block rounded-2xl border border-zinc-200 px-4 py-3" href={`/learn/${lesson.id}`}>
              <span className="font-medium">{lesson.title}</span>
              <span className="block text-sm text-zinc-600">
                {lesson.minutes} min{done.has(lesson.id) ? " · completed" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
