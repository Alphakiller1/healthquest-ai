/*
 * Minimal Upstash Redis REST client for the demo store. The Vercel Upstash
 * integration sets KV_REST_API_URL/KV_REST_API_TOKEN; a direct Upstash setup
 * uses UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN. Either works.
 */

type RedisConfig = { url: string; token: string };

export function redisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function call(config: RedisConfig, path: string, body?: string): Promise<unknown> {
  const response = await fetch(`${config.url}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (!response.ok || payload.error) {
    throw new Error(`Redis ${path.split("/")[1]} failed: ${payload.error ?? response.status}`);
  }
  return payload.result;
}

export async function redisGet(config: RedisConfig, key: string): Promise<string | null> {
  const result = await call(config, `/get/${encodeURIComponent(key)}`);
  return typeof result === "string" ? result : null;
}

export async function redisSet(config: RedisConfig, key: string, value: string): Promise<void> {
  await call(config, `/set/${encodeURIComponent(key)}`, value);
}

/**
 * Fixed-window counter: INCR the key, and on the first hit give it an expiry.
 * Returns the count within the current window.
 */
export async function redisCountInWindow(config: RedisConfig, key: string, windowSeconds: number): Promise<number> {
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSeconds), "NX"],
    ]),
    cache: "no-store",
  });
  const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  if (!response.ok || !Array.isArray(results) || results[0]?.error) throw new Error("Redis rate count failed");
  return Number(results[0]?.result ?? 0);
}

export async function redisDel(config: RedisConfig, key: string): Promise<void> {
  await call(config, `/del/${encodeURIComponent(key)}`);
}

export async function redisHGet(config: RedisConfig, key: string, field: string): Promise<string | null> {
  const result = await call(config, `/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
  return typeof result === "string" ? result : null;
}

/** HSET one field; the value travels as the request body, which Upstash appends as the last argument. */
export async function redisHSet(config: RedisConfig, key: string, field: string, value: string): Promise<void> {
  await call(config, `/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, value);
}

export async function redisHDel(config: RedisConfig, key: string, field: string): Promise<void> {
  await call(config, `/hdel/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
}
