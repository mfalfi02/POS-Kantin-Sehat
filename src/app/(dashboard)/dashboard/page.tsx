import { ArrowUpRight, Boxes, CircleDollarSign, ReceiptText, Tags } from "lucide-react";
import Link from "next/link";
import { DateFilter } from "@/components/dashboard/date-filter";
import { ReportingPanels } from "@/components/dashboard/reporting-panels";
import { AssistantPanel } from "@/features/ai/components/assistant-panel";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { getRangeDayCount, resolveBusinessDateRange } from "@/features/dashboard/date-range";
import { getDashboardData } from "@/features/dashboard/queries";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const range = resolveBusinessDateRange({ period: params.period, from: params.from, to: params.to });
  const data = await getDashboardData(range);
  const countDays = Math.min(366, getRangeDayCount(range));
  const trendByDate = new Map(data.salesTrend.map((item) => [item.date, item]));
  const chartData = Array.from({ length: countDays }, (_, index) => {
    const date = new Date(range.start.getTime() + index * 24 * 60 * 60 * 1000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    return { day: new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }).format(date), total: Number(trendByDate.get(key)?.revenue ?? 0), transactionCount: trendByDate.get(key)?.transactionCount ?? 0 };
  });
  const stats = [
    { label: "Total Omzet", value: formatRupiah(data.summary.revenue), icon: CircleDollarSign, caption: "Transaksi selesai" },
    { label: "Total Transaksi", value: String(data.summary.transactionCount), icon: ReceiptText, caption: "Transaksi selesai" },
    { label: "Item Terjual", value: String(data.summary.itemsSold), icon: Boxes, caption: "Kuantitas item" },
    { label: "Total Diskon", value: formatRupiah(data.summary.discount), icon: Tags, caption: `Pajak ${formatRupiah(data.summary.tax)}` }
  ];
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-sm font-medium text-emerald-700">Ringkasan toko</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1><p className="mt-1 text-sm text-slate-500">{data.productCount} produk aktif · {data.categoryCount} kategori · Rata-rata transaksi {formatRupiah(data.summary.averageTransaction)}</p></div><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{range.from} — {range.to} WIB</div></div>
    <DateFilter period={range.period} from={range.from} to={range.to} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, caption }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="flex items-start justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon size={19} /></span></div><p className="mt-5 text-2xl font-bold text-slate-900">{value}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><ArrowUpRight size={14} className="text-emerald-600" />{caption}</p></article>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-5"><h2 className="font-semibold text-slate-900">Tren penjualan harian</h2><p className="mt-1 text-xs text-slate-400">Omzet dan jumlah transaksi selesai · WIB</p></div>{data.summary.transactionCount ? <SalesChart data={chartData} /> : <div className="grid h-[250px] place-items-center text-center text-sm text-slate-400"><div><Boxes className="mx-auto mb-2" size={24} /><p>Belum ada penjualan pada periode ini.</p></div></div>}</article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="mb-5"><h2 className="font-semibold text-slate-900">Produk terlaris</h2><p className="mt-1 text-xs text-slate-400">Urutan kuantitas · nilai dari snapshot item</p></div>{data.topProducts.length ? <div className="space-y-4">{data.topProducts.map((item, i) => <div key={`${item.productId}-${item.productName}`} className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">{String(i + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.productName}</p><p className="text-xs text-slate-400">{item.sku} · {item.quantitySold} terjual</p></div><span className="text-sm font-medium text-slate-700">{formatRupiah(item.revenue)}</span></div>)}</div> : <div className="grid min-h-[190px] place-items-center text-center"><div><div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-slate-50 text-slate-400"><Boxes size={19} /></div><p className="text-sm font-medium text-slate-600">Belum ada data penjualan</p><p className="mt-1 text-xs text-slate-400">Produk terlaris tampil setelah transaksi.</p></div></div>}</article></section>
    <ReportingPanels categories={data.categories} payments={data.payments} cashiers={data.cashiers} outOfStock={data.outOfStock} lowStock={data.lowStock} lowStockThreshold={data.lowStockThreshold} />
    <AssistantPanel />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Transaksi pada periode</h2><p className="mt-1 text-xs text-slate-400">{data.recentTransactions.length} transaksi terbaru · {data.summary.transactionCount} transaksi selesai dalam periode</p></div><Link href="/transactions" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Lihat semua</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Invoice</th><th className="px-5 py-3 font-semibold">Kasir</th><th className="px-5 py-3 font-semibold">Waktu</th><th className="px-5 py-3 font-semibold">Pembayaran</th><th className="px-5 py-3 text-right font-semibold">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentTransactions.length ? data.recentTransactions.map((tx) => <tr key={tx.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-slate-800">{tx.invoiceNumber}</td><td className="px-5 py-4 text-slate-600">{tx.user.name}</td><td className="px-5 py-4 text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(tx.createdAt)}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tx.paymentMethod}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-800">{formatRupiah(tx.total.toString())}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center"><p className="font-medium text-slate-600">Belum ada transaksi</p><p className="mt-1 text-xs text-slate-400">Transaksi selesai dalam periode ini akan muncul di sini.</p></td></tr>}</tbody></table></div></section>
  </div>;
}
