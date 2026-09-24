import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redisConfig } from "@/lib/demo/redis";

export type DemoSession = {
  userId: string;
  email: string;
  demo: true;
};

const COOKIE = "hq_demo";

function secret(): string {
  if (process.env.NODE_ENV === "production") {
    if (!testerModeEnabled()) throw new Error("Demo sessions are disabled in production.");
    return process.env.TESTER_SESSION_SECRET as string;
  }
  return process.env.DEMO_SESSION_SECRET ?? "dev-only-healthquest-demo-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: DemoSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): DemoSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DemoSession;
  if (!parsed.userId || !parsed.email || parsed.demo !== true) return null;
  return parsed;
}

export async function readSession(): Promise<DemoSession | null> {
  if (process.env.NODE_ENV === "production" && !testerModeEnabled()) {
    return null;
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

export async function writeSession(session: DemoSession): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export function demoModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Tester sign-in for a deployed build before email sign-in exists. Off unless
 * both secrets are set in the environment, and always off once Supabase is
 * configured. On Vercel it also needs Redis, because instance storage is
 * not shared between requests.
 */
export function testerModeEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.TESTER_ACCESS_CODE?.length ?? 0) >= 16 &&
    (process.env.TESTER_SESSION_SECRET?.length ?? 0) >= 32 &&
    (!process.env.VERCEL || redisConfig() !== null)
  );
}

/** Constant-time comparison of a submitted code against TESTER_ACCESS_CODE. */
export function testerCodeMatches(submitted: string): boolean {
  const expected = process.env.TESTER_ACCESS_CODE;
  if (!expected) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(submitted.trim()), digest(expected));
}
