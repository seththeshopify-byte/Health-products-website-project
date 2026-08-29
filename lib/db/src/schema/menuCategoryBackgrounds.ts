import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
export const menuCategoryBackgroundsTable = pgTable("menu_category_backgrounds", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull().unique(),
  backgroundUrl: text("background_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMenuCategoryBackgroundSchema = createInsertSchema(menuCategoryBackgroundsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMenuCategoryBackground = z.infer<typeof insertMenuCategoryBackgroundSchema>;
export type MenuCategoryBackground = typeof menuCategoryBackgroundsTable.$inferSelect;
