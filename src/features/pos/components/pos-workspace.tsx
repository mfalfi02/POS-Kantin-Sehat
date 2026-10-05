"use client";

import { useMemo, useState } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { CartItem } from "./cart-item";
import { PaymentDialog, type CartLine } from "./payment-dialog";
import { ProductCard, type PosProduct } from "./product-card";
import { decimalToCents, formatCents } from "../utils/money";

export function PosWorkspace({ products }: { products: PosProduct[] }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const subtotalCents = useMemo(() => cart.reduce((sum, line) => sum + decimalToCents(line.product.price) * BigInt(line.quantity), BigInt(0)), [cart]);
  const discountValid = /^\d{1,10}(?:\.\d{1,2})?$/.test(discount.trim());
  let discountCents = BigInt(0);
  try { if (discountValid) discountCents = decimalToCents(discount); } catch { /* invalid input is shown below */ }
  const totalCents = subtotalCents >= discountCents ? subtotalCents - discountCents : BigInt(0);
  const cartQuantities = useMemo(() => new Map(cart.map((line) => [line.product.id, line.quantity])), [cart]);

  function add(product: PosProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing && existing.quantity >= product.stock) return current;
      if (existing) return current.map((line) => line.product.id === product.id ? { ...line, product, quantity: line.quantity + 1 } : line);
      if (product.stock < 1) return current;
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    setCart((current) => {
      if (quantity < 1) return current.filter((line) => line.product.id !== productId);
      return current.map((line) => {
        if (line.product.id !== productId) return line;
        return { ...line, quantity: Math.min(quantity, line.product.stock) };
      });
    });
  }

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
    <section><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Pilih produk</h2><p className="mt-1 text-xs text-slate-500">{products.length} produk ditampilkan · stok kosong tidak dapat ditambahkan</p></div></div>{products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} onAdd={add} quantityInCart={cartQuantities.get(product.id) ?? 0} />)}</div> : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><ShoppingCart className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-700">Produk tidak ditemukan</p><p className="mt-1 text-sm text-slate-400">Ubah kata pencarian atau filter kategori.</p></div></div>}</section>
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div className="flex items-center gap-2"><ShoppingCart size={18} className="text-emerald-700" /><h2 className="font-bold text-slate-900">Keranjang</h2><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{cart.reduce((sum, line) => sum + line.quantity, 0)}</span></div>{cart.length > 0 && <button type="button" onClick={() => setCart([])} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600"><Trash2 size={14} />Kosongkan</button>}</div>
      <div className="max-h-[42vh] overflow-y-auto px-4">{cart.length ? cart.map((line) => <CartItem key={line.product.id} product={line.product} quantity={line.quantity} onQuantity={(quantity) => changeQuantity(line.product.id, quantity)} onRemove={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))} />) : <div className="grid min-h-40 place-items-center text-center"><div><ShoppingCart className="mx-auto text-slate-300" size={25} /><p className="mt-2 text-sm font-medium text-slate-600">Keranjang masih kosong</p><p className="mt-1 text-xs text-slate-400">Pilih produk untuk memulai transaksi.</p></div></div>}</div>
      <div className="space-y-3 border-t border-slate-100 p-4"><div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span className="font-medium text-slate-700">{formatCents(subtotalCents)}</span></div><label className="flex items-center justify-between gap-3 text-sm text-slate-500"><span>Diskon</span><span className="relative w-36"><span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span><input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="decimal" disabled={!cart.length} aria-label="Diskon nominal" className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-right text-sm text-slate-700 outline-none focus:border-emerald-600 disabled:bg-slate-50" /></span></label>{!discountValid && <p className="text-right text-xs text-red-600">Masukkan diskon yang valid.</p>}{discountCents > subtotalCents && <p className="text-right text-xs text-red-600">Diskon tidak boleh melebihi subtotal.</p>}<div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(totalCents)}</span></div><button type="button" disabled={!cart.length || !discountValid || discountCents > subtotalCents} onClick={() => setPaymentOpen(true)} className="w-full rounded-lg bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Lanjut pembayaran</button></div>
    </aside>
    <PaymentDialog open={paymentOpen} onClose={() => setPaymentOpen(false)} lines={cart} discount={discount} onSuccess={() => setCart([])} onNewSale={() => { setDiscount("0"); }} />
  </div>;
}
