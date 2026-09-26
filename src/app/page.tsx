import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HQGlyph, HQIcon, type HQIconName } from "@/components/hq/icon";
import { HQCallout, HQPath } from "@/components/hq/primitives";
import { REQUIRED_DISCLAIMER } from "@/lib/ai/types";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HealthQuest — understand one more thing about your health",
  description: "Plain-language health education for adults: food, movement, sleep, and everyday habits, from reviewed public-health sources.",
};

const PROMISES: { icon: HQIconName; title: string; body: string }[] = [
  {
    icon: "spark",
    title: "What it does",
    body: "Connects a meal or habit you choose to established education, affordable options, and questions you could ask a clinician.",
  },
  {
    icon: "shield",
    title: "What it doesn't do",
    body: "It doesn't diagnose, prescribe, interpret medications, or replace a physician, dietitian, pharmacist, or therapist.",
  },
  {
    icon: "leaf",
    title: "Affordability",
    body: "Ordinary foods like beans, oats, and frozen vegetables come first. You can note what a meal cost; HealthQuest doesn't look up store prices.",
  },
  {
    icon: "book",
    title: "Privacy",
    body: "Health details stay limited to what a feature needs. You can export or delete everything. HealthQuest doesn't sell health data.",
  },
  {
    icon: "compass",
    title: "About AI",
    body: "Explanations may be drafted by an AI model, but facts and citations come only from a reviewed source list — and every answer is checked first.",
  },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const session = await readSession();
  if (session && (await getDemoStore()).getUser(session.userId)?.onboardingComplete) redirect("/today");
  const { deleted } = await searchParams;

  return (
    <main className="hq-main hq-landing">
      {deleted ? (
        <div role="status">
          <HQCallout tone="positive" title="Your account and data were deleted">
            Thank you for trying HealthQuest. You&rsquo;re welcome back any time.
          </HQCallout>
        </div>
      ) : null}

      <section className="hq-landing__hero" aria-labelledby="hero-title">
        <p className="hq-label">HealthQuest</p>
        <h1 id="hero-title" className="hq-display">
          Learn one useful thing about your health today.
        </h1>
        <p className="hq-secondary">
          Food, movement, sleep, and everyday habits, explained in plain language from reviewed public-health sources. For
          adults in the United States.
        </p>
        <div className="hq-landing__actions">
          <Link href="/login" className="hq-btn hq-btn--primary">
            Start your HealthQuest
            <HQIcon name="arrow-right" />
          </Link>
          <a href="#how-it-works" className="hq-btn">
            See how it works
          </a>
        </div>
        <p className="hq-micro" style={{ margin: 0 }}>
          Free while in testing. Tap <strong>Aa</strong> above for bigger text.
        </p>
      </section>

      <section id="how-it-works" className="hq-landing__how" aria-labelledby="how-title">
        <h2 id="how-title" className="hq-title">
          How it works
        </h2>
        <HQPath
          orientation="vertical"
          size="lg"
          label="How HealthQuest works, in three steps"
          nodes={[
            {
              state: "done",
              body: (
                <>
                  <strong>Tell it what matters to you</strong>
                  <span className="hq-secondary">A few optional questions shape your quests, lessons, and answers. Skip any of them.</span>
                </>
              ),
            },
            {
              state: "current",
              body: (
                <>
                  <strong>Take one small step a day</strong>
                  <span className="hq-secondary">Log a meal, move for a few minutes, or take a calm minute. Every step counts.</span>
                </>
              ),
            },
            {
              state: "todo",
              body: (
                <>
                  <strong>Understand a little more each time</strong>
                  <span className="hq-secondary">Short lessons and plain answers, with sources — and questions to bring to your doctor.</span>
                </>
              ),
            },
          ]}
        />
      </section>

      <section className="hq-landing__promises" aria-label="What to expect">
        {PROMISES.map((promise) => (
          <article key={promise.title} className="hq-landing__promise">
            <HQGlyph name={promise.icon} tone="brand" />
            <div>
              <h2 className="hq-section-title" style={{ margin: 0 }}>
                {promise.title}
              </h2>
              <p className="hq-secondary" style={{ margin: "4px 0 0" }}>
                {promise.body}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="hq-surface hq-surface--accent hq-stack" style={{ gap: 12 }} aria-labelledby="cta-title">
        <h2 id="cta-title" className="hq-section-title" style={{ margin: 0 }}>
          Ready when you are
        </h2>
        <p className="hq-secondary" style={{ margin: 0 }}>
          Setup takes one to four minutes, and you choose how much to share.
        </p>
        <Link href="/login" className="hq-btn hq-btn--primary hq-btn--block">
          Start your HealthQuest
        </Link>
      </section>

      <p className="hq-micro" style={{ margin: 0 }}>
        {REQUIRED_DISCLAIMER} If you or someone else may be in danger, call <a href="tel:911">911</a>, or call or text{" "}
        <a href="tel:988">988</a>.
      </p>
    </main>
  );
}
