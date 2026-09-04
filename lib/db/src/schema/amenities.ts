import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const amenitiesTable = pgTable("amenities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // "complimentary" | "included" | "on-request"
  category: text("category").notNull().default("complimentary"),
  note: text("note"),
  imageUrl: text("image_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAmenitySchema = createInsertSchema(amenitiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type Amenity = typeof amenitiesTable.$inferSelect;
