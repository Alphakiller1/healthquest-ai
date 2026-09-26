import type { Metadata } from "next";
import Link from "next/link";
import { HQIcon } from "@/components/hq/icon";
import { MoveFlow } from "@/components/screens/moments";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { momentSources } from "@/lib/moments/sources";
import { experienceFor } from "@/lib/experience/current";
import { completeMoment } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Move a little · HealthQuest" };

export default async function NowMovePage({ searchParams }: { searchParams: Promise<{ minutes?: string }> }) {
  const user = await requireOnboardedUser();
  const { minutes } = await searchParams;
  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 24, maxWidth: "36rem" }}>
        <header className="hq-page-head">
          <Link href="/now" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> Now
          </Link>
          <h1 className="hq-onboard__question">Move a little</h1>
          <p className="hq-secondary">Any amount of movement counts. Pick what fits this moment.</p>
        </header>
        <MoveFlow complete={completeMoment} initialMinutes={minutes ? Number(minutes) : undefined} level={(await experienceFor(user)).level} {...momentSources()} />
      </div>
    </main>
  );
}
