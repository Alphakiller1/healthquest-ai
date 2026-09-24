import Link from "next/link";
import { readSession } from "@/lib/demo/session";

export async function SiteHeader() {
  const session = await readSession();
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
        <Link href={session ? "/dashboard" : "/"} className="font-semibold text-teal-900">
          HealthQuest
        </Link>
        {session ? (
          <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/journal">Meals</Link>
            <Link href="/move">Movement</Link>
            <Link href="/learn">Lessons</Link>
            <Link href="/quests">Quests</Link>
            <Link href="/health-factors">Factors</Link>
            <Link href="/visit">Visit</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        ) : (
          <Link href="/login" className="text-sm">
            Start
          </Link>
        )}
      </div>
    </header>
  );
}
