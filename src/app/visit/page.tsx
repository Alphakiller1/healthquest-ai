import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { removeVisitQuestion, saveVisitQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function VisitPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; emergency?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const questions = getDemoStore().listVisitQuestions(user.id);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Questions for a visit</h1>
      <p className="leading-7">
        Write questions you want to ask a clinician. HealthQuest stores the words. It does not answer them as medical advice.
      </p>
      {params.emergency === "medical" ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950" role="alert">
          <p className="font-medium">{MEDICAL_EMERGENCY_MESSAGE}</p>
          <a className="mt-3 inline-flex h-12 items-center rounded-full bg-red-700 px-5 text-white" href="tel:911">
            Call 911
          </a>
        </section>
      ) : null}
      {params.emergency === "crisis" ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950" role="alert">
          <p className="font-medium">{CRISIS_MESSAGE}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a className="inline-flex h-12 items-center justify-center rounded-full bg-red-700 px-5 text-white" href="tel:988">Call 988</a>
            <a className="inline-flex h-12 items-center justify-center rounded-full bg-red-700 px-5 text-white" href="sms:988">Text 988</a>
            <a className="inline-flex h-12 items-center justify-center rounded-full border border-red-700 px-5" href="tel:911">Call 911</a>
          </div>
        </section>
      ) : null}
      {params.saved ? <p role="status">Saved. Bring this list to your visit.</p> : null}
      {params.error ? (
        <p role="alert">Write a question between 3 and 280 characters. The question was not saved.</p>
      ) : null}
      <form action={saveVisitQuestion} className="flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="question">
          Question
          <textarea id="question" name="question" required maxLength={280} rows={3} className="rounded-xl border border-zinc-300 px-3 py-2" />
        </label>
        <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">Save question</button>
      </form>
      {questions.length === 0 ? <p>No questions yet.</p> : (
        <ul className="flex flex-col gap-3">
          {questions.map((question) => (
            <li key={question.id} className="rounded-xl border border-zinc-200 px-3 py-3">
              <p>{question.text}</p>
              <form action={removeVisitQuestion} className="mt-2">
                <input type="hidden" name="questionId" value={question.id} />
                <button className="text-sm underline" type="submit">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
