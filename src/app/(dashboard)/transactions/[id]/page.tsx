import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Receipt } from "@/features/pos/components/receipt";
import { PrintButton } from "@/features/pos/components/print-button";
import { getTransactionDetail } from "@/features/pos/queries/get-transactions";
import { requireUser } from "@/lib/auth/guards";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const transaction = await getTransactionDetail(id);
  if (!transaction) notFound();
  const receipt = {
    id: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    createdAt: transaction.createdAt.toISOString(),
    subtotal: transaction.subtotal.toString(),
    discount: transaction.discount.toString(),
    total: transaction.total.toString(),
    paidAmount: transaction.amountPaid.toString(),
    changeAmount: transaction.change.toString(),
    paymentMethod: transaction.paymentMethod,
    cashierName: transaction.user.name,
    items: transaction.items.map((item) => ({ productName: item.productName, sku: item.sku, unitPrice: item.unitPrice.toString(), quantity: item.quantity, lineTotal: item.lineTotal.toString() }))
  };
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/transactions" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-700"><ChevronLeft size={16} />Kembali ke transaksi</Link><h1 className="text-2xl font-bold text-slate-900">Detail transaksi</h1><p className="mt-1 text-sm text-slate-500">{transaction.invoiceNumber}</p></div><PrintButton /></div><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8"><Receipt transaction={receipt} /></section></div>;
}
