import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await db.select().from(testimonialsTable);
    res.json(testimonials);
  } catch (err) {
    req.log.error({ err }, "listTestimonials error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/testimonials", requireAdmin, async (req, res) => {
  try {
    const { name, photoUrl, text } = req.body;
    if (!name || !text) { res.status(400).json({ error: "Missing required fields" }); return; }
    const [t] = await db.insert(testimonialsTable).values({ name, photoUrl: photoUrl ?? null, text }).returning();
    res.status(201).json(t);
  } catch (err) {
    req.log.error({ err }, "createTestimonial error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, photoUrl, text } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (text !== undefined) updates.text = text;
    const [t] = await db.update(testimonialsTable).set(updates).where(eq(testimonialsTable.id, id)).returning();
    if (!t) { res.status(404).json({ error: "Not found" }); return; }
    res.json(t);
  } catch (err) {
    req.log.error({ err }, "updateTestimonial error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteTestimonial error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
