import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { dataDir } from "@/lib/demo/data-dir";
import { SAFETY_CATEGORIES } from "@/lib/safety/types";

const ALLOWED = new Set<string>([...SAFETY_CATEGORIES, "unknown"]);

/**
 * Category counts only. The person's words are never written.
 * Best effort: a failed write (for example a read-only filesystem) must never
 * stand between someone and the emergency screen.
 */
export function countSafetyCategory(category: string): void {
  if (!ALLOWED.has(category)) return;
  try {
    const dir = dataDir();
    mkdirSync(dir, { recursive: true });
    appendFileSync(resolve(dir, "ops.log"), `${category}\n`);
  } catch {
    // Counting is observability, not safety.
  }
}
