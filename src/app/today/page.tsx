import type { Metadata } from "next";
import { TodayScreen, type TodayNotice } from "@/components/screens/today-screen";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { buildToday } from "@/lib/today/today";
import { checkInToday, setQuestAside } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today · HealthQuest" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const user = await requireOnboardedUser();
  const { notice } = await searchParams;
  const model = buildToday(getDemoStore(), user);
  return (
    <TodayScreen
      model={model}
      checkInAction={checkInToday}
      skipQuestAction={setQuestAside}
      notice={notice === "checkin" || notice === "skipped" ? (notice as TodayNotice) : null}
    />
  );
}
