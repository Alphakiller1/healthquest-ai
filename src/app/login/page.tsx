import Link from "next/link";
import { signIn } from "./actions";
import { demoModeEnabled, testerModeEnabled } from "@/lib/demo/session";
import { HQButton, HQCallout, HQField } from "@/components/hq/primitives";

const ERRORS: Record<string, string> = {
  email: "Enter a valid email address.",
  code: "That access code didn't match. Check it and try again.",
  wait: "Too many tries. Please wait 15 minutes and try again.",
  config: "Sign-in is not configured for this deployment yet.",
  send: "The sign-in email could not be sent.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const demo = demoModeEnabled();
  const tester = testerModeEnabled();
  const error = params.error ? ERRORS[params.error] : null;

  return (
    <main className="hq-onboard">
      <header className="hq-page-head">
        <p className="hq-label">{tester ? "Tester access" : "Welcome"}</p>
        <h1 className="hq-onboard__question">Start your HealthQuest</h1>
        <p className="hq-secondary">For adults 18 and older in the United States.</p>
      </header>

      {tester ? (
        <HQCallout tone="caution" title="Test mode">
          Email sign-in isn&rsquo;t live yet, so this uses a tester access code. Test data is temporary and can reset
          at any time — don&rsquo;t enter anything you need to keep. If you&rsquo;re sent back here, just sign in again.
        </HQCallout>
      ) : demo ? (
        <HQCallout tone="neutral" title="Local demo">
          This isn&rsquo;t a real account, and it stays on this computer.
        </HQCallout>
      ) : null}

      {error ? (
        <div role="alert">
          <HQCallout tone="caution">{error}</HQCallout>
        </div>
      ) : null}
      {params.sent ? <HQCallout tone="positive">Check your email for the sign-in link.</HQCallout> : null}

      <form action={signIn} className="hq-stack" style={{ gap: 20 }}>
        <HQField
          label="Email"
          htmlFor="email"
          hint={tester ? "Any address works. It keeps your test data separate from other testers." : undefined}
        >
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="hq-input"
            placeholder={tester ? "you@test.dev" : undefined}
          />
        </HQField>
        {tester ? (
          <HQField label="Access code" htmlFor="accessCode">
            <input
              id="accessCode"
              name="accessCode"
              type="password"
              required
              autoComplete="off"
              spellCheck={false}
              className="hq-input"
            />
          </HQField>
        ) : null}
        <HQButton type="submit" variant="primary" block trailingIcon="arrow-right">
          {tester ? "Sign in as tester" : demo ? "Continue in demo" : "Email me a sign-in link"}
        </HQButton>
      </form>

      <Link href="/" className="hq-section__action">
        Back to the overview
      </Link>
    </main>
  );
}
