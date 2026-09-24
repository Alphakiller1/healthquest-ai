import { resolve } from "node:path";

/**
 * Where the demo file store and caches live. Vercel only allows writes to
 * /tmp, which is per-instance and temporary, so tester data can reset.
 */
export function dataDir(): string {
  return process.env.VERCEL ? "/tmp/healthquest" : resolve(process.cwd(), ".data");
}
