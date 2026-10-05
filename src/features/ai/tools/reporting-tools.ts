import "server-only";

import { z } from "zod";
import { getCashierReport, getCategoryPerformance, getLatestTransaction, getPaymentMethodReport, getProductSales, getSalesSummary, getSalesTrend, getStockInsights, getTopProducts } from "@/features/dashboard/queries";
import { getPreviousComparableRange, resolveBusinessDateRange } from "@/features/dashboard/date-range";
import { categoryArgumentsSchema, comparisonArgumentsSchema, parseAssistantDateRange, periodArgumentsSchema, productSalesArgumentsSchema, topProductsArgumentsSchema, trendArgumentsSchema, assistantPeriods } from "../schemas/assistant-schema";
import { calculateComparisonChange } from "../services/comparison-metrics";

const dateProperties = {
  period: { type: "string", enum: [...assistantPeriods], description: "Business period in WIB." },
  startDate: { type: ["string", "null"], description: "Inclusive YYYY-MM-DD in WIB; null unless period is custom." },
  endDate: { type: ["string", "null"], description: "Inclusive YYYY-MM-DD in WIB; null unless period is custom." }
};
const dateRequired = ["period", "startDate", "endDate"];
const dateParameters = { type: "object", properties: dateProperties, required: dateRequired, additionalProperties: false };
const noArgumentsSchema = z.object({}).strict();

