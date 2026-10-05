"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getFieldErrors, type MutationResult } from "@/lib/action-result";
import { normalizeProductImageUrl } from "../image-service";
import { productIdSchema, productSchema } from "../schemas/product-schema";

async function adminError(): Promise<string | null> {
  const user = await getSession();
  if (!user) return "Sesi Anda berakhir. Silakan masuk kembali.";
  if (user.role !== "ADMIN") return "Hanya admin yang dapat mengubah data produk.";
  return null;
}

function safeError(): MutationResult {
  return { ok: false, message: "Produk gagal disimpan. Silakan periksa data dan coba lagi." };
}

export async function createProductAction(input: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian produk.", fieldErrors: getFieldErrors(parsed.error) };
  try {
    const data = parsed.data;
    const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) return { ok: false, message: "Kategori yang dipilih tidak ditemukan.", fieldErrors: { categoryId: ["Pilih kategori yang tersedia."] } };
    await db.product.create({ data: {
      sku: `PRD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      price: new Prisma.Decimal(data.price),
      stock: data.stock,
      imageUrl: normalizeProductImageUrl(data.imageUrl),
      isActive: data.isActive
    } });
    return { ok: true, message: "Produk berhasil ditambahkan." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { ok: false, message: "Kategori tidak lagi tersedia. Muat ulang halaman lalu coba lagi.", fieldErrors: { categoryId: ["Pilih kategori yang tersedia."] } };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "Kode produk bertabrakan. Silakan coba lagi." };
    return safeError();
  }
}

export async function updateProductAction(id: unknown, input: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const validId = productIdSchema.safeParse(id);
  const parsed = productSchema.safeParse(input);
  if (!validId.success) return { ok: false, message: "Produk tidak valid." };
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian produk.", fieldErrors: getFieldErrors(parsed.error) };
  try {
    const data = parsed.data;
    const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) return { ok: false, message: "Kategori yang dipilih tidak ditemukan.", fieldErrors: { categoryId: ["Pilih kategori yang tersedia."] } };
    await db.product.update({ where: { id: validId.data }, data: {
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      price: new Prisma.Decimal(data.price),
      stock: data.stock,
      imageUrl: normalizeProductImageUrl(data.imageUrl),
      isActive: data.isActive
    } });
    return { ok: true, message: "Produk berhasil diperbarui." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { ok: false, message: "Produk tidak ditemukan." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { ok: false, message: "Kategori tidak lagi tersedia.", fieldErrors: { categoryId: ["Pilih kategori yang tersedia."] } };
    return safeError();
  }
}

export async function deleteProductAction(id: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const validId = productIdSchema.safeParse(id);
  if (!validId.success) return { ok: false, message: "Produk tidak valid." };
  try {
    const transactionCount = await db.transactionItem.count({ where: { productId: validId.data } });
    if (transactionCount > 0) return { ok: false, message: "Produk tidak dapat dihapus karena sudah tercatat dalam transaksi. Nonaktifkan produk jika tidak lagi dijual." };
    await db.product.delete({ where: { id: validId.data } });
    return { ok: true, message: "Produk berhasil dihapus." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { ok: false, message: "Produk tidak dapat dihapus karena sudah tercatat dalam transaksi. Nonaktifkan produk jika tidak lagi dijual." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { ok: false, message: "Produk tidak ditemukan." };
    return { ok: false, message: "Produk gagal dihapus. Silakan coba lagi." };
  }
}
