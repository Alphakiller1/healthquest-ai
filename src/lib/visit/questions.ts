export function normalizeVisitQuestion(
  value: string,
): { ok: true; text: string } | { ok: false; reason: "empty" | "long" } {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < 3) return { ok: false, reason: "empty" };
  if (text.length > 280) return { ok: false, reason: "long" };
  return { ok: true, text };
}
