import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryStore, type DemoUser } from "@/lib/demo/store";
import { autoLevel, detailLevelFor, nextLevelNote, startsOpen, usageSignals } from "@/lib/experience/depth";

const user: DemoUser = {
  id: "u1",
  email: "a@example.com",
  birthDate: "1985-01-01",
  goals: [],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: true,
  blockedUnder18: false,
};

describe("detail level", () => {
  it("starts everyone new at simple", () => {
    expect(detailLevelFor(user, usageSignals(createMemoryStore(), user))).toBe("simple");
  });

  it("opens explanations once someone is using the app", () => {
    expect(autoLevel({ activeDays: 3, lessons: 0, questions: 0, actions: 0 })).toBe("standard");
    expect(autoLevel({ activeDays: 1, lessons: 1, questions: 0, actions: 0 })).toBe("standard");
  });

  it("opens everything for sustained, curious use", () => {
    expect(autoLevel({ activeDays: 10, lessons: 0, questions: 0, actions: 0 })).toBe("detailed");
    expect(autoLevel({ activeDays: 5, lessons: 0, questions: 5, actions: 0 })).toBe("detailed");
  });

  it("only ever grows with more use", () => {
    const order = ["simple", "standard", "detailed"];
    let previous = 0;
    for (let days = 0; days <= 12; days += 1) {
      const rank = order.indexOf(autoLevel({ activeDays: days, lessons: 0, questions: 0, actions: days * 2 }));
      expect(rank).toBeGreaterThanOrEqual(previous);
      previous = rank;
    }
  });

  it("respects the person's own choice over usage", () => {
    const heavy = { activeDays: 30, lessons: 12, questions: 20, actions: 200 };
    expect(detailLevelFor({ ...user, detailLevel: "simple" }, heavy)).toBe("simple");
    expect(detailLevelFor({ ...user, detailLevel: "detailed" }, { activeDays: 0, lessons: 0, questions: 0, actions: 0 })).toBe("detailed");
    expect(detailLevelFor({ ...user, detailLevel: "auto" }, heavy)).toBe("detailed");
  });

  it("always shows the glance layer, and opens deeper layers by level", () => {
    for (const level of ["simple", "standard", "detailed"] as const) expect(startsOpen(level, 1)).toBe(true);
    expect([startsOpen("simple", 2), startsOpen("standard", 2), startsOpen("detailed", 2)]).toEqual([false, true, true]);
    expect([startsOpen("simple", 3), startsOpen("standard", 3), startsOpen("detailed", 3)]).toEqual([false, false, true]);
  });

  it("explains how detail grows only when it is automatic", () => {
    expect(nextLevelNote("simple", true)).toMatch(/opens up as you use it/);
    expect(nextLevelNote("simple", false)).toBeNull();
    expect(nextLevelNote("detailed", true)).toBeNull();
  });
});

/** Every page, found on disk, so a new screen can't skip the contract. */
function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === "page.tsx" ? [path] : [];
  });
}

/** Screens whose <h1> lives in a shared screen component. */
const DELEGATED: Record<string, string> = {
  TodayScreen: "src/components/screens/today-screen.tsx",
  QuestsScreen: "src/components/screens/quests-screen.tsx",
  AskClient: "src/components/screens/ask-client.tsx",
  OnboardingFlow: "src/components/screens/onboarding-flow.tsx",
};

describe("screen contract", () => {
  it("every screen has exactly one top-level heading", () => {
    for (const file of pages("src/app")) {
      const source = readFileSync(file, "utf8");
      if (/\bredirect\(/.test(source) && !/<main|<h1|Screen|Client|Flow/.test(source)) continue; // redirect-only routes
      const delegate = Object.keys(DELEGATED).find((name) => source.includes(`<${name}`));
      const text = delegate ? readFileSync(DELEGATED[delegate], "utf8") : source;
      const count = (text.match(/<h1\b/g) ?? []).length;
      expect(count, `${file}${delegate ? ` via ${delegate}` : ""}`).toBeGreaterThanOrEqual(1);
    }
  });
});
