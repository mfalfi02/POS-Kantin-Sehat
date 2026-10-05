import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const PAGE_SIZE = 10;

export type ProductFilters = { search?: string; categoryId?: string; status?: "active" | "inactive"; page?: number };

export async function getProductPage(filters: ProductFilters) {
  const page = Math.min(1_000_000, Math.max(1, Math.floor(filters.page ?? 1)));
  const search = filters.search?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { isActive: filters.status === "active" } : {})
  };
  const [products, total, categories] = await Promise.all([
    db.product.findMany({ where, include: { category: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.product.count({ where }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);
  return { products, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), categories };
}
