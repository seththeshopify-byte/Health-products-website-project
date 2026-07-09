import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, commissionEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { generatePromoCode } from "../lib/promoCode.js";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    promoCode: u.promoCode,
    referredByCode: u.referredByCode,
    createdAt: u.createdAt,
  };
}

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map(formatUser));
  } catch (err) {
    req.log.error({ err }, "listUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users — admin creates a member account with login credentials.
// There is no public self-registration; only an admin can provision accounts.
router.post("/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, referredByCode } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    let referrer = null;
    if (referredByCode) {
      const referrerRows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.promoCode, referredByCode));
      referrer = referrerRows[0] ?? null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let promoCode = generatePromoCode();
    let attempts = 0;
    while (attempts < 10) {
      const dup = await db.select().from(usersTable).where(eq(usersTable.promoCode, promoCode));
      if (dup.length === 0) break;
      promoCode = generatePromoCode();
      attempts++;
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role: role === "admin" ? "admin" : "member",
        promoCode,
        referredByCode: referrer ? referredByCode : null,
      })
      .returning();

    if (referrer) {
      const REFERRAL_COMMISSION = 2000; // flat referral bonus in NGN
      await db.insert(commissionEventsTable).values({
        referringMemberId: referrer.id,
        type: "referral",
        relatedId: user.id,
        amount: String(REFERRAL_COMMISSION),
        status: "pending",
      });
    }

    res.status(201).json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "createUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, role } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "updateUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
