"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRupiah } from "@/lib/utils";

export function SalesChart({ data }: { data: { day: string; total: number; transactionCount: number }[] }) {
  return <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
    <CartesianGrid stroke="#edf0ee" vertical={false} />
    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a39a", fontSize: 12 }} />
    <YAxis yAxisId="revenue" hide />
    <YAxis yAxisId="transactions" orientation="right" hide allowDecimals={false} />
    <Tooltip formatter={(value, name) => name === "total" ? [formatRupiah(Number(value)), "Omzet"] : [`${Number(value)} transaksi`, "Transaksi"]} />
    <Legend formatter={(value) => value === "total" ? "Omzet" : "Transaksi"} />
    <Line yAxisId="revenue" type="monotone" dataKey="total" stroke="#12805c" strokeWidth={3} dot={{ fill: "#12805c", r: 4 }} />
    <Line yAxisId="transactions" type="monotone" dataKey="transactionCount" stroke="#e1a323" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#e1a323", r: 3 }} />
  </LineChart></ResponsiveContainer></div>;
}
