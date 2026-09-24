import Link from "next/link";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { GOAL_OPTIONS } from "@/lib/journey/onboarding";
import { OnboardingFlow } from "@/components/screens/onboarding-flow";
import { submitOnboarding } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ stopped?: string; error?: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = getDemoStore().getUser(session.userId);
  if (!user) redirect("/login");
  if (user.onboardingComplete) redirect("/dashboard");
  const params = await searchParams;

  if (params.stopped === "age" || user.blockedUnder18) {
    return (
      <main className="hq-onboard">
        <h1 className="hq-onboard__question">HealthQuest is for adults</h1>
        <p className="hq-secondary">
          This version is for people age 18 and older in the United States. No additional health information was saved.
        </p>
        <Link href="/" className="hq-btn">
          Return home
        </Link>
      </main>
    );
  }

  return (
    <main>
      <OnboardingFlow
      action={submitOnboarding}
      goals={GOAL_OPTIONS.map(({ id, label }) => ({ id, label }))}
      error={Boolean(params.error)}
      />
    </main>
  );
}
