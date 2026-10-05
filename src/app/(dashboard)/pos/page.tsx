import { Search } from "lucide-react";
import { PosWorkspace } from "@/features/pos/components/pos-workspace";
import { getPosProducts } from "@/features/pos/queries/get-pos-products";
import { requireUser } from "@/lib/auth/guards";

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function PosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const categoryId = typeof params.category === "string" ? params.category.slice(0, 30) : "";
  const { products, categories } = await getPosProducts({ search, categoryId: categoryId || undefined });
  const serializableProducts = products.map((product) => ({ ...product, price: product.price.toString() }));

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-sm font-medium text-emerald-700">Kasir</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Point of Sale</h1><p className="mt-1 text-sm text-slate-500">Pilih produk, periksa keranjang, lalu proses pembayaran.</p></div><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date())}</div></div>
    <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(200px,1fr)_240px_auto]"><div className="relative"><Search size={17} className="absolute left-3 top-2.5 text-slate-400" /><input name="q" defaultValue={search} maxLength={100} placeholder="Cari nama produk..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div><select name="category" aria-label="Filter kategori produk" defaultValue={categoryId} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-600"><option value="">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Cari produk</button></form>
    <PosWorkspace products={serializableProducts} />
  </div>;
}
