import { Router } from "express";
import { db, bookingSlotsTable, bookingsTable, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { sendBookingConfirmation } from "../lib/email.js";

const router = Router();

// GET /booking-slots
router.get("/booking-slots", async (req, res) => {
  try {
    const slots = await db.select().from(bookingSlotsTable);
    res.json(slots);
  } catch (err) {
    req.log.error({ err }, "listBookingSlots error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /booking-slots
router.post("/booking-slots", requireAdmin, async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) { res.status(400).json({ error: "date and time are required" }); return; }
    const [slot] = await db.insert(bookingSlotsTable).values({ date, time, isBooked: false }).returning();
    res.status(201).json(slot);
  } catch (err) {
    req.log.error({ err }, "createBookingSlot error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /booking-slots/:id
router.delete("/booking-slots/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(bookingsTable).where(eq(bookingsTable.slotId, id));
    await db.delete(bookingSlotsTable).where(eq(bookingSlotsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteBookingSlot error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /bookings
router.get("/bookings", requireAdmin, async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable);
    const slots = await db.select().from(bookingSlotsTable);
    const slotMap = new Map(slots.map((s) => [s.id, s]));
    res.json(bookings.map((b) => ({
      ...b,
      slotDate: slotMap.get(b.slotId)?.date ?? null,
      slotTime: slotMap.get(b.slotId)?.time ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "listBookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bookings
router.post("/bookings", async (req, res) => {
  try {
    const { slotId, name, email, phone } = req.body;
    if (!slotId || !name || !email) {
      res.status(400).json({ error: "slotId, name, and email are required" });
      return;
    }

    // Check slot exists and not already booked
    const slotRows = await db.select().from(bookingSlotsTable).where(eq(bookingSlotsTable.id, slotId));
    const slot = slotRows[0];
    if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
    if (slot.isBooked) { res.status(409).json({ error: "This slot is already booked" }); return; }

    // Get Zoom link from settings
    const zoomRows = await db.select().from(settingsTable).where(eq(settingsTable.key, "zoom_link"));
    const zoomLink = zoomRows[0]?.value ?? null;

    const [booking] = await db.insert(bookingsTable).values({
      slotId,
      name,
      email,
      phone: phone ?? null,
      zoomLink,
      status: "booked",
    }).returning();

    // Mark slot as booked
    await db.update(bookingSlotsTable).set({ isBooked: true }).where(eq(bookingSlotsTable.id, slotId));

    // Send confirmation email (non-blocking)
    sendBookingConfirmation({ to: email, name, date: slot.date, time: slot.time, zoomLink }).catch(() => {});

    res.status(201).json({
      ...booking,
      slotDate: slot.date,
      slotTime: slot.time,
    });
  } catch (err) {
    req.log.error({ err }, "createBooking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /bookings/:id/cancel
router.patch("/bookings/:id/cancel", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    // Free the slot
    await db.update(bookingSlotsTable).set({ isBooked: false }).where(eq(bookingSlotsTable.id, booking.slotId));
    const slotRows = await db.select().from(bookingSlotsTable).where(eq(bookingSlotsTable.id, booking.slotId));
    res.json({ ...booking, slotDate: slotRows[0]?.date ?? null, slotTime: slotRows[0]?.time ?? null });
  } catch (err) {
    req.log.error({ err }, "cancelBooking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
