import { Router } from "express";
import { db, ordersTable, productsTable, servicesTable, commissionEventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/requireAuth.js";
import { calculateShipping } from "../lib/shipping.js";
import { sendOrderConfirmation, sendAdminPaymentNotification } from "../lib/email.js";
import { sendWhatsAppPaymentNotification } from "../lib/whatsapp.js";
import { ngnToUsdCents } from "../lib/fx.js";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

const router = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_BASE_URL = "https://api.stripe.com/v1";

// Which gateway new checkouts use. Defaults to "stripe" — set
// PAYMENT_PROVIDER=paystack in Render to switch back once Paystack
// compliance is approved. Both code paths stay fully intact regardless
// of which one is active, so switching is a config change, not a rewrite.
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER ?? "stripe";

function getBaseUrl(): string {
  return process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.APP_URL ?? "http://localhost:80";
}

// Shared logic for what happens once an order is confirmed paid, regardless
// of which gateway (Paystack or Stripe) processed the payment. Handles the
// status update, customer/admin email notifications, the WhatsApp owner
// alert, and promo-code commission logging.
//
// Idempotent: if the order is already marked "paid" (e.g. a duplicate
// webhook delivery, which both Paystack and Stripe can send), this exits
// early without re-sending notifications or double-logging commission.
async function handlePaidOrder(opts: {
  orderId: number;
  reference: string;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
}): Promise<void> {
  const { orderId, reference } = opts;
  if (!orderId) return;

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!existing) {
    logger.warn({ orderId }, "handlePaidOrder: order not found");
    return;
  }
  if (existing.status === "paid") {
    logger.info({ orderId }, "handlePaidOrder: order already marked paid — skipping duplicate processing");
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: "paid", paystackReference: reference })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!order) return;

  const customerEmail = opts.customerEmail ?? undefined;

  let itemName = "Your order";
  if (order.itemType === "product") {
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, order.itemId));
    if (rows[0]) itemName = rows[0].name;
  } else {
    const rows = await db.select().from(servicesTable).where(eq(servicesTable.id, order.itemId));
    if (rows[0]) itemName = rows[0].name;
  }

  // order.shippingAddress may come back as an already-parsed object (jsonb
  // column) or a raw JSON string (text column) — only parse when it's
  // actually a string, since JSON.parse on an already-parsed object
  // silently stringifies it first, producing "[object Object]".
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
    logger.warn({ orderId: order.id }, "No customer email — skipping order confirmation email");
  }

  const customerName = opts.customerName ?? null;
  const customerPhone = opts.customerPhone ?? null;

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

  // Owner-facing WhatsApp alert — independent of email; failure here never
  // blocks the webhook response or the email notifications above.
  await sendWhatsAppPaymentNotification({
    orderId: order.id,
    itemName,
    totalAmount: Number(order.totalAmount),
    customerName,
    customerEmail: customerEmail ?? "Not provided",
    customerPhone,
    reference,
  });

  // Log commission event for promo code
  if (order.promoCodeUsed) {
    const referrer = await db.select().from(usersTable).where(eq(usersTable.promoCode, order.promoCodeUsed));
    if (referrer[0]) {
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

// POST /orders — create checkout session (Stripe by default, Paystack if
// PAYMENT_PROVIDER=paystack)
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

    // Create order (pending) — amounts stored in Naira regardless of which
    // gateway processes payment, so reporting/admin views stay consistent.
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

    const baseUrl = getBaseUrl();

    if (PAYMENT_PROVIDER === "paystack") {
      if (!PAYSTACK_SECRET_KEY) {
        logger.warn("PAYSTACK_SECRET_KEY not set — returning mock checkout URL");
        res.json({
          checkoutUrl: `/checkout/success?order_id=${order.id}&reference=mock`,
          orderId: order.id,
        });
        return;
      }

      const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: Math.round(totalAmount * 100), // Paystack expects kobo
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
      return;
    }

    // --- Stripe (default) ---
    if (!STRIPE_SECRET_KEY) {
      logger.warn("STRIPE_SECRET_KEY not set — returning mock checkout URL");
      res.json({
        checkoutUrl: `/checkout/success?order_id=${order.id}&reference=mock`,
        orderId: order.id,
      });
      return;
    }

    let itemUnitAmountCents: number;
    let shippingUnitAmountCents: number;
    try {
      itemUnitAmountCents = await ngnToUsdCents(itemAmount);
      shippingUnitAmountCents = await ngnToUsdCents(shippingFee);
    } catch (fxErr) {
      req.log.error({ fxErr }, "Currency conversion failed — cannot create Stripe session");
      res.status(502).json({ error: "Failed to determine checkout price — please try again shortly" });
      return;
    }

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[0]", "card");
    params.append("customer_email", customerEmail);
    params.append("success_url", `${baseUrl}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${baseUrl}/checkout/cancel?order_id=${order.id}`);
    params.append("metadata[orderId]", String(order.id));

    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(itemUnitAmountCents));
    params.append("line_items[0][price_data][product_data][name]", itemName);

    if (shippingUnitAmountCents > 0) {
      params.append("line_items[1][quantity]", "1");
      params.append("line_items[1][price_data][currency]", "usd");
      params.append("line_items[1][price_data][unit_amount]", String(shippingUnitAmountCents));
      params.append("line_items[1][price_data][product_data][name]", "Shipping");
    }

    const stripeRes = await fetch(`${STRIPE_BASE_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const stripeData: any = await stripeRes.json();

    if (!stripeRes.ok) {
      req.log.error({ stripeData }, "Stripe session creation failed");
      res.status(502).json({ error: "Failed to initialize payment" });
      return;
    }

    await db.update(ordersTable).set({ paystackReference: stripeData.id }).where(eq(ordersTable.id, order.id));
    res.json({ checkoutUrl: stripeData.url, orderId: order.id });
  } catch (err) {
    req.log.error({ err }, "createOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders/webhook — Paystack webhook (dormant unless
// PAYSTACK_SECRET_KEY is set / PAYMENT_PROVIDER=paystack)
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

      const customerFirstName = event.data.customer?.first_name ?? "";
      const customerLastName = event.data.customer?.last_name ?? "";
      const customerName = `${customerFirstName} ${customerLastName}`.trim() || null;

      await handlePaidOrder({
        orderId,
        reference,
        customerEmail: event.data.customer?.email ?? null,
        customerName,
        customerPhone: event.data.customer?.phone ?? null,
      });
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "paystackWebhook error");
    res.status(400).json({ error: "Webhook error" });
  }
});

// POST /orders/webhook/stripe — Stripe webhook
router.post("/orders/webhook/stripe", async (req, res) => {
  try {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) { res.json({ success: true }); return; }

    const sigHeader = req.headers["stripe-signature"] as string;
    if (!sigHeader) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);

    // Stripe's signature header looks like: t=1690000000,v1=<hex>,v0=<hex>
    // (v0 is a legacy scheme we ignore). We verify against v1.
    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k, v];
      })
    );
    const timestamp = parts["t"];
    const v1Signature = parts["v1"];

    if (!timestamp || !v1Signature) {
      res.status(400).json({ error: "Malformed stripe-signature header" });
      return;
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSig = crypto
      .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
      .update(signedPayload, "utf8")
      .digest("hex");

    const sigValid =
      expectedSig.length === v1Signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(v1Signature));

    if (!sigValid) {
      req.log.warn("Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    // Reject stale events (older than 5 minutes) as a replay-attack guard.
    const eventAgeSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (eventAgeSeconds > 300) {
      req.log.warn({ eventAgeSeconds }, "Stripe webhook timestamp outside tolerance — rejecting");
      res.status(400).json({ error: "Webhook timestamp outside tolerance" });
      return;
    }

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = parseInt(session.metadata?.orderId ?? "0");
      const reference = session.id as string;
      const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
      const customerName = session.customer_details?.name ?? null;
      const customerPhone = session.customer_details?.phone ?? null;

      await handlePaidOrder({
        orderId,
        reference,
        customerEmail,
        customerName,
        customerPhone,
      });
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
