import { AlertTriangle, Boxes, CreditCard, Users } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { formatRupiah } from "@/lib/utils";

const paymentLabels: Record<PaymentMethod, string> = { CASH: "Tunai", DEBIT: "Kartu debit", CREDIT: "Kartu kredit", QRIS: "QRIS", TRANSFER: "Transfer" };

export function ReportingPanels({
  categories, payments, cashiers, outOfStock, lowStock, lowStockThreshold
}: {
  categories: { categoryId: string; categoryName: string; quantitySold: number; revenue: string }[];
  payments: { paymentMethod: PaymentMethod; transactionCount: number; revenue: string }[];
  cashiers: { userId: string; cashierName: string; transactionCount: number; revenue: string }[];
  outOfStock: { id: string; name: string; sku: string; stock: number }[];
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  lowStockThreshold: number;
}) {
  return <div className="grid gap-5 xl:grid-cols-2">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-4"><h2 className="font-semibold text-slate-900">Performa kategori</h2><p className="mt-1 text-xs text-slate-400">Dikelompokkan memakai kategori produk saat ini</p></div>{categories.length ? <div className="space-y-3">{categories.map((item) => <div key={item.categoryId} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{item.categoryName}</p><p className="text-xs text-slate-400">{item.quantitySold} item terjual</p></div><p className="text-sm font-semibold text-slate-800">{formatRupiah(item.revenue)}</p></div>)}</div> : <EmptyReport text="Belum ada penjualan kategori pada periode ini." />}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-4 flex items-center gap-2"><CreditCard size={17} className="text-emerald-700" /><div><h2 className="font-semibold text-slate-900">Metode pembayaran</h2><p className="mt-1 text-xs text-slate-400">Transaksi berhasil berdasarkan metode</p></div></div><div className="space-y-3">{payments.map((item) => <div key={item.paymentMethod} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-700">{paymentLabels[item.paymentMethod]}</p><p className="text-xs text-slate-400">{item.transactionCount} transaksi</p></div><p className="text-sm font-semibold text-slate-800">{formatRupiah(item.revenue)}</p></div>)}</div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-4 flex items-center gap-2"><Users size={17} className="text-emerald-700" /><div><h2 className="font-semibold text-slate-900">Performa kasir</h2><p className="mt-1 text-xs text-slate-400">Tanpa menampilkan data akun sensitif</p></div></div>{cashiers.length ? <div className="space-y-3">{cashiers.map((item) => <div key={item.userId} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-700">{item.cashierName}</p><p className="text-xs text-slate-400">{item.transactionCount} transaksi</p></div><p className="text-sm font-semibold text-slate-800">{formatRupiah(item.revenue)}</p></div>)}</div> : <EmptyReport text="Belum ada transaksi untuk periode ini." />}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-4 flex items-center gap-2"><AlertTriangle size={17} className="text-amber-600" /><div><h2 className="font-semibold text-slate-900">Insight stok</h2><p className="mt-1 text-xs text-slate-400">Produk aktif · stok rendah di bawah {lowStockThreshold}</p></div></div>{outOfStock.length === 0 && lowStock.length === 0 ? <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800"><Boxes size={17} />Semua stok aktif berada di atas ambang rendah.</div> : <div className="grid gap-4 sm:grid-cols-2"><StockGroup title="Stok habis" items={outOfStock} /><StockGroup title="Stok rendah" items={lowStock} /></div>}</section>
  </div>;
}

function StockGroup({ title, items }: { title: string; items: { id: string; name: string; sku: string; stock: number }[] }) {
  return <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>{items.length ? <ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0 truncate text-slate-700">{item.name}<span className="ml-1 text-xs text-slate-400">({item.sku})</span></span><span className="shrink-0 font-semibold text-amber-700">{item.stock}</span></li>)}</ul> : <p className="text-xs text-slate-400">Tidak ada.</p>}</div>;
}

function EmptyReport({ text }: { text: string }) {
  return <div className="grid min-h-24 place-items-center text-center text-sm text-slate-400">{text}</div>;
}
