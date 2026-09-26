import Link from "next/link";
import { HQEmptyState } from "@/components/hq/primitives";

export default function NotFound() {
  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 20, maxWidth: "32rem" }}>
        <p className="hq-label">Not found</p>
        <h1 className="hq-onboard__question">This page isn&rsquo;t here</h1>
        <p className="hq-secondary" style={{ margin: 0 }}>
          The link may be old, or the page may have moved. Nothing you&rsquo;ve saved is affected.
        </p>
        <HQEmptyState title="Pick up where you left off." action={{ href: "/today", label: "Go to Today" }} />
        <Link href="/learn" className="hq-section__action">
          Or browse lessons
        </Link>
      </div>
    </main>
  );
}
