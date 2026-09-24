import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

let db: PGlite;

async function asUser<T>(userId: string | null, role: "authenticated" | "anon", fn: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  await db.exec(
    `select set_config('request.jwt.claim.sub', '${userId ?? ""}', false)`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid
    language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    do $$ begin
      create role authenticated nologin;
    exception when duplicate_object then null;
    end $$;
    do $$ begin
      create role anon nologin;
    exception when duplicate_object then null;
    end $$;
  `);
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260924120000_foundation.sql"),
    "utf8",
  );
  await db.exec(sql);
  await db.exec(`
    insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
    insert into public.profiles (user_id, birth_date) values
      ('${USER_A}', '1990-01-01'),
      ('${USER_B}', '1985-05-05');
    insert into public.food_logs (id, user_id, logged_on) values
      ('33333333-3333-4333-8333-333333333333', '${USER_A}', '2026-09-24'),
      ('44444444-4444-4444-8444-444444444444', '${USER_B}', '2026-09-24');
  `);
});

afterAll(async () => {
  await db.close();
});

describe("row level security", () => {
  it("lets a user read only their own food logs", async () => {
    const own = await asUser(USER_A, "authenticated", () =>
      db.query<{ user_id: string }>("select user_id from public.food_logs"),
    );
    expect(own.rows.map((row) => row.user_id)).toEqual([USER_A]);
  });

  it("stops a user from updating another user's profile", async () => {
    await asUser(USER_A, "authenticated", () =>
      db.query("update public.profiles set display_name = 'nope' where user_id = $1", [
        USER_B,
      ]),
    );
    const name = await db.query<{ display_name: string | null }>(
      "select display_name from public.profiles where user_id = $1",
      [USER_B],
    );
    expect(name.rows[0]?.display_name).toBeNull();
  });

  it("stops anonymous reads of protected rows", async () => {
    await expect(
      asUser(null, "anon", () => db.query("select * from public.food_logs")),
    ).rejects.toThrow();
  });

  it("stops authenticated users from reading safety events", async () => {
    await db.exec(`
      insert into public.safety_events (user_id, category, rule_version, action_displayed)
      values ('${USER_A}', 'cardiac', '2026.09.24.1', 'call_911')
    `);
    await expect(
      asUser(USER_A, "authenticated", () =>
        db.query("select id from public.safety_events"),
      ),
    ).rejects.toThrow(/permission denied/i);
  });
});
