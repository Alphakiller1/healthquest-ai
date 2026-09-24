export function usCalendarDate(value: string, timeZone = "America/New_York"): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(value));
}

export function recentCalendarDates(today: string, days: number): string[] {
  const [year, month, day] = today.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}
