import Link from "next/link";
import { signIn } from "./actions";
import { demoModeEnabled } from "@/lib/demo/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const demo = demoModeEnabled();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Start Your HealthQuest</h1>
      {demo ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Local demo sign-in. This is not a real account, and it stays on this computer.
          Production will not use this path.
        </p>
      ) : (
        <p className="leading-7 text-zinc-700">
          Enter your email and we will send a sign-in link. HealthQuest is for adults 18 and older in the United States.
        </p>
      )}
      <form action={signIn} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
          />
        </label>
        <button className="h-12 rounded-full bg-teal-800 px-5 text-white" type="submit">
          {demo ? "Continue in demo" : "Email me a sign-in link"}
        </button>
      </form>
      {params.sent ? <p>Check your email for the sign-in link.</p> : null}
      {params.error === "email" ? <p>Enter a valid email address.</p> : null}
      {params.error === "config" ? <p>Sign-in is not configured for this deployment.</p> : null}
      {params.error === "send" ? <p>The sign-in email could not be sent.</p> : null}
      <Link href="/" className="text-teal-800 underline">
        Back to the overview
      </Link>
    </main>
  );
}
