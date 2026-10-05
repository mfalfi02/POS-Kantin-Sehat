import { Sidebar } from "@/components/dashboard/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <ToastProvider><div className="min-h-screen md:flex"><Sidebar user={user} /><div className="min-w-0 flex-1"><header className="hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8 md:flex"><p className="text-sm text-slate-500">Selamat datang kembali, <span className="font-semibold text-slate-800">{user.name}</span></p><div className="flex items-center gap-3"><span className="size-2 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500">Sistem aktif</span></div></header><main className="mx-auto w-full max-w-[1440px] p-4 md:p-8">{children}</main></div></div></ToastProvider>;
}
