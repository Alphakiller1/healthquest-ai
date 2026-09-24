import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSource } from "@/lib/evidence/registry";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getLesson } from "@/lib/learn/lessons";
import { submitLesson } from "../actions";

export const dynamic = "force-dynamic";

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
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/learn" className="text-teal-800 underline">All lessons</Link>
      <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
      <p className="text-sm text-zinc-600">{lesson.minutes} minute read</p>
      {user.plainLanguage ? <p className="leading-7 font-medium">{lesson.takeaway}</p> : null}
      <p className="leading-7">{lesson.body}</p>
      {user.plainLanguage ? null : <p className="leading-7 font-medium">{lesson.takeaway}</p>}
      <ul className="list-disc pl-5">
        {lesson.sourceIds.map((id) => {
          const source = getActiveSource(id);
          if (!source) return null;
          return (
            <li key={id}>
              <a className="underline" href={source.url}>{source.organization}: {source.title}</a>
            </li>
          );
        })}
      </ul>
      {query.result === "correct" ? <p>Quiz recorded. Points were awarded once for this lesson.</p> : null}
      {query.result === "retry" ? <p>The lesson is saved. You can try the question again for the quiz points.</p> : null}
      <form action={submitLesson} className="flex flex-col gap-3">
        <input type="hidden" name="lessonId" value={lesson.id} />
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium">{lesson.quiz.prompt}</legend>
          {lesson.quiz.choices.map((choice, index) => (
            <label key={choice} className="flex items-start gap-3">
              <input className="mt-1 h-5 w-5" type="radio" name="answer" value={index} required />
              {choice}
            </label>
          ))}
        </fieldset>
        <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">Save lesson</button>
      </form>
    </main>
  );
}
