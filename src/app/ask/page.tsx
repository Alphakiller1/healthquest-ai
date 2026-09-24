import type { Metadata } from "next";
import { AskScreen } from "@/components/screens/ask-screen";
import { requireOnboardedUser } from "@/lib/demo/current-user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ask · HealthQuest" };

export default async function AskPage() {
  await requireOnboardedUser();
  return <AskScreen />;
}
