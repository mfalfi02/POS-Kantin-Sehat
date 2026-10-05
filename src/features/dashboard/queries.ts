import "server-only";

import { Prisma, type PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import type { BusinessDateRange, SalesInterval } from "./date-range";

export const COMPLETED_TRANSACTION_WHERE = { status: "COMPLETED" as const };
const LOW_STOCK_THRESHOLD = 5;
const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "DEBIT", "CREDIT", "QRIS", "TRANSFER"];

function rangeFilter(range: BusinessDateRange) {
  return { createdAt: { gte: range.start, lt: range.endExclusive } };
}

function transactionWhere(range: BusinessDateRange) {
  return { ...COMPLETED_TRANSACTION_WHERE, ...rangeFilter(range) };
}

export async function getSalesTrend(range: BusinessDateRange, interval: SalesInterval = "daily") {
  const expression = interval === "monthly"
    ? Prisma.sql`DATE_FORMAT(DATE_ADD(t.created_at, INTERVAL 7 HOUR), '%Y-%m')`
    : interval === "weekly"
      ? Prisma.sql`DATE_FORMAT(DATE_SUB(DATE_ADD(t.created_at, INTERVAL 7 HOUR), INTERVAL WEEKDAY(DATE_ADD(t.created_at, INTERVAL 7 HOUR)) DAY), '%Y-%m-%d')`
      : Prisma.sql`DATE_FORMAT(DATE_ADD(t.created_at, INTERVAL 7 HOUR), '%Y-%m-%d')`;
  const rows = await db.$queryRaw<Array<{ date: string; transactionCount: bigint | number; revenue: Prisma.Decimal | number | string }>>(Prisma.sql`
    SELECT ${expression} AS date, COUNT(*) AS transactionCount, SUM(t.total) AS revenue
    FROM transactions t
    WHERE t.status = 'COMPLETED' AND t.created_at >= ${range.start} AND t.created_at < ${range.endExclusive}
    GROUP BY ${expression}
    ORDER BY date ASC
  `);
  return rows.map((row) => ({ date: row.date, transactionCount: Number(row.transactionCount), revenue: String(row.revenue ?? "0") }));
}

export async function getSalesSummary(range: BusinessDateRange) {
  const where = transactionWhere(range);
  const [summary, itemSummary] = await Promise.all([
    db.transaction.aggregate({ where, _count: { _all: true }, _sum: { total: true, discount: true, tax: true } }),
    db.transactionItem.aggregate({ where: { transaction: where }, _sum: { quantity: true } })
  ]);
  const totalTransactions = summary._count._all;
  const revenue = summary._sum.total?.toString() ?? "0.00";
  return {
    totalRevenue: revenue,
    transactionCount: totalTransactions,
    itemCount: itemSummary._sum.quantity ?? 0,
    totalDiscount: summary._sum.discount?.toString() ?? "0.00",
    totalTax: summary._sum.tax?.toString() ?? "0.00",
    averageTransaction: totalTransactions ? new Prisma.Decimal(revenue).div(totalTransactions).toDecimalPlaces(2).toString() : "0.00"
  };
}

export async function getTopProducts(range: BusinessDateRange, limit = 5, ranking: "quantity" | "revenue" = "quantity") {
  const safeLimit = Math.min(10, Math.max(1, Math.floor(limit)));
  const orderBy = ranking === "revenue"
    ? [{ _sum: { lineTotal: "desc" as const } }, { _sum: { quantity: "desc" as const } }]
    : [{ _sum: { quantity: "desc" as const } }, { _sum: { lineTotal: "desc" as const } }];
  const rows = await db.transactionItem.groupBy({ where: { transaction: transactionWhere(range) }, by: ["productId", "productName", "sku"], _sum: { quantity: true, lineTotal: true }, orderBy, take: safeLimit });
  return rows.map((item) => ({ productId: item.productId, productName: item.productName, sku: item.sku, quantitySold: item._sum.quantity ?? 0, revenue: item._sum.lineTotal?.toString() ?? "0.00" }));
}

export async function getProductSales(range: BusinessDateRange, productName: string) {
  const rows = await db.transactionItem.groupBy({
    where: { transaction: transactionWhere(range), productName: { contains: productName.trim() } },
    by: ["productId", "productName", "sku"],
    _sum: { quantity: true, lineTotal: true },
    orderBy: [{ _sum: { lineTotal: "desc" } }, { productName: "asc" }],
    take: 21
  });
  return rows.map((item) => ({ productId: item.productId, productName: item.productName, sku: item.sku, quantitySold: item._sum.quantity ?? 0, revenue: item._sum.lineTotal?.toString() ?? "0.00" }));
}

