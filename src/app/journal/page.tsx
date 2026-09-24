import Link from "next/link";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getActiveSource } from "@/lib/evidence/registry";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { assistantDailyLimit } from "@/lib/ai/daily-limit";
import { usCalendarDate } from "@/lib/health/calendar";
import { CRISIS_MESSAGE, MEDICAL_EMERGENCY_MESSAGE } from "@/lib/safety/responses";
import { deleteMeal } from "./actions";
import { MealForm } from "./meal-form";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; emergency?: string; notice?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const store = getDemoStore();
  const user = store.getUser(session.userId);
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  const params = await searchParams;
  const meals = store.listMeals(user.id);
  const saved = meals.find((meal) => meal.id === params.saved);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Log a meal</h1>
        <Link href="/dashboard" className="text-teal-800 underline">
          Dashboard
        </Link>
      </div>
      <p className="leading-7">
        {user.aiEnabled === false
          ? "Education explanations are off. Meals still save."
          : `${Math.max(0, assistantDailyLimit() - store.countAssistantUses(user.id, usCalendarDate(new Date().toISOString())))} explanations left today.`}
      </p>
      {params.emergency === "medical" ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950">
          <p className="font-medium">{MEDICAL_EMERGENCY_MESSAGE}</p>
          <a className="mt-3 inline-flex h-12 items-center rounded-full bg-red-700 px-5 text-white" href="tel:911">
            Call 911
          </a>
        </section>
      ) : null}
      {params.emergency === "crisis" ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950">
          <p className="font-medium">{CRISIS_MESSAGE}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a className="inline-flex h-12 items-center justify-center rounded-full bg-red-700 px-5 text-white" href="tel:988">Call 988</a>
            <a className="inline-flex h-12 items-center justify-center rounded-full bg-red-700 px-5 text-white" href="sms:988">Text 988</a>
            <a className="inline-flex h-12 items-center justify-center rounded-full border border-red-700 px-5" href="tel:911">Call 911</a>
          </div>
        </section>
      ) : null}
      {saved?.explanation ? (
        <section className="rounded-2xl bg-teal-50 p-4 leading-7 text-teal-950">
          <h2 className="font-semibold">Saved</h2>
          {saved.explanation.demo ? (
            <p className="mt-2 text-sm">Practice explanation. This was not sent to a live model.</p>
          ) : null}
          <p className="mt-2">{saved.explanation.summary}</p>
          {saved.explanation.practicalOptions[0] ? <p className="mt-2">{saved.explanation.practicalOptions[0]}</p> : null}
          {saved.explanation.uncertainty ? <p className="mt-2">{saved.explanation.uncertainty}</p> : null}
          <ul className="mt-2 list-disc pl-5">
            {saved.explanation.sourceIds.map((id) => {
              const source = getActiveSource(id);
              if (!source) return null;
              return (
                <li key={id}>
                  <a className="underline" href={source.url}>
                    {source.organization}: {source.title}
                  </a>
                </li>
              );
            })}
          </ul>
          {saved.explanation.professionalFollowup ? (
            <p className="mt-2">{saved.explanation.professionalFollowup}</p>
          ) : null}
          <p className="mt-3 text-sm">Showing up earns 5 points. That is not a grade of the meal.</p>
          <p className="mt-2 text-sm text-teal-900/80">{saved.explanation.disclaimer}</p>
        </section>
      ) : null}
      {params.notice === "invalid" ? <p role="alert">Add a food name before saving.</p> : null}
      <MealForm gentleFoodMode={user.gentleFoodMode} />
      <section>
        <h2 className="text-lg font-semibold">Recent meals</h2>
        <p className="mt-1 text-sm leading-6">Removing a meal does not remove points already earned.</p>
        {meals.length === 0 ? <p className="mt-2">No meals yet.</p> : (
          <ul className="mt-2 flex flex-col gap-2">
            {meals.map((meal) => (
              <li key={meal.id} className="rounded-xl border border-zinc-200 px-3 py-2">
                <p>
                  {usCalendarDate(meal.createdAt)} · {meal.foodName}
                  {meal.preparation ? `, ${meal.preparation}` : ""}
                </p>
                <form action={deleteMeal} className="mt-2">
                  <input type="hidden" name="mealId" value={meal.id} />
                  <button className="text-sm underline" type="submit">Remove meal</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
