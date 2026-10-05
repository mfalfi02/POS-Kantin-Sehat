import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(80, "Nama kategori maksimal 80 karakter."),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter.")
});

export const categoryIdSchema = z.string().cuid("Kategori tidak valid.");
export type CategoryInput = z.infer<typeof categorySchema>;
