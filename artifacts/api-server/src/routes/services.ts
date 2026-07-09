import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function formatService(s: typeof servicesTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    imageUrl: s.imageUrl,
    guestPrice: Number(s.guestPrice),
    memberPrice: Number(s.memberPrice),
    commissionPct: Number(s.commissionPct),
    createdAt: s.createdAt,
  };
}

router.get("/services", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    res.json(services.map(formatService));
  } catch (err) {
    req.log.error({ err }, "listServices error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/services", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, guestPrice, memberPrice, commissionPct } = req.body;
    if (!name || !description || guestPrice == null || memberPrice == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [service] = await db
      .insert(servicesTable)
      .values({
        name,
        description,
        imageUrl: imageUrl ?? null,
        guestPrice: String(guestPrice),
        memberPrice: String(memberPrice),
        commissionPct: String(commissionPct ?? 10),
      })
      .returning();
    res.status(201).json(formatService(service));
  } catch (err) {
    req.log.error({ err }, "createService error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Service not found" }); return; }
    res.json(formatService(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getService error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/services/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, imageUrl, guestPrice, memberPrice, commissionPct } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (guestPrice !== undefined) updates.guestPrice = String(guestPrice);
    if (memberPrice !== undefined) updates.memberPrice = String(memberPrice);
    if (commissionPct !== undefined) updates.commissionPct = String(commissionPct);
    const [service] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
    if (!service) { res.status(404).json({ error: "Service not found" }); return; }
    res.json(formatService(service));
  } catch (err) {
    req.log.error({ err }, "updateService error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/services/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteService error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
