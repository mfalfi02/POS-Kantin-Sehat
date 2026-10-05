"use client";

import { Plus } from "lucide-react";
import { ProductImage } from "@/features/products/components/product-image";
import { formatCents, decimalToCents } from "../utils/money";

export type PosProduct = { id: string; sku: string; name: string; price: string; stock: number; imageUrl: string | null; category: { id: string; name: string } };

export function ProductCard({ product, onAdd, quantityInCart }: { product: PosProduct; onAdd: (product: PosProduct) => void; quantityInCart: number }) {
  const outOfStock = product.stock <= 0;
  const limitReached = quantityInCart >= product.stock;
  return <article className={`overflow-hidden rounded-xl border bg-white transition ${outOfStock ? "border-slate-200 opacity-75" : "border-slate-200 hover:border-emerald-300 hover:shadow-md"}`}>
    <div className="relative grid h-32 place-items-center bg-slate-50"><ProductImage src={product.imageUrl} name={product.name} size="size-20" />{outOfStock && <span className="absolute right-2 top-2 rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-700">Habis</span>}</div>
    <div className="p-3"><p className="truncate text-sm font-semibold text-slate-800" title={product.name}>{product.name}</p><p className="mt-0.5 truncate text-xs text-slate-400">{product.category.name}</p><div className="mt-3 flex items-end justify-between gap-2"><div><p className="text-sm font-bold text-emerald-800">{formatCents(decimalToCents(product.price))}</p><p className={`mt-0.5 text-[11px] ${outOfStock ? "font-semibold text-red-600" : "text-slate-400"}`}>{outOfStock ? "Stok habis" : `Stok ${product.stock}`}</p></div><button type="button" disabled={outOfStock || limitReached} onClick={() => onAdd(product)} aria-label={`Tambah ${product.name}`} className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><Plus size={18} /></button></div></div>
  </article>;
}
