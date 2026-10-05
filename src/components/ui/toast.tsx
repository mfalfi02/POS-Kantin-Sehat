"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastMessage = { id: number; message: string; tone: "success" | "error" };
type ToastContextValue = { toast: (message: string, tone?: ToastMessage["tone"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const toast = useCallback((message: string, tone: ToastMessage["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed right-4 top-4 z-[100] flex w-[min(400px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">{messages.map((item) => <div key={item.id} role="status" className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${item.tone === "success" ? "border-emerald-200" : "border-red-200"}`}><span className={item.tone === "success" ? "text-emerald-600" : "text-red-600"}>{item.tone === "success" ? <CheckCircle2 size={19} /> : <XCircle size={19} />}</span><p className="flex-1 text-sm text-slate-700">{item.message}</p><button aria-label="Tutup notifikasi" onClick={() => setMessages((current) => current.filter((toast) => toast.id !== item.id))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus digunakan di dalam ToastProvider.");
  return context;
}
