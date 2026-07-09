import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commissionEventsTable = pgTable("commission_events", {
  id: serial("id").primaryKey(),
  referringMemberId: integer("referring_member_id").notNull(),
  type: text("type").notNull(), // sale | referral
  relatedId: integer("related_id"), // orderId or newMemberId
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommissionEventSchema = createInsertSchema(commissionEventsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCommissionEvent = z.infer<typeof insertCommissionEventSchema>;
export type CommissionEvent = typeof commissionEventsTable.$inferSelect;
