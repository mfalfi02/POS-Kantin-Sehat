import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function getPosProducts({ search, categoryId }: { search?: string; categoryId?: string }) {
  const term = search?.trim().slice(0, 100);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(term ? { name: { contains: term } } : {}),
    ...(categoryId ? { categoryId } : {})
  };
  const [products, categories] = await Promise.all([
    db.product.findMany({ where, select: { id: true, sku: true, name: true, price: true, stock: true, imageUrl: true, category: { select: { id: true, name: true } } }, orderBy: { name: "asc" }, take: 60 }),
    db.category.findMany({ where: { products: { some: { isActive: true } } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);
  return { products, categories };
}
