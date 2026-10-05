"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { decimalToCents, formatCents } from "../utils/money";
import type { PosProduct } from "./product-card";

export function CartItem({ product, quantity, onQuantity, onRemove }: { product: PosProduct; quantity: number; onQuantity: (quantity: number) => void; onRemove: () => void }) {
  return <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="mt-0.5 text-xs text-slate-400">{formatCents(decimalToCents(product.price))} / item</p><div className="mt-2 inline-flex items-center rounded-lg border border-slate-200"><button type="button" aria-label="Kurangi jumlah" onClick={() => onQuantity(quantity - 1)} className="grid size-7 place-items-center text-slate-600 hover:bg-slate-50"><Minus size={13} /></button><span className="min-w-8 text-center text-xs font-semibold">{quantity}</span><button type="button" aria-label="Tambah jumlah" disabled={quantity >= product.stock} onClick={() => onQuantity(quantity + 1)} className="grid size-7 place-items-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"><Plus size={13} /></button></div></div><div className="flex flex-col items-end justify-between"><span className="text-sm font-bold text-slate-800">{formatCents(decimalToCents(product.price) * BigInt(quantity))}</span><button type="button" aria-label={`Hapus ${product.name}`} onClick={onRemove} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div>;
}
