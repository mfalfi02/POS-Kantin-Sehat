import { getWibDateString, parseWibCalendarDate, shiftWibDate } from "@/lib/business-time";

export type DashboardPeriod = "today" | "yesterday" | "7d" | "30d" | "week" | "previous_week" | "month" | "previous_month" | "year" | "custom";
export type SalesInterval = "daily" | "weekly" | "monthly";

export type BusinessDateRange = {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
  period: DashboardPeriod;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function resolveBusinessDateRange(options: {
  period?: string;
  from?: string;
  to?: string;
  now?: Date;
} = {}): BusinessDateRange {
  const period: DashboardPeriod = ["today", "yesterday", "7d", "30d", "week", "previous_week", "month", "previous_month", "year", "custom"].includes(options.period ?? "")
    ? options.period as DashboardPeriod
    : "7d";
  const today = getWibDateString(options.now ?? new Date());
  let from = today;
  let to = today;

  if (period === "7d") from = shiftWibDate(today, -6)!;
  if (period === "30d") from = shiftWibDate(today, -29)!;
  if (period === "yesterday") from = to = shiftWibDate(today, -1)!;
  const weekday = new Date(`${today}T12:00:00+07:00`).getUTCDay();
  if (period === "week") from = shiftWibDate(today, -((weekday + 6) % 7))!;
  if (period === "previous_week") {
    const mondayOffset = (weekday + 6) % 7;
    to = shiftWibDate(today, -mondayOffset - 1)!;
    from = shiftWibDate(to, -6)!;
  }
  if (period === "month" || period === "previous_month") {
    const currentMonthStart = `${today.slice(0, 7)}-01`;
    from = period === "month" ? currentMonthStart : shiftWibDate(currentMonthStart, -1)!.slice(0, 7) + "-01";
    if (period === "previous_month") to = shiftWibDate(currentMonthStart, -1)!;
  }
  if (period === "year") from = `${today.slice(0, 4)}-01-01`;
  if (period === "custom") {
    const parsedFrom = options.from ? parseWibCalendarDate(options.from) : null;
    const parsedTo = options.to ? parseWibCalendarDate(options.to) : null;
    from = parsedFrom && parsedTo && parsedFrom <= parsedTo ? options.from! : shiftWibDate(today, -6)!;
    to = parsedFrom && parsedTo && parsedFrom <= parsedTo ? options.to! : today;
  }

  const start = parseWibCalendarDate(from)!;
  const endExclusive = parseWibCalendarDate(shiftWibDate(to, 1)!)!;
  return { from, to, start, endExclusive, period };
}

export function getRangeDayCount(range: BusinessDateRange) {
  return Math.round((range.endExclusive.getTime() - range.start.getTime()) / DAY_MS);
}

export function getPreviousComparableRange(range: BusinessDateRange): BusinessDateRange {
  if (range.period === "month") {
    const monthStart = `${range.from.slice(0, 7)}-01`;
    const previousMonthLastDay = shiftWibDate(monthStart, -1)!;
    const previousFrom = `${previousMonthLastDay.slice(0, 7)}-01`;
    const previousMonthDays = Number(previousMonthLastDay.slice(-2));
    const comparableDays = Math.min(getRangeDayCount(range), previousMonthDays);
    const previousTo = shiftWibDate(previousFrom, comparableDays - 1)!;
    return { from: previousFrom, to: previousTo, start: parseWibCalendarDate(previousFrom)!, endExclusive: parseWibCalendarDate(shiftWibDate(previousTo, 1)!)!, period: "custom" };
  }
  const days = getRangeDayCount(range);
  const to = shiftWibDate(range.from, -1)!;
  const from = shiftWibDate(to, -(days - 1))!;
  return { from, to, start: parseWibCalendarDate(from)!, endExclusive: parseWibCalendarDate(shiftWibDate(to, 1)!)!, period: "custom" };
}
