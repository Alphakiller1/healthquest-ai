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
