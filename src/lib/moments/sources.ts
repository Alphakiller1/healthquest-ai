import { activeClaims } from "@/lib/evidence/claims";
import { EVIDENCE_SOURCES } from "@/lib/evidence/registry";

/** Serializable lookups so client-side moment tools can show what each suggestion rests on. */
export function momentSources() {
  const claimSources = Object.fromEntries(activeClaims().map((claim) => [claim.id, claim.sourceId]));
  const sources = Object.fromEntries(
    EVIDENCE_SOURCES.filter((source) => source.status === "active").map((source) => [
      source.id,
      { id: source.id, organization: source.organization, url: source.url },
    ]),
  );
  return { claimSources, sources };
}
