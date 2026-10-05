# Warung POS

Aplikasi POS berbasis Next.js App Router, TypeScript, Tailwind CSS, Prisma, dan MySQL. Fondasi saat ini mencakup skema data inti, autentikasi role admin/kasir, dan dashboard dengan query server-side.

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL`, `AUTH_SECRET` (minimal 32 karakter acak), serta kredensial admin awal.
2. Untuk Sales Assistant, isi `GEMINI_API_KEY` pada `.env`. `AI_MODEL` opsional dan default-nya `gemini-2.5-flash-lite`. Jangan gunakan prefix `NEXT_PUBLIC_` untuk API key.

## Progressive Web App

Aplikasi dapat dipasang dari browser yang mendukung PWA. Jalankan `npm run dev`, buka aplikasi di `http://localhost:3000`, lalu pilih **Install app** dari menu browser. Service worker hanya menyediakan halaman offline; halaman aplikasi, sesi, API, dan data transaksi tidak disimpan untuk akses offline. Transaksi tetap membutuhkan koneksi internet.
3. Pasang dependensi dengan `npm install`.
4. Buat client dan migrasi database: `npm run db:generate` lalu `npm run db:migrate`.
5. Buat akun admin awal dengan `npm run db:seed`.
6. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Struktur

- `src/app`: route, layout, dan halaman App Router.
- `src/components`: komponen UI dan dashboard.
- `src/features`: modul domain (auth, dashboard) beserta action, schema, dan query.
- `src/lib`: Prisma client, session/authorization, dan helper.
- `prisma`: schema dan seed database.

Fondasi AI menggunakan Gemini API melalui SDK resmi `@google/genai`, hanya di server. Endpoint `POST /api/ai/assistant` memerlukan session yang valid dan menerima `{ "question": "..." }`; endpoint ini belum memiliki UI chat. Model hanya dapat memanggil allowlist reporting Phase 5. Rate limiting khusus endpoint AI belum tersedia; ukuran request dan jumlah tool call per jawaban dibatasi.

Semua perubahan data dan akses query bisnis selanjutnya harus divalidasi pada server. Proses checkout perlu memakai Prisma interactive transaction dan conditional stock decrement agar stok tidak dapat negatif.
