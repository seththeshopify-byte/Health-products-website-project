import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

const mediaList = (value: unknown, legacy?: string | null) => {
  const values = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  return [...new Set(legacy ? [legacy, ...values] : values)];
};

const withMedia = (testimonial: any) => ({
  ...testimonial,
  photoUrls: mediaList(testimonial.photoUrls, testimonial.photoUrl),
  videoUrls: mediaList(testimonial.videoUrls, testimonial.videoUrl),
});

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await db.select().from(testimonialsTable);
    const category = req.query.category as string | undefined;
    const filtered = category ? testimonials.filter((item) => item.category === category) : testimonials;
    res.json(filtered.map(withMedia));
  } catch (err) {
    req.log.error({ err }, "listTestimonials error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/testimonials", requireAdmin, async (req, res) => {
  try {
    const { name, photoUrl, videoUrl, photoUrls, videoUrls, text, category } = req.body;
    if (!name || !text) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const photos = mediaList(photoUrls, photoUrl);
    const videos = mediaList(videoUrls, videoUrl);
    const [testimonial] = await db.insert(testimonialsTable).values({
      name,
      photoUrl: photos[0] ?? null,
      videoUrl: videos[0] ?? null,
      photoUrls: photos,
      videoUrls: videos,
      text,
      category: category ?? "product",
    }).returning();
    res.status(201).json(withMedia(testimonial));
  } catch (err) {
    req.log.error({ err }, "createTestimonial error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, photoUrl, videoUrl, photoUrls, videoUrls, text, category } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (photoUrls !== undefined || photoUrl !== undefined) {
      const photos = mediaList(photoUrls, photoUrl);
      updates.photoUrls = photos;
      updates.photoUrl = photos[0] ?? null;
    }
    if (videoUrls !== undefined || videoUrl !== undefined) {
      const videos = mediaList(videoUrls, videoUrl);
      updates.videoUrls = videos;
      updates.videoUrl = videos[0] ?? null;
    }
    if (text !== undefined) updates.text = text;
    if (category !== undefined) updates.category = category;
    const [testimonial] = await db.update(testimonialsTable).set(updates).where(eq(testimonialsTable.id, id)).returning();
    if (!testimonial) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(withMedia(testimonial));
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
