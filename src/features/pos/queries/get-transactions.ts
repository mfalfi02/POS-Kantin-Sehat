import { PaymentMethod, TransactionStatus } from "@prisma/client";
import { getWibDateBounds } from "@/lib/business-time";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;
export async function getTransactionPage({ search, from, to, cashierId, paymentMethod, status = "COMPLETED", page = 1 }: { search?: string; from?: string; to?: string; cashierId?: string; paymentMethod?: string; status?: string; page?: number }) {
  const safePage = Math.min(1_000_000, Math.max(1, Math.floor(page)));
  const term = search?.trim().slice(0, 40);
  const dateBounds = getWibDateBounds(from, to);
  const createdAt = dateBounds && (dateBounds.start || dateBounds.endExclusive) ? {
    ...(dateBounds.start ? { gte: dateBounds.start } : {}),
    ...(dateBounds.endExclusive ? { lt: dateBounds.endExclusive } : {})
  } : undefined;
  const safeStatus = status === "VOIDED" || status === "ALL" ? status : "COMPLETED";
  const safePayment = Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod) ? paymentMethod as PaymentMethod : undefined;
  const where = {
    ...(safeStatus === "ALL" ? {} : { status: safeStatus as TransactionStatus }),
    ...(term ? { invoiceNumber: { contains: term } } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(cashierId && cashierId.length <= 191 ? { userId: cashierId } : {}),
    ...(safePayment ? { paymentMethod: safePayment } : {})
  };
  const [transactions, total] = await Promise.all([
    db.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (safePage - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { name: true } }, items: { select: { quantity: true } } } }),
    db.transaction.count({ where })
  ]);
  return { transactions, total, page: safePage, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getTransactionCashiers() {
  return db.user.findMany({ where: { transactions: { some: {} } }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export async function getTransactionDetail(id: string) {
  return db.transaction.findFirst({ where: { id, status: "COMPLETED" }, include: { user: { select: { name: true } }, items: { orderBy: { id: "asc" } } } });
}
