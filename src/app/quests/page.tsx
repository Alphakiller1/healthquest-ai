import { QuestsScreen } from "@/components/screens/quests-screen";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { questPeriod } from "@/lib/gamification/quest-period";
import { questViews } from "@/lib/gamification/quests";
import { usCalendarDate } from "@/lib/health/calendar";
import { skipQuest } from "../engage/actions";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = await requireOnboardedUser();
  const quests = questViews(getDemoStore(), user.id);
  const monday = questPeriod(usCalendarDate(new Date().toISOString()));
  const weekLabel = `Week of ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${monday}T12:00:00Z`))}`;
  return <QuestsScreen quests={quests} weekLabel={weekLabel} skipAction={skipQuest} />;
}
