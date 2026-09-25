import { brandMark } from "../brand-mark";

const SIZES = new Set([192, 512]);

/** /pwa-icon/192 and /pwa-icon/512 for the web app manifest. */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return brandMark(size, true);
}
