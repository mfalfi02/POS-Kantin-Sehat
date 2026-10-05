"use client";

import { X } from "lucide-react";

export function Dialog({ open, onClose, title, description, children, width = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid items-center justify-center overflow-y-auto bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`my-auto w-full ${width} rounded-2xl bg-white shadow-2xl`}>
      <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><button type="button" onClick={onClose} aria-label="Tutup dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button></header>
      <div className="p-6">{children}</div>
    </section>
  </div>;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, pending = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; pending?: boolean;
}) {
  return <Dialog open={open} onClose={onClose} title={title} description={description} width="max-w-md"><div className="flex justify-end gap-2"><button type="button" disabled={pending} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button><button type="button" disabled={pending} onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{pending ? "Menghapus..." : "Hapus"}</button></div></Dialog>;
}
