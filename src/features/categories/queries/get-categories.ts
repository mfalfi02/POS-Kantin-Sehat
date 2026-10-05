import { db } from "@/lib/db";

export async function getCategories(search = "") {
  const term = search.trim();
  return db.category.findMany({
    where: term ? { OR: [{ name: { contains: term } }, { description: { contains: term } }] } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } }
  });
}
