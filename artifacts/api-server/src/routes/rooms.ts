import { Router } from "express";
import { db, roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

function formatRoom(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    imageUrl: r.imageUrl,
    imageUrls: r.imageUrls ?? [],
    videoUrls: r.videoUrls ?? [],
    guestPrice: Number(r.guestPrice),
    memberPrice: Number(r.memberPrice),
    commissionPct: Number(r.commissionPct),
    createdAt: r.createdAt,
  };
}

router.get("/rooms", async (req, res) => {
  try {
    const rooms = await db.select().from(roomsTable);
    res.json(rooms.map(formatRoom));
  } catch (err) {
    req.log.error({ err }, "listRooms error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/rooms", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, imageUrls, videoUrls, guestPrice, memberPrice, commissionPct } = req.body;
    if (!name || !description || guestPrice == null || memberPrice == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [room] = await db
      .insert(roomsTable)
      .values({
        name,
        description,
        imageUrl: imageUrl ?? (imageUrls?.[0] ?? null),
        imageUrls: imageUrls ?? [],
        videoUrls: videoUrls ?? [],
        guestPrice: String(guestPrice),
        memberPrice: String(memberPrice),
        commissionPct: String(commissionPct ?? 10),
      })
      .returning();
    res.status(201).json(formatRoom(room));
  } catch (err) {
    req.log.error({ err }, "createRoom error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(roomsTable).where(eq(roomsTable.id, id));
    if (!rows[0]) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(formatRoom(rows[0]));
  } catch (err) {
    req.log.error({ err }, "getRoom error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/rooms/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, imageUrl, imageUrls, videoUrls, guestPrice, memberPrice, commissionPct } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (imageUrls !== undefined) {
      updates.imageUrls = imageUrls;
      if (imageUrl === undefined) updates.imageUrl = imageUrls[0] ?? null;
    }
    if (videoUrls !== undefined) updates.videoUrls = videoUrls;
    if (guestPrice !== undefined) updates.guestPrice = String(guestPrice);
    if (memberPrice !== undefined) updates.memberPrice = String(memberPrice);
    if (commissionPct !== undefined) updates.commissionPct = String(commissionPct);
    const [room] = await db
      .update(roomsTable)
      .set(updates)
      .where(eq(roomsTable.id, id))
      .returning();
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(formatRoom(room));
  } catch (err) {
    req.log.error({ err }, "updateRoom error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rooms/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(roomsTable).where(eq(roomsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteRoom error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
