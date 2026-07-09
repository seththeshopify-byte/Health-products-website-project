import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingSlotsTable = pgTable("booking_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  isBooked: boolean("is_booked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  slotId: integer("slot_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  zoomLink: text("zoom_link"),
  status: text("status").notNull().default("booked"), // booked | completed | cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSlotSchema = createInsertSchema(bookingSlotsTable).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBookingSlot = z.infer<typeof insertBookingSlotSchema>;
export type BookingSlot = typeof bookingSlotsTable.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
