"use client";

import Link from "next/link";
import { HQButton, HQCallout } from "@/components/hq/primitives";

/**
 * Something failed while showing a screen. No technical detail is shown; the
 * reference lets support match the server log. Help lines stay visible,
 * because an error must never stand between someone and support.
 */
export default function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 20, maxWidth: "32rem" }}>
        <p className="hq-label">Something went wrong</p>
        <h1 className="hq-onboard__question">Sorry — this didn&rsquo;t load</h1>
        <p className="hq-secondary" style={{ margin: 0 }}>
          It&rsquo;s on our side, not yours. Trying again usually works. If you were saving something, it may not have
          saved, so check before re-entering it.
        </p>
        <div className="hq-stack" style={{ gap: 8 }}>
          <HQButton variant="primary" block icon="arrow-right" onClick={() => retry()}>
            Try again
          </HQButton>
          <Link href="/today" className="hq-btn hq-btn--quiet hq-btn--block">
            Go to Today
          </Link>
        </div>
        <HQCallout tone="neutral" icon="phone">
          If you need help right now, call or text <a href="tel:988">988</a>. In an emergency, call <a href="tel:911">911</a>.
        </HQCallout>
        {error.digest ? <p className="hq-micro" style={{ margin: 0 }}>Reference: {error.digest}</p> : null}
      </div>
    </main>
  );
}
