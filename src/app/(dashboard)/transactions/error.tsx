"use client";

export default function TransactionsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-white p-8 text-center"><p className="font-semibold text-slate-800">Riwayat transaksi tidak dapat dimuat.</p><p className="mt-1 text-sm text-slate-500">Terjadi kendala saat mengambil data transaksi.</p><button onClick={reset} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Coba lagi</button></div>;
}
