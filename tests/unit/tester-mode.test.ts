import { afterEach, describe, expect, it, vi } from "vitest";
import { testerCodeMatches, testerModeEnabled } from "@/lib/demo/session";

const CODE = "correct-horse-battery-staple";
const SECRET = "s".repeat(40);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("tester mode", () => {
  it("is off outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TESTER_ACCESS_CODE", CODE);
    vi.stubEnv("TESTER_SESSION_SECRET", SECRET);
    expect(testerModeEnabled()).toBe(false);
  });

  it("needs both secrets, long enough, in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("TESTER_ACCESS_CODE", CODE);
    vi.stubEnv("TESTER_SESSION_SECRET", "short");
    expect(testerModeEnabled()).toBe(false);
    vi.stubEnv("TESTER_SESSION_SECRET", SECRET);
    expect(testerModeEnabled()).toBe(true);
    vi.stubEnv("TESTER_ACCESS_CODE", "tooshort");
    expect(testerModeEnabled()).toBe(false);
  });

  it("turns off once Supabase is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TESTER_ACCESS_CODE", CODE);
    vi.stubEnv("TESTER_SESSION_SECRET", SECRET);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(testerModeEnabled()).toBe(false);
  });

  it("matches only the exact code", () => {
    vi.stubEnv("TESTER_ACCESS_CODE", CODE);
    expect(testerCodeMatches(CODE)).toBe(true);
    expect(testerCodeMatches(` ${CODE} `)).toBe(true);
    expect(testerCodeMatches("correct-horse-battery")).toBe(false);
    expect(testerCodeMatches("")).toBe(false);
  });

  it("never matches when no code is configured", () => {
    vi.stubEnv("TESTER_ACCESS_CODE", "");
    expect(testerCodeMatches("")).toBe(false);
  });
});
