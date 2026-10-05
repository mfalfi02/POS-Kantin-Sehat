import Link from "next/link";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Sparkles, Tags, Wallet } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import type { SessionUser } from "@/lib/auth/session";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir / POS", icon: Wallet },
  { href: "/products", label: "Produk", icon: Boxes },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/transactions", label: "Transaksi", icon: ClipboardList },
  { href: "/dashboard#sales-assistant", label: "AI Assistant", icon: Sparkles }
];

export function Sidebar({ user }: { user: SessionUser }) {
  return <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white px-4 py-4 md:min-h-screen md:w-[250px] md:border-b-0 md:border-r md:px-5 md:py-6">
    <div className="mb-4 flex items-center justify-between md:mb-10"><Link href="/dashboard" className="flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-lg font-bold text-white">W</span><span><strong className="block text-[15px]">Warung POS</strong><small className="text-slate-400">Sistem kasir</small></span></Link><form action={logoutAction} className="md:hidden"><button aria-label="Keluar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><LogOut size={18} /></button></form></div>
    <nav className="flex gap-1 overflow-x-auto md:flex-col">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${href === "/dashboard" ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon size={18} />{label}</Link>)}</nav>
    <div className="mt-auto hidden border-t border-slate-100 pt-4 md:block"><div className="mb-3 px-3"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-400">{user.role === "ADMIN" ? "Administrator" : "Kasir"}</p></div><form action={logoutAction}><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><LogOut size={17} />Keluar</button></form></div>
  </aside>;
}
