import { z } from "zod";
import { parseWibCalendarDate } from "@/lib/business-time";

export const assistantRequestSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan wajib diisi.").max(2000, "Pertanyaan terlalu panjang."),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(800) }).strict()).max(12).optional().default([])
}).strict();

export const assistantPeriods = ["today", "yesterday", "7d", "30d", "week", "previous_week", "month", "previous_month", "year", "custom"] as const;

export const periodArgumentsSchema = z.object({
  period: z.enum(assistantPeriods),
  startDate: z.string().max(10).nullable(),
  endDate: z.string().max(10).nullable()
}).strict();

export const trendArgumentsSchema = periodArgumentsSchema.extend({
  interval: z.enum(["daily", "weekly", "monthly"])
}).strict();

export const topProductsArgumentsSchema = periodArgumentsSchema.extend({
  limit: z.number().int().min(1).max(10),
  ranking: z.enum(["quantity", "revenue"])
}).strict();

export const categoryArgumentsSchema = periodArgumentsSchema.extend({ ranking: z.enum(["quantity", "revenue"]) }).strict();
export const productSalesArgumentsSchema = periodArgumentsSchema.extend({ productName: z.string().trim().min(1).max(150) }).strict();

export const assistantResponseSchema = z.object({
  answer: z.string().trim().min(1).max(4000)
}).strict();

export function parseAssistantDateRange(input: z.infer<typeof periodArgumentsSchema>) {
  if (input.period !== "custom") {
    return { ok: true as const, range: { period: input.period } };
  }
  if (!input.startDate || !input.endDate) return { ok: false as const };
  const start = parseWibCalendarDate(input.startDate);
  const end = parseWibCalendarDate(input.endDate);
  if (!start || !end || start > end) return { ok: false as const };
  const dayCount = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (dayCount > 366) return { ok: false as const };
  return { ok: true as const, range: { period: input.period, from: input.startDate, to: input.endDate } };
}

export const comparisonArgumentsSchema = periodArgumentsSchema;
