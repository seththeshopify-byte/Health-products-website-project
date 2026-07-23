import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

const mediaList = (value: unknown, legacy?: string | null) => {
  const values = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  return [...new Set(legacy ? [legacy, ...values] : values)];
};

const withMedia = (event: any) => ({
  ...event,
  imageUrls: mediaList(event.imageUrls, event.imageUrl),
  videoUrls: mediaList(event.videoUrls),
});

router.get("/events", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable);
    res.json(events.map(withMedia));
  } catch (err) {
    req.log.error({ err }, "listEvents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events", requireAdmin, async (req, res) => {
  try {
    const { title, description, imageUrl, imageUrls, videoUrls, location, eventDate } = req.body;
    if (!title || !eventDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const images = mediaList(imageUrls, imageUrl);
    const videos = mediaList(videoUrls);
    const [event] = await db.insert(eventsTable).values({
      title,
      description: description ?? null,
      imageUrl: images[0] ?? null,
      imageUrls: images,
      videoUrls: videos,
      location: location ?? null,
      eventDate: new Date(eventDate),
    }).returning();
    res.status(201).json(withMedia(event));
  } catch (err) {
    req.log.error({ err }, "createEvent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/events/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, imageUrl, imageUrls, videoUrls, location, eventDate } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (imageUrls !== undefined || imageUrl !== undefined) {
      const images = mediaList(imageUrls, imageUrl);
      updates.imageUrls = images;
      updates.imageUrl = images[0] ?? null;
    }
    if (videoUrls !== undefined) updates.videoUrls = mediaList(videoUrls);
    if (location !== undefined) updates.location = location;
    if (eventDate !== undefined) updates.eventDate = new Date(eventDate);
    const [event] = await db.update(eventsTable).set(updates).where(eq(eventsTable.id, id)).returning();
    if (!event) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(withMedia(event));
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
