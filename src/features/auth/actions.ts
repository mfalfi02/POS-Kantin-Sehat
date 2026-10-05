"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema } from "./schemas";

export type AuthState = { error?: string };

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Email atau kata sandi tidak valid." };
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive || !(await compare(parsed.data.password, user.passwordHash))) return { error: "Email atau kata sandi salah." };
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
