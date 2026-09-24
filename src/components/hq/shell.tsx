import Link from "next/link";
import type { ReactNode } from "react";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { levelForXp } from "@/lib/gamification/levels";
import { totalXp } from "@/lib/gamification/xp";
import { HQBrand, HQSidebar, HQTabBar, HQTopBar } from "./nav";
import { HQXp } from "./primitives";

/**
 * App frame. Signed in and onboarded: bottom tabs on phones, a sidebar from
 * 1024px. Everyone else gets a quiet header so onboarding and sign-in stay
 * focused on one thing.
 */
export async function HQAppShell({ children }: { children: ReactNode }) {
  const session = await readSession();
  const user = session ? getDemoStore().getUser(session.userId) : undefined;
  const withNav = Boolean(user?.onboardingComplete);

  if (!withNav || !user) {
    return (
      <div className="hq-shell">
        <header className="hq-topbar">
          <HQBrand href="/" />
          {session ? null : (
            <Link className="hq-btn hq-btn--quiet hq-btn--sm" href="/login">
              Sign in
            </Link>
          )}
        </header>
        <div id="content">{children}</div>
      </div>
    );
  }

  const xp = totalXp(getDemoStore().listXp(user.id));
  const level = levelForXp(xp);

  return (
    <div className="hq-shell" data-nav="true">
      <HQSidebar
        footer={
          <Link href="/you" className="hq-link-quiet hq-stack" style={{ gap: 2 }}>
            <HQXp value={xp} />
            <span className="hq-micro">
              {level.name}
              {level.next ? ` · ${level.next}` : ""}
            </span>
          </Link>
        }
      />
      <div className="hq-shell__content">
        <HQTopBar
          trailing={
            <Link href="/you" className="hq-link-quiet" aria-label={`${xp} XP, ${level.name}. Open your profile.`} style={{ padding: "10px 4px" }}>
              <HQXp value={xp} />
            </Link>
          }
        />
        <div id="content">{children}</div>
        <HQTabBar />
      </div>
    </div>
  );
}
