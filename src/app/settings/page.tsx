import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { clearSavedConversations, deleteAccount, signOut, updatePreferences } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const gentleLocked = shouldRecommendGentleFoodMode(user.healthContextIds ?? []);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="leading-7">Signed in as {user.email}. This demo copy stays on this computer.</p>
      {params.saved ? <p>Preferences saved.</p> : null}
      <form action={updatePreferences} className="flex flex-col gap-3">
        <label className="flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5"
            type="checkbox"
            name="gentleFoodMode"
            defaultChecked={user.gentleFoodMode || gentleLocked}
            disabled={gentleLocked}
          />
          Skip calorie details. Meal notes leave out calorie talk.
        </label>
        {gentleLocked ? (
          <p className="leading-6">Calorie details stay off for the topic you selected.</p>
        ) : null}
        <label className="flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5"
            type="checkbox"
            name="aiEnabled"
            defaultChecked={user.aiEnabled !== false}
          />
          Education explanations for meals. Turning this off keeps logging and points.
        </label>
        <label className="flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5"
            type="checkbox"
            name="plainLanguage"
            defaultChecked={user.plainLanguage === true}
          />
          Plain language. Lessons show the takeaway before the longer explanation.
        </label>
        <label className="flex items-start gap-3">
          <input className="mt-1 h-5 w-5" type="checkbox" name="highContrast" defaultChecked={user.highContrast === true} />
          Higher contrast. Stronger text and borders.
        </label>
        <label className="flex items-start gap-3">
          <input className="mt-1 h-5 w-5" type="checkbox" name="saveAiConversations" defaultChecked={user.saveAiConversations === true} />
          Save AI conversations. Off by default. Only the meal name and the explanation are stored, and only after you turn this on.
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium">What you want to learn</legend>
          {GOAL_OPTIONS.map((goal) => (
            <label key={goal.id} className="flex items-start gap-3">
              <input
                className="mt-1 h-5 w-5"
                type="checkbox"
                name="goals"
                value={goal.id}
                defaultChecked={user.goals.includes(goal.id)}
              />
              {goal.label}
            </label>
          ))}
        </fieldset>
        {params.error === "goals" ? <p role="alert">Keep at least one learning goal.</p> : null}
        <button className="h-12 rounded-full border border-teal-800 px-5" type="submit">
          Save preferences
        </button>
      </form>
      <section className="leading-7">
        <h2 className="font-semibold">How explanations are handled</h2>
        <p className="mt-2">
          If an OpenAI key is configured, requests use the Responses API with storage turned off. Zero Data Retention is not enabled. Without a key, development uses a labeled local explanation. Saved conversations, if you turn them on, stay in your export and are deleted with your account.
        </p>
        <p className="mt-2">{(await getDemoStore()).listConversations(user.id).length} saved conversation lines.</p>
        <form action={clearSavedConversations} className="mt-3">
          <button className="h-12 rounded-full border border-zinc-300 px-5" type="submit">Delete saved conversations</button>
        </form>
      </section>
      <form action={signOut}>
        <button className="h-12 rounded-full border border-zinc-300 px-5" type="submit">Sign out</button>
      </form>
      <a className="inline-flex h-12 items-center justify-center rounded-full bg-teal-800 px-5 text-white" href="/settings/export">
        Export my data
      </a>
      <form action={deleteAccount} className="flex flex-col gap-3 rounded-2xl border border-zinc-300 p-4">
        <h2 className="font-semibold">Delete my account and data</h2>
        <p className="leading-6">This removes your demo profile, logs, lessons, and points from this computer. Type DELETE to confirm.</p>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="confirm">
          Confirmation
          <input id="confirm" name="confirm" className="h-12 rounded-xl border border-zinc-300 px-3" />
        </label>
        {params.error === "confirm" ? <p role="alert">Type DELETE to confirm.</p> : null}
        <button className="h-12 rounded-full border border-red-700 px-5 text-red-800" type="submit">
          Delete my account and data
        </button>
      </form>
    </main>
  );
}
