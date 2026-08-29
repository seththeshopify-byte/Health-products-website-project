import { pgTable, serial, text, numeric, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().notNull().default([]),
  type: varchar("type", { length: 10 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  guestPrice: numeric("guest_price", { precision: 10, scale: 2 }),
  memberPrice: numeric("member_price", { precision: 10, scale: 2 }),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).notNull().default("10"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMenuItemSchema = createInsertSchema(menuItemsTable, {
  type: z.enum(["food", "drink"]),
}).omit({
  id: true,
  createdAt: true,
});
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;
