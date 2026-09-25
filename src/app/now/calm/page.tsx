import type { Metadata } from "next";
import Link from "next/link";
import { HQIcon } from "@/components/hq/icon";
import { CalmFlow } from "@/components/screens/moments";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { CALM_TOOLS, type CalmTool } from "@/lib/moments/calm";
import { momentSources } from "@/lib/moments/sources";
import { completeMoment } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Feel calmer · HealthQuest" };

export default async function NowCalmPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  await requireOnboardedUser();
  const { tool } = await searchParams;
  const initialTool = tool && tool in CALM_TOOLS ? (tool as CalmTool) : undefined;
  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 24, maxWidth: "36rem" }}>
        <header className="hq-page-head">
          <Link href="/now" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> Now
          </Link>
          <h1 className="hq-onboard__question">Take a moment</h1>
          <p className="hq-secondary">Small things that may help, from NIMH&rsquo;s ideas for coping with stress.</p>
        </header>
        <CalmFlow complete={completeMoment} initialTool={initialTool} {...momentSources()} />
        <p className="hq-micro" style={{ margin: 0 }}>
          If you&rsquo;re in immediate distress or thinking about hurting yourself, call or text <a href="tel:988">988</a>, or
          chat at <a href="https://988lifeline.org">988lifeline.org</a>.
        </p>
      </div>
    </main>
  );
}
