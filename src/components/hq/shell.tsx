import Link from "next/link";
import type { ReactNode } from "react";
import { readSession, testerModeEnabled } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { levelForXp } from "@/lib/gamification/levels";
import { totalXp } from "@/lib/gamification/xp";
import { HQBrand, HQSidebar, HQTabBar, HQTopBar } from "./nav";
import { HQTextSizeButton } from "./preferences";
import { HQChip, HQXp } from "./primitives";

/**
 * App frame. Signed in and onboarded: bottom tabs on phones, a sidebar from
 * 1024px. Everyone else gets a quiet header so onboarding and sign-in stay
 * focused on one thing.
 */
export async function HQAppShell({ children }: { children: ReactNode }) {
  const session = await readSession();
  const user = session ? (await getDemoStore()).getUser(session.userId) : undefined;
  const withNav = Boolean(user?.onboardingComplete);
  const testBadge = testerModeEnabled() ? (
    <span title="Tester build. Data is temporary and can reset.">
      <HQChip tone="sun">Test mode</HQChip>
    </span>
  ) : null;

  if (!withNav || !user) {
    return (
      <div className="hq-shell">
        <header className="hq-topbar">
          <HQBrand href="/" />
          <div className="hq-cluster">
            {testBadge}
            <HQTextSizeButton />
            {session ? null : (
              <Link className="hq-btn hq-btn--quiet hq-btn--sm" href="/login">
                Sign in
              </Link>
            )}
          </div>
        </header>
        <div id="content">{children}</div>
      </div>
    );
  }

  const xp = totalXp((await getDemoStore()).listXp(user.id));
  const level = levelForXp(xp);

  return (
    <div className="hq-shell" data-nav="true">
      <HQSidebar
        footer={
          <>
          <span className="hq-cluster" style={{ justifyContent: "space-between" }}>
            {testBadge}
            <HQTextSizeButton />
          </span>
          <Link href="/you" className="hq-link-quiet hq-stack" style={{ gap: 2 }}>
            <HQXp value={xp} />
            <span className="hq-micro">
              {level.name}
              {level.next ? ` · ${level.next}` : ""}
            </span>
          </Link>
          </>
        }
      />
      <div className="hq-shell__content">
        <HQTopBar
          trailing={
            <>
            {testBadge}
            <HQTextSizeButton />
            <Link href="/you" className="hq-link-quiet" aria-label={`${xp} XP, ${level.name}. Open your profile.`} style={{ padding: "10px 4px" }}>
              <HQXp value={xp} />
            </Link>
            </>
          }
        />
        <div id="content">{children}</div>
        <HQTabBar />
      </div>
    </div>
  );
}
