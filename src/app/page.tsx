import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-teal-700 dark:text-teal-300">
        HealthQuest AI
      </p>
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Learn one useful thing about your health today.
        </h1>
        <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          HealthQuest explains food, movement, sleep, and everyday habits in
          plain language, using curated public-health sources. It is an
          educational wellness tool for adults in the United States.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/start"
          className="inline-flex h-12 items-center justify-center rounded-full bg-teal-800 px-5 text-white"
        >
          Start Your HealthQuest
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5"
        >
          See How It Works
        </a>
      </div>
      <section id="how-it-works" className="grid gap-6 sm:grid-cols-2">
        <article>
          <h2 className="text-lg font-semibold">What it does</h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            It connects a meal or habit you choose to explain with established
            education, affordable options, and questions you could ask a
            clinician.
          </p>
        </article>
        <article>
          <h2 className="text-lg font-semibold">What it does not do</h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            It does not diagnose, prescribe, interpret medications, or replace
            a physician, dietitian, pharmacist, or therapist.
          </p>
        </article>
        <article>
          <h2 className="text-lg font-semibold">Privacy</h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            Health details stay limited to what a feature needs. AI runs only
            after you consent, and only relevant context is sent. HealthQuest
            does not sell health data.
          </p>
        </article>
        <article>
          <h2 className="text-lg font-semibold">AI disclosure</h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            Explanations can be drafted by a third-party AI model. Facts and
            citations come from a reviewed source list, not from the model’s
            memory.
          </p>
        </article>
      </section>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        HealthQuest provides educational wellness information, not medical
        advice, diagnosis, or treatment. For medical decisions, talk with a
        qualified healthcare professional.
      </p>
    </main>
  );
}
