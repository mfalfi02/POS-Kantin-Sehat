import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "warung_session";
const secret = process.env.AUTH_SECRET;
if (!secret || new TextEncoder().encode(secret).length < 32) {
  throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
}
const key = new TextEncoder().encode(secret);

export type SessionUser = { id: string; name: string; email: string; role: "ADMIN" | "CASHIER" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(key);
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.sub !== "string") return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    if (!user || !user.isActive) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch { return null; }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}
