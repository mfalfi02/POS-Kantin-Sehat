"use client";

import { useActionState } from "react";
import { LockKeyhole, Store } from "lucide-react";
import { loginAction, type AuthState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return <main className="grid min-h-screen place-items-center bg-[#f5f7f5] p-4"><div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
    <div className="mb-8 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-emerald-700 text-white"><Store size={23} /></div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke Warung POS</h1><p className="mt-2 text-sm text-slate-500">Kelola toko dan transaksi Anda dengan mudah.</p></div>
    <form action={action} className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span><input name="email" type="email" autoComplete="username" required placeholder="nama@warung.id" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Kata sandi</span><div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-3 text-slate-400" /><input name="password" type="password" autoComplete="current-password" required placeholder="Masukkan kata sandi" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div></label>{state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}<Button className="w-full py-2.5" disabled={pending}>{pending ? "Memproses..." : "Masuk"}</Button></form>
    <p className="mt-6 text-center text-xs leading-5 text-slate-400">Akun pengguna dibuat oleh administrator. Hubungi admin jika Anda belum memiliki akses.</p>
  </div></main>;
}
