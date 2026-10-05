import type { DashboardPeriod } from "@/features/dashboard/date-range";

export function DateFilter({ period, from, to }: { period: DashboardPeriod; from: string; to: string }) {
  return <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
    <label className="grid gap-1 text-xs font-medium text-slate-500">Periode<select name="period" defaultValue={period} className="h-10 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="today">Hari ini</option><option value="7d">7 hari terakhir</option><option value="30d">30 hari terakhir</option><option value="month">Bulan ini</option><option value="custom">Rentang khusus</option></select></label>
    <label className="grid gap-1 text-xs font-medium text-slate-500">Dari<input type="date" name="from" defaultValue={from} className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700" /></label>
    <label className="grid gap-1 text-xs font-medium text-slate-500">Sampai<input type="date" name="to" defaultValue={to} className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700" /></label>
    <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Terapkan</button>
    <span className="ml-auto self-center text-xs text-slate-400">Batas hari mengikuti WIB</span>
  </form>;
}
