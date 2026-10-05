import { z } from "zod";

const moneyString = z.string().trim().max(13).regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Masukkan nominal uang yang valid.");

export const transactionSchema = z.object({
  items: z.array(z.object({ productId: z.string().cuid(), quantity: z.number().int().min(1).max(10000) })).min(1, "Keranjang masih kosong.").max(100),
  discount: moneyString,
  paidAmount: moneyString,
  paymentMethod: z.literal("CASH")
}).superRefine((value, context) => {
  const itemIds = value.items.map((item) => item.productId);
  if (new Set(itemIds).size !== itemIds.length) context.addIssue({ code: "custom", path: ["items"], message: "Produk duplikat dalam keranjang tidak valid." });
});

export type CreateTransactionInput = z.infer<typeof transactionSchema>;
