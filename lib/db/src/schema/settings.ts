import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
