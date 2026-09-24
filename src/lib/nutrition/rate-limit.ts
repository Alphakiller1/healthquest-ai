export type UsdaWindow = {
  startedAt: number;
  count: number;
};

const HOUR_MS = 60 * 60 * 1000;

/** USDA FoodData Central: 1,000 requests/hour/IP, or 30/hour for DEMO_KEY. Checked 2026-09-24. */
export function usdaHourlyLimit(apiKey: string): number {
  return apiKey === "DEMO_KEY" ? 30 : 1000;
}

export function consumeUsdaRequest(
  window: UsdaWindow,
  now: number,
  limit: number,
): { allowed: boolean; window: UsdaWindow } {
  const current = now - window.startedAt >= HOUR_MS ? { startedAt: now, count: 0 } : window;
  if (current.count >= limit) return { allowed: false, window: current };
  return { allowed: true, window: { startedAt: current.startedAt, count: current.count + 1 } };
}
