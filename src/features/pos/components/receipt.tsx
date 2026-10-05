"use client";

import { formatCents, decimalToCents } from "../utils/money";

export type ReceiptPaymentMethod = "CASH" | "DEBIT" | "CREDIT" | "QRIS" | "TRANSFER";
export type CompletedTransaction = { id: string; invoiceNumber: string; createdAt: string; subtotal: string; discount: string; total: string; paidAmount: string; changeAmount: string; paymentMethod: ReceiptPaymentMethod; cashierName: string; items: { productName: string; sku: string; unitPrice: string; quantity: number; lineTotal: string }[] };

const paymentLabels: Record<ReceiptPaymentMethod, string> = { CASH: "Tunai", DEBIT: "Kartu debit", CREDIT: "Kartu kredit", QRIS: "QRIS", TRANSFER: "Transfer" };

export function Receipt({ transaction }: { transaction: CompletedTransaction }) {
  const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(transaction.createdAt));
  return <div id="receipt-printable" className="mx-auto w-full max-w-[320px] bg-white p-5 font-mono text-xs text-slate-800">
    <div className="text-center"><p className="text-sm font-bold tracking-wide">APLIKASI KANTIN SEHAT</p><p className="mt-1">Struk transaksi</p><div className="my-3 border-t border-dashed border-slate-400" /><p className="font-bold">{transaction.invoiceNumber}</p><p className="mt-1">{date} WIB</p><p>Kasir: {transaction.cashierName}</p></div>
    <div className="my-3 border-t border-dashed border-slate-400" />
    <div className="space-y-2">{transaction.items.map((item, index) => <div key={`${item.sku}-${index}`}><div className="font-semibold">{item.productName}</div><div className="flex justify-between"><span>{item.quantity} x {formatCents(decimalToCents(item.unitPrice))}</span><span>{formatCents(decimalToCents(item.lineTotal))}</span></div></div>)}</div>
    <div className="my-3 border-t border-dashed border-slate-400" /><div className="space-y-1"><div className="flex justify-between"><span>Subtotal</span><span>{formatCents(decimalToCents(transaction.subtotal))}</span></div><div className="flex justify-between"><span>Diskon</span><span>{formatCents(decimalToCents(transaction.discount))}</span></div><div className="my-2 border-t border-slate-400" /><div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatCents(decimalToCents(transaction.total))}</span></div><div className="mt-2 flex justify-between"><span>Bayar</span><span>{formatCents(decimalToCents(transaction.paidAmount))}</span></div><div className="flex justify-between"><span>Kembali</span><span>{formatCents(decimalToCents(transaction.changeAmount))}</span></div><div className="flex justify-between"><span>Metode</span><span>{paymentLabels[transaction.paymentMethod]}</span></div></div>
    <div className="my-3 border-t border-dashed border-slate-400" /><p className="text-center font-semibold">Terima kasih</p>
  </div>;
}
