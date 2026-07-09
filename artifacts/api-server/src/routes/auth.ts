import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

// Public self-registration is intentionally not offered. Member accounts are
// created by an admin (see POST /users), who sets the member's login
// credentials directly.

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        promoCode: user.promoCode,
        referredByCode: user.referredByCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      promoCode: user.promoCode,
      referredByCode: user.referredByCode,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "getMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
