"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createProductAction, updateProductAction } from "../actions/product-actions";
import { productSchema, type ProductInput } from "../schemas/product-schema";

type CategoryOption = { id: string; name: string };
type ProductValue = { id: string; name: string; description: string | null; categoryId: string; price: string; stock: number; imageUrl: string | null; isActive: boolean };

export function ProductFormDialog({ categories, product }: { categories: CategoryOption[]; product?: ProductValue }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: product?.name ?? "", description: product?.description ?? "", categoryId: product?.categoryId ?? categories[0]?.id ?? "", price: product?.price ?? "", stock: product?.stock ?? 0, imageUrl: product?.imageUrl ?? "", isActive: product?.isActive ?? true }
  });

  useEffect(() => {
    if (open) reset({ name: product?.name ?? "", description: product?.description ?? "", categoryId: product?.categoryId ?? categories[0]?.id ?? "", price: product?.price ?? "", stock: product?.stock ?? 0, imageUrl: product?.imageUrl ?? "", isActive: product?.isActive ?? true });
  }, [open, product, categories, reset]);

  async function submit(values: ProductInput) {
    try {
      const result = product ? await updateProductAction(product.id, values) : await createProductAction(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => setError(field as keyof ProductInput, { message: messages.join(" ") }));
        toast(result.message, "error");
        return;
      }
      toast(result.message);
      setOpen(false);
      router.refresh();
    } catch { toast("Produk gagal disimpan. Periksa koneksi lalu coba lagi.", "error"); }
  }

  return <>
    {product ? <button type="button" onClick={() => setOpen(true)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Edit</button> : <Button type="button" disabled={categories.length === 0} onClick={() => setOpen(true)} title={categories.length ? "Tambah produk" : "Buat kategori terlebih dahulu"}><Plus size={16} />Tambah produk</Button>}
    <Dialog open={open} onClose={() => setOpen(false)} title={product ? "Edit produk" : "Tambah produk"} description="Informasi stok yang disimpan di sini hanya diperbarui oleh admin." width="max-w-2xl">
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-slate-700">Nama produk <span className="text-red-500">*</span></span><input {...register("name")} autoFocus maxLength={120} placeholder="Contoh: Keripik singkong" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}</label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi <span className="font-normal text-slate-400">(opsional)</span></span><textarea {...register("description")} rows={2} maxLength={2000} placeholder="Keterangan produk" className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.description && <span className="mt-1 block text-xs text-red-600">{errors.description.message}</span>}</label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Kategori <span className="text-red-500">*</span></span><select {...register("categoryId")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <span className="mt-1 block text-xs text-red-600">{errors.categoryId.message}</span>}</label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Harga <span className="text-red-500">*</span></span><div className="relative"><span className="absolute left-3 top-2.5 text-sm text-slate-400">Rp</span><input {...register("price")} inputMode="decimal" placeholder="10000" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div>{errors.price && <span className="mt-1 block text-xs text-red-600">{errors.price.message}</span>}</label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Stok <span className="text-red-500">*</span></span><input type="number" min={0} step={1} {...register("stock", { valueAsNumber: true })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.stock && <span className="mt-1 block text-xs text-red-600">{errors.stock.message}</span>}</label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">URL gambar <span className="font-normal text-slate-400">(opsional)</span></span><input {...register("imageUrl")} type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.imageUrl && <span className="mt-1 block text-xs text-red-600">{errors.imageUrl.message}</span>}</label>
          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-3"><input {...register("isActive")} type="checkbox" className="size-4 accent-emerald-700" /><span><span className="block text-sm font-medium text-slate-700">Produk aktif</span><span className="block text-xs text-slate-400">Produk nonaktif tidak ditawarkan.</span></span></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button><Button disabled={isSubmitting || categories.length === 0}>{isSubmitting ? "Menyimpan..." : "Simpan produk"}</Button></div>
      </form>
    </Dialog>
  </>;
}
