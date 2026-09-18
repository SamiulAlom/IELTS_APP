export const DEFAULT_TIMEZONE = "Asia/Dhaka";

export function dateKey(date = new Date(), timezone = DEFAULT_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function shiftDate(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function startOfLocalDate(key: string, timezone = DEFAULT_TIMEZONE): Date {
  const target = new Date(`${key}T00:00:00Z`).getTime();
  let estimate = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(estimate));
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    const displayed = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    estimate += target - displayed;
  }
  return new Date(estimate);
}

export function dateRange(source: string, filters: { date?: string; from?: string; to?: string } = {}, timezone = DEFAULT_TIMEZONE, now = new Date()): { gte: Date; lt: Date } | undefined {
  const today = dateKey(now, timezone);
  let from: string;
  let to: string;
  switch (source) {
    case "today": from = today; to = today; break;
    case "yesterday": from = shiftDate(today, -1); to = from; break;
    case "week": from = shiftDate(today, -6); to = today; break;
    case "month": from = `${today.slice(0, 7)}-01`; to = today; break;
    case "date": if (!filters.date) throw new Error("Select a date."); from = filters.date; to = from; break;
    case "range": if (!filters.from || !filters.to) throw new Error("Select a start and end date."); from = filters.from; to = filters.to; break;
    default: return undefined;
  }
  return { gte: startOfLocalDate(from, timezone), lt: startOfLocalDate(shiftDate(to, 1), timezone) };
}
