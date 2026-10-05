"use client";

import { Bot, LoaderCircle, Send, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
const suggestions = ["Omzet hari ini?", "Produk terlaris minggu ini?", "Bandingkan minggu ini dan minggu lalu.", "Produk stok rendah?", "Kategori paling menghasilkan?"];

export function AssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function ask(value: string) {
    const text = value.trim();
    if (!text || pending) return;
    const history = messages.slice(-11).map((message) => ({ ...message, content: message.content.slice(-800) }));
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setQuestion("");
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history })
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "Sales Assistant tidak dapat menjawab saat ini.");
      setMessages((previous) => [...previous, { role: "assistant", content: payload.answer! }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return <section id="sales-assistant" className="scroll-mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100" aria-labelledby="sales-assistant-title">
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Sparkles size={19} /></span>
      <div><h2 id="sales-assistant-title" className="font-semibold text-slate-900">AI Sales Assistant</h2><p className="mt-1 text-xs text-slate-500">Tanya tentang penjualan dan operasional toko</p></div>
    </div>
    <div className="max-h-[420px] min-h-36 space-y-4 overflow-y-auto p-5" aria-live="polite">
      {!messages.length && <div className="space-y-4"><div className="flex gap-3 text-sm text-slate-600"><span className="mt-0.5 text-emerald-700"><Bot size={18} /></span><p>Halo! Saya dapat membantu menjawab pertanyaan berdasarkan data toko.</p></div><div className="flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} type="button" disabled={pending} onClick={() => void ask(item)} className="rounded-full border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50">{item}</button>)}</div></div>}
      {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`flex gap-3 text-sm ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${message.role === "user" ? "bg-emerald-700 text-white" : "bg-slate-50 text-slate-700"}`}>{message.content}</div><span className={`mt-2 shrink-0 ${message.role === "user" ? "order-first text-slate-400" : "text-emerald-700"}`}>{message.role === "user" ? <UserRound size={17} /> : <Bot size={18} />}</span></div>)}
      {pending && <div className="flex items-center gap-2 text-sm text-slate-500" role="status"><LoaderCircle size={16} className="animate-spin text-emerald-700" />Sedang memeriksa data toko...</div>}
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    </div>
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-100 p-4">
      <label className="sr-only" htmlFor="sales-assistant-question">Pertanyaan untuk AI Sales Assistant</label>
      <textarea id="sales-assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(question); } }} maxLength={2000} rows={2} placeholder="Tulis pertanyaan tentang penjualan..." className="min-h-11 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      <button type="submit" disabled={pending || !question.trim()} aria-label="Kirim pertanyaan" className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><Send size={17} /></button>
    </form>
    <p className="px-5 pb-3 text-[11px] text-slate-400">Jawaban analisis menggunakan data transaksi yang tersedia di database.</p>
  </section>;
}
