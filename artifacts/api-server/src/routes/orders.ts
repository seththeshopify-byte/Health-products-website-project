import { Router } from "express";
import { db, ordersTable, productsTable, servicesTable, commissionEventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/requireAuth.js";
import { calculateShipping } from "../lib/shipping.js";
import Stripe from "stripe";
import { logger } from "../lib/logger.js";

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /orders — create Stripe checkout session
router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const { itemType, itemId, promoCodeUsed, shippingAddress } = req.body;

    if (!itemType || !itemId || !shippingAddress?.country) {
      res.status(400).json({ error: "itemType, itemId, and shippingAddress.country are required" });
      return;
    }

    const isMember = req.user?.role === "member" || req.user?.role === "admin";

    let itemAmount: number;
    let itemName: string;
    let commissionPct: number;

    if (itemType === "product") {
      const rows = await db.select().from(productsTable).where(eq(productsTable.id, itemId));
      if (!rows[0]) { res.status(404).json({ error: "Product not found" }); return; }
      itemAmount = isMember ? Number(rows[0].memberPrice) : Number(rows[0].guestPrice);
      itemName = rows[0].name;
      commissionPct = Number(rows[0].commissionPct);
    } else if (itemType === "service") {
      const rows = await db.select().from(servicesTable).where(eq(servicesTable.id, itemId));
      if (!rows[0]) { res.status(404).json({ error: "Service not found" }); return; }
      itemAmount = isMember ? Number(rows[0].memberPrice) : Number(rows[0].guestPrice);
      itemName = rows[0].name;
      commissionPct = Number(rows[0].commissionPct);
    } else {
      res.status(400).json({ error: "itemType must be product or service" });
      return;
    }

    const shippingFee = await calculateShipping(shippingAddress);
    const totalAmount = itemAmount + shippingFee;

    // Validate promo code
    let promoUsed: string | null = null;
    if (promoCodeUsed) {
      const referrer = await db.select().from(usersTable).where(eq(usersTable.promoCode, promoCodeUsed));
      if (referrer.length > 0) {
        promoUsed = promoCodeUsed;
      }
    }

    // Create order (pending)
    const [order] = await db.insert(ordersTable).values({
      userId: req.user?.userId ?? null,
      itemType,
      itemId,
      promoCodeUsed: promoUsed,
      itemAmount: String(itemAmount),
      shippingFee: String(shippingFee),
      totalAmount: String(totalAmount),
      shippingAddress: JSON.stringify(shippingAddress),
      status: "pending",
    }).returning();

    if (!stripe) {
      // No Stripe key: return a mock checkout URL for development
      logger.warn("STRIPE_SECRET_KEY not set — returning mock checkout URL");
      res.json({
        checkoutUrl: `/checkout/success?order_id=${order.id}&session_id=mock`,
        orderId: order.id,
      });
      return;
    }

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.APP_URL ?? "http://localhost:80";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "ngn",
            product_data: { name: itemName },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: String(order.id) },
      success_url: `${baseUrl}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?order_id=${order.id}`,
    });

    await db.update(ordersTable).set({ stripeSessionId: session.id }).where(eq(ordersTable.id, order.id));

    res.json({ checkoutUrl: session.url!, orderId: order.id });
  } catch (err) {
    req.log.error({ err }, "createOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders/webhook — Stripe webhook
router.post("/orders/webhook", async (req, res) => {
  try {
    if (!stripe) { res.json({ success: true }); return; }

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      req.log.warn("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
      res.status(400).json({ error: "Webhook secret not configured" });
      return;
    }
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      req.log.warn({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = parseInt(session.metadata?.orderId ?? "0");
      if (orderId) {
        const [order] = await db
          .update(ordersTable)
          .set({ status: "paid", stripePaymentId: session.payment_intent as string })
          .where(eq(ordersTable.id, orderId))
          .returning();

        // Log commission event for promo code
        if (order?.promoCodeUsed) {
          const referrer = await db.select().from(usersTable).where(eq(usersTable.promoCode, order.promoCodeUsed));
          if (referrer[0]) {
            // Get the item's commission pct
            let commissionPct = 10;
            if (order.itemType === "product") {
              const rows = await db.select().from(productsTable).where(eq(productsTable.id, order.itemId));
              if (rows[0]) commissionPct = Number(rows[0].commissionPct);
            } else {
              const rows = await db.select().from(servicesTable).where(eq(servicesTable.id, order.itemId));
              if (rows[0]) commissionPct = Number(rows[0].commissionPct);
            }
            const commissionAmount = (Number(order.itemAmount) * commissionPct) / 100;
            await db.insert(commissionEventsTable).values({
              referringMemberId: referrer[0].id,
              type: "sale",
              relatedId: order.id,
              amount: String(commissionAmount),
              status: "pending",
            });
          }
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "stripeWebhook error");
    res.status(400).json({ error: "Webhook error" });
  }
});

// GET /orders
router.get("/orders", requireAuth, async (req, res) => {
  try {
    let orders;
    if (req.user!.role === "admin") {
      orders = await db.select().from(ordersTable);
    } else {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.userId));
    }
    res.json(orders.map((o) => ({
      ...o,
      itemAmount: Number(o.itemAmount),
      shippingFee: Number(o.shippingFee),
      totalAmount: Number(o.totalAmount),
    })));
  } catch (err) {
    req.log.error({ err }, "listOrders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders/:id
router.get("/orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Order not found" }); return; }
    const o = rows[0];
    if (req.user!.role !== "admin" && o.userId !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    res.json({ ...o, itemAmount: Number(o.itemAmount), shippingFee: Number(o.shippingFee), totalAmount: Number(o.totalAmount) });
  } catch (err) {
    req.log.error({ err }, "getOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
