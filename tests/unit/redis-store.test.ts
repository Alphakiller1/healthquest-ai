import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoUser } from "@/lib/demo/store";

const person = (id: string, email: string): DemoUser => ({
  id,
  email,
  birthDate: null,
  goals: [],
  consents: [],
  gentleFoodMode: false,
  onboardingComplete: false,
  blockedUnder18: false,
});

/** A fake Upstash REST endpoint: strings and hashes, GET or POST-with-body. */
let strings: Map<string, string>;
let hashes: Map<string, Map<string, string>>;
let requestBytes: number[];

beforeEach(() => {
  strings = new Map();
  hashes = new Map();
  requestBytes = [];
  vi.resetModules();
  vi.stubEnv("KV_REST_API_URL", "https://redis.test");
  vi.stubEnv("KV_REST_API_TOKEN", "token");
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const parts = new URL(url).pathname.split("/").slice(1).map(decodeURIComponent);
    const [command, key, field] = parts;
    const body = init?.body === undefined ? undefined : String(init.body);
    requestBytes.push(body?.length ?? 0);
    let result: unknown = "OK";
    if (command === "get") result = strings.get(key) ?? null;
    else if (command === "set") strings.set(key, body ?? "");
    else if (command === "del") strings.delete(key);
    else if (command === "hget") result = hashes.get(key)?.get(field) ?? null;
    else if (command === "hset") {
      if (!hashes.has(key)) hashes.set(key, new Map());
      hashes.get(key)!.set(field, body ?? parts[3]);
    } else if (command === "hdel") hashes.get(key)?.delete(field);
    return new Response(JSON.stringify({ result }), { status: 200 });
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const load = () => import("@/lib/demo/store");

describe("per-person Redis store", () => {
  it("writes one record per person plus an email entry", async () => {
    const { getDemoStore, withPersist } = await load();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u1", "one@test.dev")))();
    expect(JSON.parse(strings.get("hq:v2:user:u1") ?? "{}").users[0].email).toBe("one@test.dev");
    expect(hashes.get("hq:v2:emails")?.get("one@test.dev")).toBe("u1");
  });

  it("never lets one person's save overwrite another's", async () => {
    const { getDemoStore, withPersist } = await load();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u1", "one@test.dev")))();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u2", "two@test.dev")))();
    expect(strings.has("hq:v2:user:u1")).toBe(true);
    expect(strings.has("hq:v2:user:u2")).toBe(true);
    expect(JSON.parse(strings.get("hq:v2:user:u2")!).users).toHaveLength(1);
  });

  it("finds a person by email at sign-in", async () => {
    const { getDemoStore, preloadUserByEmail, withPersist } = await load();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u1", "one@test.dev")))();
    const found = await withPersist(async () => {
      await preloadUserByEmail("one@test.dev");
      return (await getDemoStore()).getUserByEmail("one@test.dev")?.id;
    })();
    expect(found).toBe("u1");
  });

  it("keeps a person's logs in their own record and saves them after a redirect-style throw", async () => {
    const { getDemoStore, preloadUserByEmail, withPersist } = await load();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u1", "one@test.dev")))();
    await expect(
      withPersist(async () => {
        await preloadUserByEmail("one@test.dev");
        const store = await getDemoStore();
        store.addActivity({ id: "a1", userId: "u1", activityType: "walk", durationMinutes: 10, intensity: "easy", loggedOn: "2026-09-26", createdAt: "2026-09-26T12:00:00Z" });
        throw new Error("NEXT_REDIRECT");
      })(),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(JSON.parse(strings.get("hq:v2:user:u1")!).activities).toHaveLength(1);
  });

  it("removes the record and email entry when an account is deleted", async () => {
    const { getDemoStore, preloadUserByEmail, withPersist } = await load();
    await withPersist(async () => (await getDemoStore()).saveUser(person("u1", "one@test.dev")))();
    await withPersist(async () => {
      await preloadUserByEmail("one@test.dev");
      (await getDemoStore()).deleteUser("u1");
    })();
    expect(strings.has("hq:v2:user:u1")).toBe(false);
    expect(hashes.get("hq:v2:emails")?.has("one@test.dev")).toBe(false);
  });

  it("migrates the old single record into per-person records once", async () => {
    strings.set(
      "hq:demo-store",
      JSON.stringify({
        users: [person("u1", "one@test.dev"), person("u2", "two@test.dev")],
        meals: [{ id: "m1", userId: "u2", foodName: "oats" }],
      }),
    );
    const { getDemoStore } = await load();
    await getDemoStore();
    expect(JSON.parse(strings.get("hq:v2:user:u2")!).meals).toHaveLength(1);
    expect(JSON.parse(strings.get("hq:v2:user:u1")!).meals).toHaveLength(0);
    expect(hashes.get("hq:v2:emails")?.get("two@test.dev")).toBe("u2");
    expect(strings.has("hq:v2:migrated")).toBe(true);
    expect(strings.has("hq:demo-store")).toBe(true); // kept as a backup
  });

  it("refuses writes outside a wrapped action instead of losing them", async () => {
    const { getDemoStore } = await load();
    const store = await getDemoStore();
    expect(() => store.saveUser(person("u1", "one@test.dev"))).toThrow(/withPersist/);
  });

  it("request size stays small as the number of people grows", async () => {
    const { getDemoStore, withPersist } = await load();
    for (let index = 0; index < 50; index += 1) {
      await withPersist(async () => (await getDemoStore()).saveUser(person(`u${index}`, `p${index}@test.dev`)))();
    }
    expect(Math.max(...requestBytes)).toBeLessThan(2_000);
  });
});

describe("tester mode on Vercel", () => {
  it("needs Redis, because instance storage is not shared", async () => {
    const { testerModeEnabled } = await import("@/lib/demo/session");
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
