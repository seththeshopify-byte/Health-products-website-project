import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    guestPrice: Number(p.guestPrice),
    memberPrice: Number(p.memberPrice),
    commissionPct: Number(p.commissionPct),
    createdAt: p.createdAt,
  };
}

// GET /products
router.get("/products", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error({ err }, "listProducts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/products", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, guestPrice, memberPrice, commissionPct } = req.body;
    if (!name || !description || guestPrice == null || memberPrice == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [product] = await db
      .insert(productsTable)
      .values({
        name,
        description,
        imageUrl: imageUrl ?? null,
        guestPrice: String(guestPrice),
        memberPrice: String(memberPrice),
        commissionPct: String(commissionPct ?? 10),
      })
      .returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "createProduct error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!rows[0]) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(formatProduct(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getProduct error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/products/:id", requireAdmin, async (req, res) => {
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
    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "updateProduct error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteProduct error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
