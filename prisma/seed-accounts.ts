/**
 * Seeds an Accounts user for SDM Academy.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("🔑 Seeding Accounts user...");

  const hashed = await bcrypt.hash("accounts123", 10);

  const user = await prisma.user.upsert({
    where: { phone: "9000000002" },
    update: {},
    create: {
      name: "Accounts Staff",
      phone: "9000000002",
      email: "accounts@sdmacademy.in",
      password: hashed,
      role: "ACCOUNTS",
    },
  });

  console.log(`✅ Accounts user created: ${user.name}`);
  console.log(`   Phone: 9000000002`);
  console.log(`   Password: accounts123`);
  console.log(`   Role: ${user.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
