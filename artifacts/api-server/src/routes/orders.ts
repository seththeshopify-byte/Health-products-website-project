import { Router } from "express";
import { db, ordersTable, productsTable, servicesTable, commissionEventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/requireAuth.js";
import { calculateShipping } from "../lib/shipping.js";
import { sendOrderConfirmation, sendAdminPaymentNotification } from "../lib/email.js";
import { sendWhatsAppPaymentNotification } from "../lib/whatsapp.js";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

const router = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// POST /orders — create Paystack checkout session
router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const { itemType, itemId, promoCodeUsed, shippingAddress, email } = req.body;

    if (!itemType || !itemId || !shippingAddress?.country) {
      res.status(400).json({ error: "itemType, itemId, and shippingAddress.country are required" });
      return;
    }

    const customerEmail = (req.user as any)?.email || email;
    if (!customerEmail) {
      res.status(400).json({ error: "email is required to initiate checkout" });
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

    if (!PAYSTACK_SECRET_KEY) {
      // No Paystack key: return a mock checkout URL for development
      logger.warn("PAYSTACK_SECRET_KEY not set — returning mock checkout URL");
      res.json({
        checkoutUrl: `/checkout/success?order_id=${order.id}&reference=mock`,
        orderId: order.id,
      });
      return;
    }

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.APP_URL ?? "http://localhost:80";

    const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: Math.round(totalAmount * 100), // Paystack expects kobo (amount x 100)
        currency: "NGN",
        callback_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
        metadata: { orderId: String(order.id) },
      }),
    });

    const paystackData: any = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      req.log.error({ paystackData }, "Paystack initialize failed");
      res.status(502).json({ error: "Failed to initialize payment" });
      return;
    }

    const { authorization_url, reference } = paystackData.data;

    await db.update(ordersTable).set({ paystackReference: reference }).where(eq(ordersTable.id, order.id));

    res.json({ checkoutUrl: authorization_url, orderId: order.id });
  } catch (err) {
    req.log.error({ err }, "createOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders/webhook — Paystack webhook
router.post("/orders/webhook", async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) { res.json({ success: true }); return; }

    const sig = req.headers["x-paystack-signature"] as string;
    if (!sig) {
      res.status(400).json({ error: "Missing x-paystack-signature header" });
      return;
    }

    // app.ts mounts express.raw({ type: "application/json" }) on this exact
    // path before express.json() runs, so req.body here is a raw Buffer —
    // NOT a parsed object. Convert it to a string once, use that string for
    // the HMAC signature check (this must match the exact bytes Paystack
    // signed), then JSON.parse it to get the usable event object below.
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");

    if (hash !== sig) {
      req.log.warn("Paystack webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const reference = event.data.reference as string;
      const orderId = parseInt(event.data.metadata?.orderId ?? "0");

      if (orderId) {
        const [order] = await db
          .update(ordersTable)
          .set({ status: "paid", paystackReference: reference })
          .where(eq(ordersTable.id, orderId))
          .returning();

        // Send order confirmation email + internal admin notification
        if (order) {
          const customerEmail = event.data.customer?.email;

          let itemName = "Your order";
          if (order.itemType === "product") {
            const rows = await db.select().from(productsTable).where(eq(productsTable.id, order.itemId));
            if (rows[0]) itemName = rows[0].name;
          } else {
            const rows = await db.select().from(servicesTable).where(eq(servicesTable.id, order.itemId));
            if (rows[0]) itemName = rows[0].name;
          }

          // order.shippingAddress may come back as an already-parsed object
          // (if the DB column is jsonb, Drizzle auto-deserializes it) or as
          // a raw JSON string (if it's a text column). JSON.parse() on an
          // object that's already parsed silently stringifies it first via
          // toString(), producing the literal text "[object Object]" and
          // then failing to parse — so only parse when it's actually a string.
          const shippingAddress =
            typeof order.shippingAddress === "string"
              ? JSON.parse(order.shippingAddress)
              : order.shippingAddress;

          if (customerEmail) {
            await sendOrderConfirmation({
              to: customerEmail,
              orderId: order.id,
              itemName,
              totalAmount: Number(order.totalAmount),
              shippingAddress,
              reference,
            });
          } else {
            req.log.warn({ orderId: order.id }, "No customer email on Paystack event — skipping order confirmation email");
          }

          // Pull customer name/phone directly from the Paystack event payload
          const customerFirstName = event.data.customer?.first_name ?? "";
          const customerLastName = event.data.customer?.last_name ?? "";
          const customerName = `${customerFirstName} ${customerLastName}`.trim() || null;
          const customerPhone = event.data.customer?.phone ?? null;

          await sendAdminPaymentNotification({
            orderId: order.id,
            itemName,
            itemAmount: Number(order.itemAmount),
            shippingFee: Number(order.shippingFee),
            totalAmount: Number(order.totalAmount),
            customerName,
            customerEmail: customerEmail ?? "Not provided",
            customerPhone,
            shippingAddress,
            reference,
          });

          // Owner-facing WhatsApp alert (independent of email — failure here
          // never blocks the webhook response or the email notifications above)
          await sendWhatsAppPaymentNotification({
            orderId: order.id,
            itemName,
            totalAmount: Number(order.totalAmount),
            customerName,
            customerEmail: customerEmail ?? "Not provided",
            customerPhone,
            reference,
          });
        }

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
    req.log.error({ err }, "paystackWebhook error");
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
