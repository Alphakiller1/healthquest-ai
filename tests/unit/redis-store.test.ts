import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoStore, withPersist, type DemoUser } from "@/lib/demo/store";
import { testerModeEnabled } from "@/lib/demo/session";

const user: DemoUser = {
  id: "u1",
  email: "tester@test.dev",
  birthDate: null,
  goals: [],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: false,
  blockedUnder18: false,
};

let redis: Map<string, string>;

beforeEach(() => {
  redis = new Map();
  vi.stubEnv("KV_REST_API_URL", "https://redis.test");
  vi.stubEnv("KV_REST_API_TOKEN", "token");
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const [, command, key] = new URL(url).pathname.split("/");
    const name = decodeURIComponent(key);
    if (command === "set") redis.set(name, String(init?.body));
    const result = command === "get" ? (redis.get(name) ?? null) : "OK";
    return new Response(JSON.stringify({ result }), { status: 200 });
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Redis-backed demo store", () => {
  it("persists writes made inside a wrapped action", async () => {
    const save = withPersist(async () => {
      (await getDemoStore()).saveUser(user);
    });
    await save();
    expect(JSON.parse(redis.get("hq:demo-store") ?? "{}").users[0].email).toBe("tester@test.dev");
    expect((await getDemoStore()).getUserByEmail("tester@test.dev")?.id).toBe("u1");
  });

  it("persists before a redirect-style throw escapes the action", async () => {
    const save = withPersist(async () => {
      (await getDemoStore()).saveUser(user);
      throw new Error("NEXT_REDIRECT");
    });
    await expect(save()).rejects.toThrow("NEXT_REDIRECT");
    expect(redis.has("hq:demo-store")).toBe(true);
  });

  it("shares one snapshot across calls in the same action", async () => {
    const save = withPersist(async () => {
      (await getDemoStore()).saveUser(user);
      (await getDemoStore()).saveUser({ ...user, onboardingComplete: true });
    });
    await save();
    expect(JSON.parse(redis.get("hq:demo-store") ?? "{}").users).toHaveLength(1);
    expect(JSON.parse(redis.get("hq:demo-store") ?? "{}").users[0].onboardingComplete).toBe(true);
  });

  it("refuses writes outside a wrapped action instead of losing them", async () => {
    const store = await getDemoStore();
    expect(() => store.saveUser(user)).toThrow(/withPersist/);
  });

  it("skips the write when nothing changed", async () => {
    const read = withPersist(async () => (await getDemoStore()).getUser("u1"));
    await read();
    expect(redis.has("hq:demo-store")).toBe(false);
  });
});

describe("tester mode on Vercel", () => {
  it("needs Redis, because instance storage is not shared", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TESTER_ACCESS_CODE", "correct-horse-battery-staple");
    vi.stubEnv("TESTER_SESSION_SECRET", "s".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(testerModeEnabled()).toBe(true);
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    expect(testerModeEnabled()).toBe(false);
  });
});
