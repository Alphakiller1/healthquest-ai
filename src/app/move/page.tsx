import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { logActivity } from "../engage/actions";

export const dynamic = "force-dynamic";

export default async function MovePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const activities = (await getDemoStore()).listActivities(user.id);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Log movement</h1>
      <p className="leading-7">Record what you did and how long it took. HealthQuest does not estimate calories burned.</p>
      {params.saved ? <p>Saved. Logging movement earns 10 XP. That is engagement, not a fitness grade.</p> : null}
      {params.error ? <p>Add an activity name, a duration above zero, and an intensity.</p> : null}
      <form action={logActivity} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="activityType">
          Activity
          <input id="activityType" name="activityType" required className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="durationMinutes">
          Minutes
          <input id="durationMinutes" name="durationMinutes" type="number" min={1} required className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">How it felt to you</legend>
          {["easy", "moderate", "hard"].map((level) => (
            <label key={level} className="flex items-center gap-3">
              <input type="radio" name="intensity" value={level} required className="h-5 w-5" />
              {level}
            </label>
          ))}
        </fieldset>
        <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">Save movement</button>
      </form>
      <ul className="flex flex-col gap-2">
        {activities.map((item) => (
          <li key={item.id} className="rounded-xl border border-zinc-200 px-3 py-2">
            {item.activityType} · {item.durationMinutes} min · {item.intensity}
          </li>
        ))}
      </ul>
    </main>
  );
}
