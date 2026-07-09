import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shippingZonesTable = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  regionOrPostalPrefix: text("region_or_postal_prefix"),
  feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  isFree: boolean("is_free").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShippingZoneSchema = createInsertSchema(shippingZonesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;
export type ShippingZone = typeof shippingZonesTable.$inferSelect;
