import { Router } from "express";
import { db, menuItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
const router = Router();

function formatMenuItem(m: typeof menuItemsTable.$inferSelect) {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    imageUrl: m.imageUrl,
    imageUrls: m.imageUrls ?? [],
    type: m.type,
    category: m.category,
    guestPrice: Number(m.guestPrice),
    memberPrice: Number(m.memberPrice),
    commissionPct: Number(m.commissionPct),
    createdAt: m.createdAt,
  };
}

router.get("/menu-items", async (req, res) => {
  try {
    const { type } = req.query;
    const items = await db.select().from(menuItemsTable);
    const filtered =
      type === "food" || type === "drink"
        ? items.filter((i) => i.type === type)
        : items;
    res.json(filtered.map(formatMenuItem));
  } catch (err) {
    req.log.error({ err }, "listMenuItems error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/menu-items", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, imageUrls, type, category, guestPrice, memberPrice, commissionPct } = req.body;
    if (!name || !description || !type || !category || guestPrice == null || memberPrice == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (type !== "food" && type !== "drink") {
      res.status(400).json({ error: "type must be 'food' or 'drink'" });
      return;
    }
    const [item] = await db
      .insert(menuItemsTable)
      .values({
        name,
        description,
        imageUrl: imageUrl ?? (imageUrls?.[0] ?? null),
        imageUrls: imageUrls ?? [],
        type,
        category,
        guestPrice: String(guestPrice),
        memberPrice: String(memberPrice),
        commissionPct: String(commissionPct ?? 10),
      })
      .returning();
    res.status(201).json(formatMenuItem(item));
  } catch (err) {
    req.log.error({ err }, "createMenuItem error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/menu-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, id));
    if (!rows[0]) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.json(formatMenuItem(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getMenuItem error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, imageUrl, imageUrls, type, category, guestPrice, memberPrice, commissionPct } = req.body;
    if (type !== undefined && type !== "food" && type !== "drink") {
      res.status(400).json({ error: "type must be 'food' or 'drink'" });
      return;
    }
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (imageUrls !== undefined) {
      updates.imageUrls = imageUrls;
      if (imageUrl === undefined) updates.imageUrl = imageUrls[0] ?? null;
    }
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = category;
    if (guestPrice !== undefined) updates.guestPrice = String(guestPrice);
    if (memberPrice !== undefined) updates.memberPrice = String(memberPrice);
    if (commissionPct !== undefined) updates.commissionPct = String(commissionPct);
    const [item] = await db
      .update(menuItemsTable)
      .set(updates)
      .where(eq(menuItemsTable.id, id))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.json(formatMenuItem(item));
  } catch (err) {
    req.log.error({ err }, "updateMenuItem error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteMenuItem error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