export async function getLatestTransaction() {
  const transaction = await db.transaction.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      invoiceNumber: true, status: true, createdAt: true, subtotal: true, discount: true, tax: true, total: true,
      amountPaid: true, change: true, paymentMethod: true, user: { select: { name: true } },
      items: { select: { productName: true, sku: true, quantity: true, unitPrice: true, lineTotal: true }, orderBy: { productName: "asc" } }
    }
  });
  if (!transaction) return null;
  return {
    ...transaction,
    createdAt: transaction.createdAt.toISOString(),
    subtotal: transaction.subtotal.toString(), discount: transaction.discount.toString(), tax: transaction.tax.toString(),
    total: transaction.total.toString(), amountPaid: transaction.amountPaid.toString(), change: transaction.change.toString(),
    items: transaction.items.map((item) => ({ ...item, unitPrice: item.unitPrice.toString(), lineTotal: item.lineTotal.toString() }))
  };
}

export async function getCategoryPerformance(range: BusinessDateRange, ranking: "quantity" | "revenue" = "quantity") {
  const sort = ranking === "revenue" ? Prisma.sql`revenue DESC, quantitySold DESC` : Prisma.sql`quantitySold DESC, revenue DESC`;
  const rows = await db.$queryRaw<Array<{ categoryId: string; categoryName: string; quantitySold: bigint | number; revenue: Prisma.Decimal | number | string }>>(Prisma.sql`
      SELECT c.id AS categoryId, c.name AS categoryName,
        SUM(ti.quantity) AS quantitySold, SUM(ti.line_total) AS revenue
      FROM transaction_items ti
      INNER JOIN transactions t ON t.id = ti.transaction_id
      INNER JOIN products p ON p.id = ti.product_id
      INNER JOIN categories c ON c.id = p.category_id
      WHERE t.status = 'COMPLETED' AND t.created_at >= ${range.start} AND t.created_at < ${range.endExclusive}
      GROUP BY c.id, c.name
      ORDER BY ${sort}
    `);
  return rows.map((item) => ({ categoryId: item.categoryId, categoryName: item.categoryName, quantitySold: Number(item.quantitySold), revenue: String(item.revenue ?? "0.00") }));
}

export async function getPaymentMethodReport(range: BusinessDateRange) {
  const groups = await db.transaction.groupBy({ where: transactionWhere(range), by: ["paymentMethod"], _count: { _all: true }, _sum: { total: true } });
  return PAYMENT_METHODS.map((paymentMethod) => {
    const group = groups.find((item) => item.paymentMethod === paymentMethod);
    return { paymentMethod, transactionCount: group?._count._all ?? 0, revenue: group?._sum.total?.toString() ?? "0.00" };
  });
}

export async function getCashierReport(range: BusinessDateRange) {
  const rows = await db.$queryRaw<Array<{ userId: string; cashierName: string; transactionCount: bigint | number; revenue: Prisma.Decimal | number | string }>>(Prisma.sql`
      SELECT u.id AS userId, u.name AS cashierName, COUNT(t.id) AS transactionCount, SUM(t.total) AS revenue
      FROM transactions t INNER JOIN users u ON u.id = t.user_id
      WHERE t.status = 'COMPLETED' AND t.created_at >= ${range.start} AND t.created_at < ${range.endExclusive}
      GROUP BY u.id, u.name
      ORDER BY revenue DESC, transactionCount DESC
    `);
  return rows.map((item) => ({ ...item, transactionCount: Number(item.transactionCount), revenue: String(item.revenue ?? "0.00") }));
}

export async function getStockInsights() {
  const [outOfStockProducts, lowStockProducts] = await Promise.all([
    db.product.findMany({ where: { isActive: true, stock: 0 }, select: { id: true, name: true, sku: true, stock: true }, orderBy: { name: "asc" }, take: 8 }),
    db.product.findMany({ where: { isActive: true, stock: { gt: 0, lt: LOW_STOCK_THRESHOLD } }, select: { id: true, name: true, sku: true, stock: true }, orderBy: [{ stock: "asc" }, { name: "asc" }], take: 8 })
  ]);
  return { lowStockProducts, outOfStockProducts, threshold: LOW_STOCK_THRESHOLD };
}

export async function getDashboardData(range: BusinessDateRange) {
  const where = transactionWhere(range);
  const [productCount, categoryCount, summary, recentTransactions, topProducts, categories, payments, cashiers, salesTrend, stock] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    getSalesSummary(range),
    db.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, invoiceNumber: true, createdAt: true, total: true, paymentMethod: true, user: { select: { name: true } } } }),
    getTopProducts(range, 5),
    getCategoryPerformance(range),
    getPaymentMethodReport(range),
    getCashierReport(range),
    getSalesTrend(range),
    getStockInsights()
  ]);
  return {
    productCount,
    categoryCount,
    summary: { revenue: summary.totalRevenue, transactionCount: summary.transactionCount, itemsSold: summary.itemCount, discount: summary.totalDiscount, tax: summary.totalTax, averageTransaction: summary.averageTransaction },
    recentTransactions,
    topProducts,
    categories,
    payments,
    cashiers,
    salesTrend,
    outOfStock: stock.outOfStockProducts,
    lowStock: stock.lowStockProducts,
    lowStockThreshold: stock.threshold
  };
}
