import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
const router = Router();
router.get("/events", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable);
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "listEvents error");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/events", requireAdmin, async (req, res) => {
  try {
    const { title, description, imageUrl, location, eventDate } = req.body;
    if (!title || !eventDate) { res.status(400).json({ error: "Missing required fields" }); return; }
    const [e] = await db.insert(eventsTable).values({ title, description: description ?? null, imageUrl: imageUrl ?? null, location: location ?? null, eventDate: new Date(eventDate) }).returning();
    res.status(201).json(e);
  } catch (err) {
    req.log.error({ err }, "createEvent error");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.patch("/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, imageUrl, location, eventDate } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (location !== undefined) updates.location = location;
    if (eventDate !== undefined) updates.eventDate = new Date(eventDate);
    const [e] = await db.update(eventsTable).set(updates).where(eq(eventsTable.id, id)).returning();
    if (!e) { res.status(404).json({ error: "Not found" }); return; }
    res.json(e);
  } catch (err) {
    req.log.error({ err }, "updateEvent error");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.delete("/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteEvent error");
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
