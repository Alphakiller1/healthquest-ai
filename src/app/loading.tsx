import { HQLoader, HQSkeleton } from "@/components/hq/primitives";

/** Shown instantly on navigation, so slow connections still get feedback. */
export default function Loading() {
  return (
    <main className="hq-main" aria-busy="true">
      <div className="hq-stack" style={{ gap: 18, maxWidth: "40rem" }}>
        <HQLoader label="Loading" />
        <HQSkeleton width="35%" height={14} />
        <HQSkeleton width="75%" height={32} radius={8} />
        <HQSkeleton height={180} radius={16} />
        <div className="hq-cluster" style={{ gap: 10 }}>
          <HQSkeleton width={104} height={92} radius={10} />
          <HQSkeleton width={104} height={92} radius={10} />
          <HQSkeleton width={104} height={92} radius={10} />
        </div>
      </div>
    </main>
  );
}
