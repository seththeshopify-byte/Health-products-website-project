import { Router } from "express";
import { db, commissionEventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/commission", requireAuth, async (req, res) => {
  try {
    let events;
    if (req.user!.role === "admin") {
      events = await db.select().from(commissionEventsTable);
    } else {
      events = await db.select().from(commissionEventsTable).where(eq(commissionEventsTable.referringMemberId, req.user!.userId));
    }

    // Enrich with member names
    const memberIds = [...new Set(events.map((e) => e.referringMemberId))];
    const members = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    res.json(events.map((e) => ({
      ...e,
      amount: Number(e.amount),
      referringMemberName: memberMap.get(e.referringMemberId) ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "listCommissionEvents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/commission/:id/mark-paid", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db.update(commissionEventsTable).set({ status: "paid" }).where(eq(commissionEventsTable.id, id)).returning();
    if (!event) { res.status(404).json({ error: "Commission event not found" }); return; }
    const members = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    const memberMap = new Map(members.map((m) => [m.id, m.name]));
    res.json({ ...event, amount: Number(event.amount), referringMemberName: memberMap.get(event.referringMemberId) ?? null });
  } catch (err) {
    req.log.error({ err }, "markCommissionPaid error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
