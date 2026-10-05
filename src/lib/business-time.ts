const DAY_MS = 24 * 60 * 60 * 1000;

export function getWibDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseWibCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+07:00`);
  if (!Number.isFinite(date.getTime()) || getWibDateString(date) !== value) return null;
  return date;
}

export function shiftWibDate(value: string, days: number) {
  const date = parseWibCalendarDate(value);
  if (!date) return null;
  return getWibDateString(new Date(date.getTime() + days * DAY_MS));
}

export function getWibDateBounds(from?: string, to?: string) {
  const fromDate = from ? parseWibCalendarDate(from) : null;
  const toDate = to ? parseWibCalendarDate(to) : null;
  if ((from && !fromDate) || (to && !toDate) || (fromDate && toDate && fromDate > toDate)) return null;
  const endDate = toDate ? shiftWibDate(to!, 1) : null;
  return {
    start: fromDate,
    endExclusive: endDate ? parseWibCalendarDate(endDate) : null
  };
}
