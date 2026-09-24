export type StreakStatus = {
  days: number;
  message: string;
};

function dayBefore(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Forgiving engagement streak. A missed day pauses momentum. It does not scold. */
export function engagementStreak(loggedDates: readonly string[], today: string): StreakStatus {
  const logged = new Set(loggedDates);
  let cursor = logged.has(today) ? today : dayBefore(today);
  if (!logged.has(cursor)) {
    return { days: 0, message: "Welcome back. You can start again whenever you want." };
  }
  let days = 0;
  let graceUsed = false;
  while (logged.has(cursor) || !graceUsed) {
    if (logged.has(cursor)) {
      days += 1;
      cursor = dayBefore(cursor);
      continue;
    }
    graceUsed = true;
    cursor = dayBefore(cursor);
    if (!logged.has(cursor)) break;
  }
  const message = logged.has(today)
    ? `${days} active day${days === 1 ? "" : "s"} in a row. This tracks showing up, not health status.`
    : `Welcome back. Your recent pace is ${days} active day${days === 1 ? "" : "s"}.`;
  return { days, message };
}
