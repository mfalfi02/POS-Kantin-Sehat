"use client";

import { useEffect, useState } from "react";

export function ProductImage({ src, name, size = "size-11" }: { src: string | null; name: string; size?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <span className={`grid ${size} shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm font-bold uppercase text-emerald-700`} aria-label={`Gambar ${name}`}>{name.trim().slice(0, 2) || "PR"}</span>;
  return <img src={src} alt={name} onError={() => setFailed(true)} className={`${size} shrink-0 rounded-lg border border-slate-100 object-cover`} />;
}
