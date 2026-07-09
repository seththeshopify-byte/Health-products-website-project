import { Router } from "express";
import { db, shippingZonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function formatZone(z: typeof shippingZonesTable.$inferSelect) {
  return {
    id: z.id,
    country: z.country,
    regionOrPostalPrefix: z.regionOrPostalPrefix,
    feeAmount: Number(z.feeAmount),
    isFree: z.isFree,
  };
}

router.get("/shipping-zones", async (req, res) => {
  try {
    const zones = await db.select().from(shippingZonesTable);
    res.json(zones.map(formatZone));
  } catch (err) {
    req.log.error({ err }, "listShippingZones error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shipping-zones", requireAdmin, async (req, res) => {
  try {
    const { country, regionOrPostalPrefix, feeAmount, isFree } = req.body;
    if (!country) { res.status(400).json({ error: "country is required" }); return; }
    const [zone] = await db.insert(shippingZonesTable).values({
      country,
      regionOrPostalPrefix: regionOrPostalPrefix ?? null,
      feeAmount: String(feeAmount ?? 0),
      isFree: isFree ?? false,
    }).returning();
    res.status(201).json(formatZone(zone));
  } catch (err) {
    req.log.error({ err }, "createShippingZone error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/shipping-zones/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { country, regionOrPostalPrefix, feeAmount, isFree } = req.body;
    const updates: Record<string, unknown> = {};
    if (country !== undefined) updates.country = country;
    if (regionOrPostalPrefix !== undefined) updates.regionOrPostalPrefix = regionOrPostalPrefix;
    if (feeAmount !== undefined) updates.feeAmount = String(feeAmount);
    if (isFree !== undefined) updates.isFree = isFree;
    const [zone] = await db.update(shippingZonesTable).set(updates).where(eq(shippingZonesTable.id, id)).returning();
    if (!zone) { res.status(404).json({ error: "Zone not found" }); return; }
    res.json(formatZone(zone));
  } catch (err) {
    req.log.error({ err }, "updateShippingZone error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/shipping-zones/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(shippingZonesTable).where(eq(shippingZonesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteShippingZone error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
