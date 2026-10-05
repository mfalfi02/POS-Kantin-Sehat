import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" };
export function Button({ className, variant = "primary", ...props }: Props) {
  const variants = { primary: "bg-emerald-700 text-white hover:bg-emerald-800", outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50", ghost: "text-slate-600 hover:bg-slate-100" };
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50", variants[variant], className)} {...props} />;
}
