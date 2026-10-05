import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an admin user.");
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { name: process.env.SEED_ADMIN_NAME ?? "Administrator", email: email.toLowerCase(), passwordHash: await hash(password, 12), role: UserRole.ADMIN }
  });
  console.log(`Admin account ready for ${email.toLowerCase()}`);
}

main().finally(() => prisma.$disconnect());
