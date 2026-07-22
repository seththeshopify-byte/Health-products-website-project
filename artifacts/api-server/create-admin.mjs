// One-time script to create the first admin account.
// Run this from inside artifacts/api-server, with DATABASE_URL set.
// Usage: node create-admin.mjs

import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";

const ADMIN_NAME = "Seth";
const ADMIN_EMAIL = "seth.theshopify@gmail.com"; // change if you want a different admin email
const ADMIN_PASSWORD = "RuthHealth"; // change this to your own password before running

function generatePromoCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const promoCode = generatePromoCode();

  const [user] = await db
    .insert(usersTable)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      promoCode,
    })
    .returning();

  console.log("Admin account created:");
  console.log("  Email:", user.email);
  console.log("  Password:", ADMIN_PASSWORD, "(the one you set in this script)");
  console.log("  Role:", user.role);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
