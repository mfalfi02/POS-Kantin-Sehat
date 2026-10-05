import "server-only";

import { Prisma, type PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { centsToDecimal, decimalToCents } from "../utils/money";
import { transactionSchema } from "../schemas/transaction-schema";

export type TransactionResult =
  | { ok: true; message: string; transaction: { id: string; invoiceNumber: string; createdAt: string; subtotal: string; discount: string; total: string; paidAmount: string; changeAmount: string; paymentMethod: "CASH"; cashierName: string; items: { productName: string; sku: string; unitPrice: string; quantity: number; lineTotal: string }[] } }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

class StockUnavailableError extends Error {
  constructor(readonly productName: string, readonly available: number, readonly requested: number) { super("STOCK_UNAVAILABLE"); }
}

function getInvoiceDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function getValidationErrors(error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])));
}

export async function createTransactionForUser(userId: string, input: unknown): Promise<TransactionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa kembali keranjang dan pembayaran.", fieldErrors: getValidationErrors(parsed.error) };

  const requestedById = new Map(parsed.data.items.map((item) => [item.productId, item.quantity]));
  const productIds = [...requestedById.keys()].sort();
  const now = new Date();
  const invoiceDate = getInvoiceDay(now);
  const discountCents = decimalToCents(parsed.data.discount);
  const paidCents = decimalToCents(parsed.data.paidAmount);

  try {
    const transaction = await db.$transaction(async (tx) => {
      const user = await tx.user.findFirst({ where: { id: userId, isActive: true }, select: { id: true, name: true } });
      if (!user) throw new Error("SESSION_NOT_ACTIVE");

      const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true, sku: true, name: true, price: true, stock: true } });
      const productById = new Map(products.map((product) => [product.id, product]));
      if (products.length !== productIds.length) throw new Error("PRODUCT_UNAVAILABLE");

      const subtotalCents = products.reduce((sum, product) => sum + decimalToCents(product.price.toString()) * BigInt(requestedById.get(product.id) ?? 0), BigInt(0));
      if (subtotalCents > BigInt("999999999999")) throw new Error("AMOUNT_LIMIT_EXCEEDED");
      if (discountCents > subtotalCents) throw new Error("DISCOUNT_EXCEEDS_SUBTOTAL");
      const totalCents = subtotalCents - discountCents;
      if (paidCents < totalCents) throw new Error("PAYMENT_INSUFFICIENT");

      // Stable lock order plus an atomic stock predicate prevents overselling.
      for (const productId of productIds) {
        const requested = requestedById.get(productId)!;
        const product = productById.get(productId)!;
        const updated = await tx.product.updateMany({ where: { id: productId, isActive: true, stock: { gte: requested } }, data: { stock: { decrement: requested } } });
        if (updated.count !== 1) {
          const latest = await tx.product.findUnique({ where: { id: productId }, select: { stock: true, isActive: true } });
          throw new StockUnavailableError(product.name, latest?.isActive ? latest.stock : 0, requested);
        }
      }

      const existingSequence = await tx.dailyInvoiceSequence.findUnique({ where: { date: invoiceDate }, select: { value: true } });
      let startingSequence = 1;
      if (!existingSequence) {
        const [latestInvoice] = await tx.$queryRaw<{ lastValue: bigint | number | null }[]>(Prisma.sql`
          SELECT MAX(CAST(SUBSTRING(invoice_number, 14) AS UNSIGNED)) AS lastValue
          FROM transactions
          WHERE invoice_number LIKE ${`TRX-${invoiceDate}-%`}
        `);
        startingSequence = Number(latestInvoice?.lastValue ?? 0) + 1;
      }
      const sequence = await tx.dailyInvoiceSequence.upsert({
        where: { date: invoiceDate },
        create: { date: invoiceDate, value: startingSequence },
        update: { value: { increment: 1 } },
        select: { value: true }
      });
      const invoiceNumber = `TRX-${invoiceDate}-${String(sequence.value).padStart(4, "0")}`;
      const lineItems = products.map((product) => {
        const quantity = requestedById.get(product.id)!;
        const unitCents = decimalToCents(product.price.toString());
        return { productId: product.id, productName: product.name, sku: product.sku, quantity, unitPrice: centsToDecimal(unitCents), lineTotal: centsToDecimal(unitCents * BigInt(quantity)) };
      });

      const created = await tx.transaction.create({
        data: {
          invoiceNumber, userId: user.id,
          subtotal: new Prisma.Decimal(centsToDecimal(subtotalCents)),
          discount: new Prisma.Decimal(centsToDecimal(discountCents)),
          tax: new Prisma.Decimal("0.00"),
          total: new Prisma.Decimal(centsToDecimal(totalCents)),
          amountPaid: new Prisma.Decimal(centsToDecimal(paidCents)),
          change: new Prisma.Decimal(centsToDecimal(paidCents - totalCents)),
          paymentMethod: "CASH" satisfies PaymentMethod,
          createdAt: now,
          items: { create: lineItems.map((item) => ({ ...item, unitPrice: new Prisma.Decimal(item.unitPrice), lineTotal: new Prisma.Decimal(item.lineTotal) })) }
        },
        include: { items: true }
      });
      return { created, cashierName: user.name };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 });

    return { ok: true, message: "Transaksi berhasil disimpan.", transaction: {
      id: transaction.created.id, invoiceNumber: transaction.created.invoiceNumber, createdAt: transaction.created.createdAt.toISOString(),
      subtotal: transaction.created.subtotal.toString(), discount: transaction.created.discount.toString(), total: transaction.created.total.toString(),
      paidAmount: transaction.created.amountPaid.toString(), changeAmount: transaction.created.change.toString(), paymentMethod: "CASH",
      cashierName: transaction.cashierName,
      items: transaction.created.items.map((item) => ({ productName: item.productName, sku: item.sku, unitPrice: item.unitPrice.toString(), quantity: item.quantity, lineTotal: item.lineTotal.toString() }))
    } };
  } catch (error) {
    if (error instanceof StockUnavailableError) return { ok: false, message: `Stok produk ${error.productName} tidak mencukupi. Stok tersedia: ${error.available}, diminta: ${error.requested}.` };
    if (error instanceof Error && error.message === "DISCOUNT_EXCEEDS_SUBTOTAL") return { ok: false, message: "Diskon tidak boleh melebihi subtotal." };
    if (error instanceof Error && error.message === "PAYMENT_INSUFFICIENT") return { ok: false, message: "Pembayaran kurang dari total transaksi." };
    if (error instanceof Error && error.message === "PRODUCT_UNAVAILABLE") return { ok: false, message: "Ada produk yang sudah nonaktif atau tidak tersedia. Muat ulang katalog." };
    if (error instanceof Error && error.message === "AMOUNT_LIMIT_EXCEEDED") return { ok: false, message: "Total transaksi melebihi batas nominal yang didukung." };
    if (error instanceof Error && error.message === "SESSION_NOT_ACTIVE") return { ok: false, message: "Akun tidak aktif. Silakan masuk kembali." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "Nomor transaksi sedang diproses. Silakan coba kembali." };
    return { ok: false, message: "Transaksi gagal diproses. Stok dan transaksi tidak diubah; silakan coba kembali." };
  }
}
