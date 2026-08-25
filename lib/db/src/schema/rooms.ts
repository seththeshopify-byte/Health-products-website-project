import { pgTable, serial, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().notNull().default([]),
  guestPrice: numeric("guest_price", { precision: 10, scale: 2 }).notNull(),
  memberPrice: numeric("member_price", { precision: 10, scale: 2 }).notNull(),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).notNull().default("10"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
