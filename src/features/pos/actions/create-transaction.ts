"use server";

import { getSession } from "@/lib/auth/session";
import { createTransactionForUser, type TransactionResult } from "../services/checkout";

export async function createTransactionAction(input: unknown): Promise<TransactionResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sesi Anda berakhir. Silakan masuk kembali." };
  return createTransactionForUser(session.id, input);
}
