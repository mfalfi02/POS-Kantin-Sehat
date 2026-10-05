import { Search, Tags } from "lucide-react";
import { CategoryActions } from "@/features/categories/components/category-actions";
import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog";
import { getCategories } from "@/features/categories/queries/get-categories";
import { requireUser } from "@/lib/auth/guards";

type SearchParams = Promise<{ q?: string }>;

export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const search = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const categories = await getCategories(search);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-sm font-medium text-emerald-700">Master data</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kategori</h1><p className="mt-1 text-sm text-slate-500">Kelompokkan produk agar mudah ditemukan saat transaksi.</p></div>{user.role === "ADMIN" && <CategoryFormDialog />}</div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">Daftar kategori</h2><p className="mt-1 text-xs text-slate-400">{categories.length} kategori ditemukan</p></div><form method="get" className="relative w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input name="q" defaultValue={search} maxLength={80} placeholder="Cari nama kategori..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></form></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Kategori</th><th className="px-5 py-3 font-semibold">Deskripsi</th><th className="px-5 py-3 font-semibold">Produk</th><th className="px-5 py-3 font-semibold">Dibuat</th>{user.role === "ADMIN" && <th className="px-5 py-3 text-right font-semibold">Aksi</th>}</tr></thead><tbody className="divide-y divide-slate-100">{categories.length ? categories.map((category) => <tr key={category.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Tags size={17} /></span><span className="font-semibold text-slate-800">{category.name}</span></div></td><td className="max-w-[300px] truncate px-5 py-4 text-slate-500">{category.description || "—"}</td><td className="px-5 py-4 text-slate-600">{category._count.products}</td><td className="px-5 py-4 text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(category.createdAt)}</td>{user.role === "ADMIN" && <td className="px-5 py-4"><CategoryActions category={{ id: category.id, name: category.name, description: category.description }} /></td>}</tr>) : <tr><td colSpan={user.role === "ADMIN" ? 5 : 4} className="px-5 py-14 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-50 text-slate-400"><Tags size={21} /></div><p className="mt-3 font-semibold text-slate-700">{search ? "Kategori tidak ditemukan" : "Belum ada kategori"}</p><p className="mt-1 text-sm text-slate-400">{search ? "Coba gunakan kata pencarian lain." : "Tambahkan kategori untuk mulai mengelompokkan produk."}</p></td></tr>}</tbody></table></div>
    </section>
  </div>;
}