export const reportingTools = [
  { type: "function", name: "get_sales_summary", description: "Get total completed sales revenue, transaction count, item quantity, discount, tax, and average transaction for a WIB business period.", parameters: dateParameters, strict: true },
  { type: "function", name: "get_sales_trend", description: "Get completed sales aggregates by daily, weekly, or monthly period. Use only for sales trend questions.", parameters: { type: "object", properties: { ...dateProperties, interval: { type: "string", enum: ["daily", "weekly", "monthly"] } }, required: [...dateRequired, "interval"], additionalProperties: false }, strict: true },
  { type: "function", name: "get_top_products", description: "Rank products by quantity sold or revenue (never confuse these metrics). Includes historical product name, SKU and revenue. Limit is 1 to 10.", parameters: { type: "object", properties: { ...dateProperties, limit: { type: "integer", minimum: 1, maximum: 10 }, ranking: { type: "string", enum: ["quantity", "revenue"] } }, required: [...dateRequired, "limit", "ranking"], additionalProperties: false }, strict: true },
  { type: "function", name: "get_product_sales", description: "Get completed sales quantity and revenue for a specifically named product during a WIB period. Returns up to 20 matching product snapshots so ambiguity can be clarified.", parameters: { type: "object", properties: { ...dateProperties, productName: { type: "string", minLength: 1, maxLength: 150 } }, required: [...dateRequired, "productName"], additionalProperties: false }, strict: true },
  { type: "function", name: "get_latest_transaction", description: "Get the latest transaction including invoice, status, cashier, WIB-convertible timestamp, payment totals and item snapshots. Read-only.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true },
  { type: "function", name: "get_sales_comparison", description: "Compare a WIB period with the immediately preceding period of the same duration. Returns exact revenue and transaction deltas and percentage changes; percentage is null when prior value is zero.", parameters: dateParameters, strict: true },
  { type: "function", name: "get_category_performance", description: "Get category sales totals ranked by quantity or revenue (distinguish metrics). Historical category attribution uses each product's current category.", parameters: { type: "object", properties: { ...dateProperties, ranking: { type: "string", enum: ["quantity", "revenue"] } }, required: [...dateRequired, "ranking"], additionalProperties: false }, strict: true },
  { type: "function", name: "get_payment_method_report", description: "Get completed transaction count and revenue by payment method for a WIB period.", parameters: dateParameters, strict: true },
  { type: "function", name: "get_cashier_report", description: "Get completed transaction count and revenue by cashier name and ID for a WIB period. Do not request email or account credentials.", parameters: dateParameters, strict: true },
  { type: "function", name: "get_stock_insights", description: "Read active low-stock and out-of-stock product insights. This tool never changes stock.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true }
] as const;

type DateArguments = { period: typeof assistantPeriods[number]; startDate: string | null; endDate: string | null };
type ToolCall = { name: string; arguments: string; call_id: string };

function resolveToolRange(input: DateArguments) {
  const parsed = periodArgumentsSchema.safeParse(input);
  if (!parsed.success) return null;
  const selection = parseAssistantDateRange(parsed.data);
  if (!selection.ok) return null;
  return resolveBusinessDateRange(selection.range);
}

export async function executeReportingTool(call: ToolCall): Promise<unknown> {
  let raw: unknown;
  try {
    raw = JSON.parse(call.arguments);
  } catch {
    return { error: "Invalid tool arguments." };
  }

  if (call.name === "get_stock_insights") {
    if (!noArgumentsSchema.safeParse(raw).success) return { error: "Invalid stock insight arguments." };
    const parsed = await getStockInsights();
    return {
      threshold: parsed.threshold,
      lowStockProducts: parsed.lowStockProducts.map(({ name, sku, stock }) => ({ name, sku, stock })),
      outOfStockProducts: parsed.outOfStockProducts.map(({ name, sku, stock }) => ({ name, sku, stock }))
    };
  }

  if (call.name === "get_latest_transaction") {
    if (!noArgumentsSchema.safeParse(raw).success) return { error: "Invalid latest transaction arguments." };
    const transaction = await getLatestTransaction();
    return transaction ?? { found: false };
  }

  if (call.name === "get_sales_summary") {
    const input = periodArgumentsSchema.safeParse(raw);
    const range = input.success ? resolveToolRange(input.data) : null;
    return range ? getSalesSummary(range) : { error: "Invalid or unsupported WIB date range." };
  }

  if (call.name === "get_sales_comparison") {
    const input = comparisonArgumentsSchema.safeParse(raw);
    if (!input.success) return { error: "Invalid or unsupported comparison arguments." };
    const currentRange = resolveToolRange(input.data);
    if (!currentRange) return { error: "Invalid or unsupported WIB date range." };
    const previousRange = getPreviousComparableRange(currentRange);
    const [current, previous] = await Promise.all([getSalesSummary(currentRange), getSalesSummary(previousRange)]);
    return {
      current: { from: currentRange.from, to: currentRange.to, ...current },
      previous: { from: previousRange.from, to: previousRange.to, ...previous },
      change: calculateComparisonChange(current.totalRevenue, previous.totalRevenue, current.transactionCount, previous.transactionCount)
    };
  }

  if (call.name === "get_sales_trend") {
    const input = trendArgumentsSchema.safeParse(raw);
    if (!input.success) return { error: "Invalid or unsupported trend arguments." };
    const range = resolveToolRange(input.data);
    return range ? getSalesTrend(range, input.data.interval) : { error: "Invalid or unsupported trend arguments." };
  }

  if (call.name === "get_top_products") {
    const input = topProductsArgumentsSchema.safeParse(raw);
    if (!input.success) return { error: "Invalid or unsupported product report arguments." };
    const range = resolveToolRange(input.data);
    return range ? getTopProducts(range, input.data.limit, input.data.ranking) : { error: "Invalid or unsupported product report arguments." };
  }

  if (call.name === "get_product_sales") {
    const input = productSalesArgumentsSchema.safeParse(raw);
    if (!input.success) return { error: "Invalid product sales arguments." };
    const range = resolveToolRange(input.data);
    if (!range) return { error: "Invalid or unsupported WIB date range." };
    const items = await getProductSales(range, input.data.productName);
    return { items: items.slice(0, 20), truncated: items.length > 20 };
  }

  if (call.name === "get_category_performance") {
    const input = categoryArgumentsSchema.safeParse(raw);
    if (!input.success) return { error: "Invalid or unsupported WIB date range." };
    const range = resolveToolRange(input.data);
    if (!range) return { error: "Invalid or unsupported WIB date range." };
    const categories = await getCategoryPerformance(range, input.data.ranking);
    return { limitation: "Historical attribution uses the product's current category.", items: categories.slice(0, 50), truncated: categories.length > 50 };
  }

  if (call.name === "get_payment_method_report") {
    const input = periodArgumentsSchema.safeParse(raw);
    const range = input.success ? resolveToolRange(input.data) : null;
    return range ? getPaymentMethodReport(range) : { error: "Invalid or unsupported WIB date range." };
  }

  if (call.name === "get_cashier_report") {
    const input = periodArgumentsSchema.safeParse(raw);
    const range = input.success ? resolveToolRange(input.data) : null;
    if (!range) return { error: "Invalid or unsupported WIB date range." };
    const cashiers = await getCashierReport(range);
    return { items: cashiers.slice(0, 25), truncated: cashiers.length > 25 };
  }

  return { error: "Unsupported reporting tool." };
}
