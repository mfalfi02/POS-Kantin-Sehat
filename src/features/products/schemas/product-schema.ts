import { z } from "zod";

const priceSchema = z.string().trim()
  .min(1, "Harga wajib diisi.")
  .max(13, "Harga melebihi batas yang didukung.")
  .regex(/^\d+(?:\.\d{1,2})?$/, "Masukkan harga positif dengan maksimal dua angka desimal.")
  .refine((value) => value.split(".")[0].replace(/^0+(?=\d)/, "").length <= 10, "Harga melebihi batas yang didukung.");

const imageUrlSchema = z.string().trim().max(2048, "URL gambar terlalu panjang.").refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}, "URL gambar harus menggunakan http atau https.");

export const productSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(120, "Nama produk maksimal 120 karakter."),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter."),
  categoryId: z.string().cuid("Pilih kategori yang valid."),
  price: priceSchema,
  stock: z.number().int("Stok harus berupa bilangan bulat.").min(0, "Stok tidak boleh negatif.").max(2147483647, "Stok terlalu besar."),
  imageUrl: imageUrlSchema,
  isActive: z.boolean()
});

export const productIdSchema = z.string().cuid("Produk tidak valid.");
export type ProductInput = z.infer<typeof productSchema>;
