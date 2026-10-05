"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getFieldErrors, type MutationResult } from "@/lib/action-result";
import { categoryIdSchema, categorySchema } from "../schemas/category-schema";

async function adminError(): Promise<string | null> {
  const user = await getSession();
  if (!user) return "Sesi Anda berakhir. Silakan masuk kembali.";
  if (user.role !== "ADMIN") return "Hanya admin yang dapat mengubah data kategori.";
  return null;
}

function makeSlug(name: string) {
  const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kategori";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function createCategoryAction(input: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian kategori.", fieldErrors: getFieldErrors(parsed.error) };
  try {
    await db.category.create({ data: { ...parsed.data, description: parsed.data.description || null, slug: makeSlug(parsed.data.name) } });
    return { ok: true, message: "Kategori berhasil ditambahkan." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "Nama kategori sudah digunakan.", fieldErrors: { name: ["Gunakan nama kategori lain."] } };
    return { ok: false, message: "Kategori gagal disimpan. Silakan coba lagi." };
  }
}

export async function updateCategoryAction(id: unknown, input: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const validId = categoryIdSchema.safeParse(id);
  const parsed = categorySchema.safeParse(input);
  if (!validId.success) return { ok: false, message: "Kategori tidak valid." };
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian kategori.", fieldErrors: getFieldErrors(parsed.error) };
  try {
    await db.category.update({ where: { id: validId.data }, data: { ...parsed.data, description: parsed.data.description || null } });
    return { ok: true, message: "Kategori berhasil diperbarui." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "Nama kategori sudah digunakan.", fieldErrors: { name: ["Gunakan nama kategori lain."] } };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { ok: false, message: "Kategori tidak ditemukan." };
    return { ok: false, message: "Kategori gagal diperbarui. Silakan coba lagi." };
  }
}

export async function deleteCategoryAction(id: unknown): Promise<MutationResult> {
  const denied = await adminError();
  if (denied) return { ok: false, message: denied };
  const validId = categoryIdSchema.safeParse(id);
  if (!validId.success) return { ok: false, message: "Kategori tidak valid." };
  try {
    const linkedProducts = await db.product.count({ where: { categoryId: validId.data } });
    if (linkedProducts > 0) return { ok: false, message: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa produk." };
    await db.category.delete({ where: { id: validId.data } });
    return { ok: true, message: "Kategori berhasil dihapus." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { ok: false, message: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa produk." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { ok: false, message: "Kategori tidak ditemukan." };
    return { ok: false, message: "Kategori gagal dihapus. Silakan coba lagi." };
  }
}
