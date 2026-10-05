"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Printer } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createTransactionAction } from "../actions/create-transaction";
import { centsToDecimal, decimalToCents, formatCents } from "../utils/money";
import { Receipt, type CompletedTransaction } from "./receipt";
import type { PosProduct } from "./product-card";

export type CartLine = { product: PosProduct; quantity: number };

export function PaymentDialog({ open, onClose, lines, discount, onSuccess, onNewSale }: {
  open: boolean; onClose: () => void; lines: CartLine[]; discount: string; onSuccess: () => void; onNewSale: () => void;
}) {
  const { toast } = useToast();
  const [paidAmount, setPaidAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<CompletedTransaction | null>(null);
  const subtotalCents = useMemo(() => lines.reduce((sum, line) => sum + decimalToCents(line.product.price) * BigInt(line.quantity), BigInt(0)), [lines]);
  const discountCents = useMemo(() => { try { return decimalToCents(discount); } catch { return BigInt(0); } }, [discount]);
  const totalCents = subtotalCents > discountCents ? subtotalCents - discountCents : BigInt(0);
  const amountCents = useMemo(() => { try { return decimalToCents(paidAmount); } catch { return BigInt(0); } }, [paidAmount]);

  useEffect(() => {
    if (open) { setCompleted(null); setPaidAmount(centsToDecimal(totalCents)); }
  }, [open, totalCents]);

  async function pay() {
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(paidAmount.trim())) { toast("Masukkan jumlah pembayaran yang valid.", "error"); return; }
    if (discountCents > subtotalCents) { toast("Diskon tidak boleh melebihi subtotal.", "error"); return; }
    if (amountCents < totalCents) { toast(`Pembayaran kurang ${formatCents(totalCents - amountCents)}.`, "error"); return; }
    setPending(true);
    try {
      const result = await createTransactionAction({ items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })), discount, paidAmount, paymentMethod: "CASH" });
      if (!result.ok) { toast(result.message, "error"); return; }
      setCompleted(result.transaction);
      onSuccess();
    } catch { toast("Transaksi gagal diproses. Periksa koneksi lalu coba lagi.", "error"); }
    finally { setPending(false); }
  }

  function newSale() { setCompleted(null); onClose(); onNewSale(); }

  return <Dialog open={open} onClose={onClose} title={completed ? "Transaksi berhasil" : "Pembayaran tunai"} description={completed ? "Transaksi sudah tersimpan dan stok telah diperbarui." : "Periksa total dan masukkan uang yang diterima."} width="max-w-md">
    {completed ? <div><div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><Check size={18} />Transaksi berhasil · {completed.invoiceNumber}</div><div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200"><Receipt transaction={completed} /></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Printer size={16} />Cetak struk</button><button type="button" onClick={newSale} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Transaksi baru</button></div></div> : <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Subtotal</span><span>{formatCents(subtotalCents)}</span></div><div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Diskon</span><span>{formatCents(discountCents)}</span></div><div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{formatCents(totalCents)}</span></div></div>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Uang diterima</span><div className="relative"><span className="absolute left-3 top-3 text-sm font-medium text-slate-400">Rp</span><input autoFocus inputMode="decimal" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-lg font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div></label>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPaidAmount(centsToDecimal(totalCents))} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">Uang pas</button>{[BigInt(2000000), BigInt(5000000), BigInt(10000000)].map((amount) => <button key={amount.toString()} type="button" onClick={() => setPaidAmount(centsToDecimal(amount))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">{formatCents(amount)}</button>)}</div>
      <div className="flex justify-between rounded-lg border border-slate-100 px-3 py-3 text-sm"><span className="text-slate-500">Kembalian</span><span className={`font-bold ${amountCents >= totalCents ? "text-emerald-700" : "text-red-600"}`}>{amountCents >= totalCents ? formatCents(amountCents - totalCents) : `Kurang ${formatCents(totalCents - amountCents)}`}</span></div>
      <button type="button" onClick={pay} disabled={pending || !lines.length} className="w-full rounded-lg bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Memproses pembayaran..." : "Bayar dan simpan transaksi"}</button>
    </div>}
  </Dialog>;
}
