import type { Metadata } from "next";
import Link from "next/link";
import { HQIcon } from "@/components/hq/icon";
import { FoodMoment } from "@/components/screens/food-moment";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { FOOD_SITUATIONS, foodTips } from "@/lib/moments/food";
import { momentSources } from "@/lib/moments/sources";
import { experienceFor } from "@/lib/experience/current";
import { searchFoods } from "../../journal/actions";
import { completeMoment } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Choose food · HealthQuest" };

export default async function NowFoodPage() {
  const user = await requireOnboardedUser();
  const situations = FOOD_SITUATIONS.map((situation) => ({
    ...situation,
    tips: foodTips(user, situation.id).map((claim) => ({ id: claim.id, text: claim.claim, sourceId: claim.sourceId })),
  }));
  return (
    <main className="hq-main">
      <div className="hq-stack" style={{ gap: 24, maxWidth: "40rem" }}>
        <header className="hq-page-head">
          <Link href="/now" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> Now
          </Link>
          <h1 className="hq-onboard__question">Choosing food</h1>
          <p className="hq-secondary">No food is good or bad here — just information to choose with.</p>
        </header>
        <FoodMoment
          situations={situations}
          sources={momentSources().sources}
          search={searchFoods}
          complete={completeMoment}
          level={(await experienceFor(user)).level}
          gentleFoodMode={user.gentleFoodMode || shouldRecommendGentleFoodMode(user.healthContextIds ?? [])}
        />
      </div>
    </main>
  );
}
