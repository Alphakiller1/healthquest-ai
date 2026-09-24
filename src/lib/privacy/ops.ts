import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ALLOWED = new Set([
  "cardiac",
  "stroke",
  "respiratory",
  "anaphylaxis",
  "bleeding",
  "consciousness",
  "overdose",
  "self_harm",
  "unknown",
]);

/** Category counts only. The person's words are never written. */
export function countSafetyCategory(category: string): void {
  if (!ALLOWED.has(category)) return;
  const dir = resolve(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  appendFileSync(resolve(dir, "ops.log"), `${category}\n`);
}
