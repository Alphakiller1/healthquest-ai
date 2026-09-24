import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { logHabit } from "../engage/actions";

export const dynamic = "force-dynamic";

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const habits = (await getDemoStore()).listHabits(user.id);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Sleep and daily notes</h1>
      <p className="leading-7">Every field is optional. These notes do not earn points and are not interpreted as a diagnosis.</p>
      {params.saved ? <p>Saved as a neutral record.</p> : null}
      {params.error ? (
        <p role="alert">Sleep must be 0 to 24 hours. Stress and mood, if you enter them, are 1 to 5.</p>
      ) : null}
      <form action={logHabit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="sleepHours">
          Sleep hours
          <input id="sleepHours" name="sleepHours" type="number" min={0} max={24} step="0.5" className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="waterCups">
          Water, cups
          <input id="waterCups" name="waterCups" type="number" min={0} className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="stressRating">
          Stress, 1 to 5
          <input id="stressRating" name="stressRating" type="number" min={1} max={5} className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="moodRating">
          Mood, 1 to 5
          <input id="moodRating" name="moodRating" type="number" min={1} max={5} className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">Save notes</button>
      </form>
      <ul className="flex flex-col gap-2">
        {habits.map((habit) => (
          <li key={habit.id} className="rounded-xl border border-zinc-200 px-3 py-2">
            {habit.loggedOn}
            {habit.sleepHours !== null ? ` · sleep ${habit.sleepHours} h` : ""}
            {habit.waterCups !== null ? ` · water ${habit.waterCups}` : ""}
            {habit.stressRating !== null ? ` · stress ${habit.stressRating}` : ""}
            {habit.moodRating !== null ? ` · mood ${habit.moodRating}` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
