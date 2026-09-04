import { Router } from "express";
import { db, amenitiesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
const router = Router();

function formatAmenity(a: typeof amenitiesTable.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    note: a.note,
    imageUrl: a.imageUrl,
    imageUrls: a.imageUrls ?? [],
    videoUrls: a.videoUrls ?? [],
    sortOrder: a.sortOrder,
    createdAt: a.createdAt,
  };
}

router.get("/amenities", async (req, res) => {
  try {
    const amenities = await db
      .select()
      .from(amenitiesTable)
      .orderBy(asc(amenitiesTable.sortOrder), asc(amenitiesTable.id));
    res.json(amenities.map(formatAmenity));
  } catch (err) {
    req.log.error({ err }, "listAmenities error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/amenities", requireAdmin, async (req, res) => {
  try {
    const { title, description, category, note, imageUrl, imageUrls, videoUrls, sortOrder } = req.body;
    if (!title || !description || !category) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [amenity] = await db
      .insert(amenitiesTable)
      .values({
        title,
        description,
        category,
        note: note ?? null,
        imageUrl: imageUrl ?? (imageUrls?.[0] ?? null),
        imageUrls: imageUrls ?? [],
        videoUrls: videoUrls ?? [],
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    res.status(201).json(formatAmenity(amenity));
  } catch (err) {
    req.log.error({ err }, "createAmenity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/amenities/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(amenitiesTable).where(eq(amenitiesTable.id, id));
    if (!rows[0]) {
      res.status(404).json({ error: "Amenity not found" });
      return;
    }
    res.json(formatAmenity(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getAmenity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/amenities/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, category, note, imageUrl, imageUrls, videoUrls, sortOrder } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (note !== undefined) updates.note = note;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (imageUrls !== undefined) {
      updates.imageUrls = imageUrls;
      if (imageUrl === undefined) updates.imageUrl = imageUrls[0] ?? null;
    }
    if (videoUrls !== undefined) updates.videoUrls = videoUrls;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const [amenity] = await db
      .update(amenitiesTable)
      .set(updates)
      .where(eq(amenitiesTable.id, id))
      .returning();
    if (!amenity) {
      res.status(404).json({ error: "Amenity not found" });
      return;
    }
    res.json(formatAmenity(amenity));
  } catch (err) {
    req.log.error({ err }, "updateAmenity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/amenities/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(amenitiesTable).where(eq(amenitiesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteAmenity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
