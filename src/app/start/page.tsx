import Link from "next/link";

export default function StartPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Start Your HealthQuest</h1>
      <p className="leading-7 text-zinc-700 dark:text-zinc-300">
        Accounts are for adults age 18 and older in the United States. The
        next step is sign-in. Onboarding will ask only for your birth date,
        wellness goals, and consent before any health details.
      </p>
      <p className="leading-7 text-zinc-700 dark:text-zinc-300">
        Sign-in needs a Supabase project. Until those environment variables are
        set, this screen stays informational so the app does not pretend an
        account was created.
      </p>
      <Link href="/" className="text-teal-800 underline dark:text-teal-300">
        Back to the overview
      </Link>
    </main>
  );
}
