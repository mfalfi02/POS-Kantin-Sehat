"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteProductAction } from "../actions/product-actions";
import { ProductFormDialog } from "./product-form-dialog";

type ProductRow = { id: string; name: string; description: string | null; categoryId: string; price: string; stock: number; imageUrl: string | null; isActive: boolean };
type CategoryOption = { id: string; name: string };

export function ProductActions({ product, categories }: { product: ProductRow; categories: CategoryOption[] }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function remove() {
    setPending(true);
    try {
      const result = await deleteProductAction(product.id);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) { setConfirming(false); router.refresh(); }
    } catch { toast("Produk gagal dihapus. Silakan coba lagi.", "error"); }
    finally { setPending(false); }
  }

  return <div className="flex items-center justify-end gap-1"><ProductFormDialog product={product} categories={categories} /><button type="button" onClick={() => setConfirming(true)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button><ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={remove} pending={pending} title="Hapus produk?" description={`Produk “${product.name}” yang sudah digunakan dalam transaksi tidak dapat dihapus.`} /></div>;
}
