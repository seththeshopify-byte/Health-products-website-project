import { pgTable, serial, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  videoUrl: text("video_url"),
  photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().notNull().default([]),
  text: text("text").notNull(),
  category: varchar("category", { length: 20 }).notNull().default("product"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
