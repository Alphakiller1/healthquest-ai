import Link from "next/link";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { usCalendarDate } from "@/lib/health/calendar";
import { lessonsForContexts } from "@/lib/health/contextual-lessons";
import { FAMILY_HISTORY_CATEGORIES } from "@/lib/health/family-history";
import { HEALTH_CONTEXTS } from "@/lib/health/contexts";
import { wellnessLog } from "@/lib/health/trends";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { saveFamilyHistory, saveHealthTopics } from "./actions";

export const dynamic = "force-dynamic";

export default async function HealthFactorsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const store = await getDemoStore();
  const goals = GOAL_OPTIONS.filter((goal) => user.goals.includes(goal.id));
  const contexts = HEALTH_CONTEXTS.filter((context) =>
    (user.healthContextIds ?? []).includes(context.id),
  );
  const education = lessonsForContexts(user.healthContextIds ?? []);
  const selectedHistory = new Set(user.familyHistoryCategories ?? []);
  const today = usCalendarDate(new Date().toISOString());
  const days = wellnessLog({
    today,
    meals: store.listMeals(user.id),
    activities: store.listActivities(user.id),
    habits: store.listHabits(user.id),
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Health Factors</h1>
        <p className="mt-3 leading-7">
          This page explains factors and shows what you logged. It does not estimate your risk, give you a health score, or predict how long you will live.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Factors you may be able to influence</h2>
        <ul className="mt-2 list-disc pl-5 leading-7">
          <li>How often you move</li>
          <li>Sleep timing</li>
          <li>Eating patterns, including saturated fat, sodium, and fiber on labels</li>
          <li>Whether you smoke, if that applies to you</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Factors you cannot change</h2>
        <ul className="mt-2 list-disc pl-5 leading-7">
          <li>Age</li>
          <li>Some family-history factors</li>
        </ul>
        <p className="mt-2 leading-7">
          Family history is context for a clinician. HealthQuest does not turn it into a percentage.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What you chose to learn about</h2>
        <p className="mt-2 leading-7">
          Optional. Change these anytime. An education-only topic keeps lessons general.
        </p>
        {params.saved === "topics" ? <p className="mt-2">Topics saved.</p> : null}
        <form action={saveHealthTopics} className="mt-3 flex flex-col gap-3">
          {HEALTH_CONTEXTS.map((context) => (
            <label key={context.id} className="flex items-start gap-3">
              <input
                className="mt-1 h-5 w-5"
                type="checkbox"
                name="contexts"
                value={context.id}
                defaultChecked={(user.healthContextIds ?? []).includes(context.id)}
              />
              {context.label}
            </label>
          ))}
          <button className="h-12 rounded-full border border-teal-800 px-5" type="submit">
            Save topics
          </button>
        </form>
        <p className="mt-2 leading-7">
          {contexts.length === 0
            ? "These are general lessons. They are not a personal plan."
            : education.coachingMode === "education_only"
              ? "HealthQuest stays with general education for this combination. It will not build a plan for it."
              : "Lessons below match topics you chose. They are still general education, not a personal plan."}
        </p>
        {user.gentleFoodMode ? (
          <p className="mt-2 leading-7">Calorie details are off. Meal notes skip that talk.</p>
        ) : null}
        <ul className="mt-3 flex flex-col gap-2">
          {education.lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link className="text-teal-800 underline" href={`/learn/${lesson.id}`}>
                {lesson.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Family history note</h2>
        <p className="mt-2 leading-7">
          Optional. Check categories you want to remember. Names of relatives are not stored. This is not a diagnosis.
        </p>
        {params.saved ? <p className="mt-2">Saved.</p> : null}
        <form action={saveFamilyHistory} className="mt-3 flex flex-col gap-3">
          {FAMILY_HISTORY_CATEGORIES.map((category) => (
            <label key={category.id} className="flex items-start gap-3">
              <input
                className="mt-1 h-5 w-5"
                type="checkbox"
                name="categories"
                value={category.id}
                defaultChecked={selectedHistory.has(category.id)}
              />
              {category.label}
            </label>
          ))}
          <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">
            Save family history note
          </button>
        </form>
        <p className="mt-3">
          <Link className="text-teal-800 underline" href="/learn/family-history">
            Read what family history means
          </Link>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What you logged</h2>
        <p className="mt-2 leading-7">
          These rows count the last 7 days in Eastern Time. An empty day means nothing was logged. It is not a grade.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">Meals, movement, and sleep logged over the last 7 days</caption>
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="py-2 font-medium">Day</th>
              <th className="py-2 font-medium">Meals</th>
              <th className="py-2 font-medium">Movement</th>
              <th className="py-2 font-medium">Sleep</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-zinc-100">
                <td className="py-2">{day.date}</td>
                <td className="py-2">{day.meals}</td>
                <td className="py-2">{day.movementMinutes > 0 ? `${day.movementMinutes} min` : "—"}</td>
                <td className="py-2">{day.sleepHours !== null ? `${day.sleepHours} h` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold">What you said you want to learn</h2>
        <ul className="mt-2 list-disc pl-5 leading-7">
          {goals.map((goal) => (
            <li key={goal.id}>{goal.label}</li>
          ))}
        </ul>
      </section>

      <p className="leading-7">
        Tools such as the clinician-facing ASCVD estimator exist. HealthQuest has not run one, because that needs a validated calculator and inputs this version does not collect.
      </p>
    </main>
  );
}
