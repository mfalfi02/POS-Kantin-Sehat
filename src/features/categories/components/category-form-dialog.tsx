"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { categorySchema, type CategoryInput } from "../schemas/category-schema";
import { createCategoryAction, updateCategoryAction } from "../actions/category-actions";

type CategoryValue = { id: string; name: string; description: string | null };

export function CategoryFormDialog({ category }: { category?: CategoryValue }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: { name: category?.name ?? "", description: category?.description ?? "" } });

  useEffect(() => { if (open) reset({ name: category?.name ?? "", description: category?.description ?? "" }); }, [open, category, reset]);

  async function submit(values: CategoryInput) {
    try {
      const result = category ? await updateCategoryAction(category.id, values) : await createCategoryAction(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => setError(field as keyof CategoryInput, { message: messages.join(" ") }));
        toast(result.message, "error");
        return;
      }
      toast(result.message);
      setOpen(false);
      router.refresh();
    } catch { toast("Kategori gagal disimpan. Periksa koneksi lalu coba lagi.", "error"); }
  }

  return <>
    {category ? <button type="button" onClick={() => setOpen(true)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Edit</button> : <Button type="button" onClick={() => setOpen(true)}><Plus size={16} />Tambah kategori</Button>}
    <Dialog open={open} onClose={() => setOpen(false)} title={category ? "Edit kategori" : "Tambah kategori"} description="Atur informasi kategori produk.">
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Nama kategori <span className="text-red-500">*</span></span><input {...register("name")} autoFocus maxLength={80} placeholder="Contoh: Makanan ringan" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}</label>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi <span className="font-normal text-slate-400">(opsional)</span></span><textarea {...register("description")} rows={3} maxLength={1000} placeholder="Keterangan singkat kategori" className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />{errors.description && <span className="mt-1 block text-xs text-red-600">{errors.description.message}</span>}</label>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button><Button disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan kategori"}</Button></div>
      </form>
    </Dialog>
  </>;
}
