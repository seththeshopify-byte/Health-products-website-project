import { pgTable, serial, text, numeric, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  itemType: text("item_type"), // product | service | menuItem | null (cart order — see order_items)
  itemId: integer("item_id"), // null for cart orders — see order_items
  fulfillmentMethod: text("fulfillment_method"), // null (legacy product/service) | delivery | dine_in
  promoCodeUsed: text("promo_code_used"),
  itemAmount: numeric("item_amount", { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address"),
  paystackReference: text("paystack_reference"),
  status: text("status").notNull().default("pending"), // pending | paid | failed | refunded | dine_in_pending
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
