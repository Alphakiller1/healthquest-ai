import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redisConfig, redisCountInWindow } from "@/lib/demo/redis";

/*
 * Rate limits for guessable or costly actions. Counted in Redis when it's
 * configured (shared across server instances), otherwise in memory for local
 * use. Addresses are hashed, so no raw IP is stored, and counters expire.
 */

const local = new Map<string, { count: number; resetAt: number }>();

async function clientKey(): Promise<string> {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`hq-rl:${ip}`).digest("hex").slice(0, 24);
}

/** True when this caller is still within `limit` attempts per `windowSeconds` for `action`. */
export async function withinLimit(action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `hq:rl:${action}:${await clientKey()}`;
  const config = redisConfig();
  if (config) {
    try {
      return (await redisCountInWindow(config, key, windowSeconds)) <= limit;
    } catch {
      return true; // Never lock people out because the counter is unavailable.
    }
  }
  const now = Date.now();
  const entry = local.get(key);
  if (!entry || entry.resetAt <= now) {
    local.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
