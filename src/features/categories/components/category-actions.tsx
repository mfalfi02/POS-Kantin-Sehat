"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteCategoryAction } from "../actions/category-actions";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoryActions({ category }: { category: { id: string; name: string; description: string | null } }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function remove() {
    setPending(true);
    try {
      const result = await deleteCategoryAction(category.id);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) { setConfirming(false); router.refresh(); }
    } catch { toast("Kategori gagal dihapus. Silakan coba lagi.", "error"); }
    finally { setPending(false); }
  }

  return <div className="flex items-center justify-end gap-1"><CategoryFormDialog category={category} /><button type="button" onClick={() => setConfirming(true)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button><ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={remove} pending={pending} title="Hapus kategori?" description={`Kategori “${category.name}” hanya bisa dihapus jika belum digunakan oleh produk.`} /></div>;
}
