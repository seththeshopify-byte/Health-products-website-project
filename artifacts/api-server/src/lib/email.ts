import { logger } from "./logger.js";

// Sends transactional email via Brevo's HTTPS API instead of raw SMTP.
// This avoids outbound SMTP port blocks (25/465/587) that some hosts
// (e.g. Render's free tier) enforce at the network level.
//
// Required env vars:
//   BREVO_API_KEY  — Brevo API key (Settings > SMTP & API > API Keys)
//   SMTP_FROM      — sender email address, MUST be a verified sender in Brevo
//   ADMIN_EMAIL    — optional comma-separated list of admin notification recipients

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Default admin recipients for internal payment notifications.
// Override in production by setting ADMIN_EMAIL to a comma-separated list,
// e.g. ADMIN_EMAIL="owner1@example.com,owner2@example.com"
const DEFAULT_ADMIN_EMAILS = [
  "Ruthokoro2018@gmail.com",
  "info@ruthhealthentrepreneur.site",
];

function getAdminEmails(): string[] {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL.split(",").map((e) => e.trim()).filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface SendEmailOpts {
  to: BrevoRecipient[];
  subject: string;
  html: string;
  fromName?: string;
}

async function sendViaBrevo(opts: SendEmailOpts): Promise<{ messageId?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set");
  }

  const fromEmail = process.env.SMTP_FROM ?? "noreply@ruthhealth.com";

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: opts.fromName ?? "Ruth Health", email: fromEmail },
      to: opts.to,
      subject: opts.subject,
      htmlContent: opts.html,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `Brevo API error (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return { messageId: (data as { messageId?: string }).messageId };
}

export async function sendBookingConfirmation(opts: {
  to: string;
  name: string;
  date: string;
  time: string;
  zoomLink?: string | null;
}): Promise<void> {
  try {
    const result = await sendViaBrevo({
      to: [{ email: opts.to, name: opts.name }],
      subject: "Your Zoom Session Confirmation — Ruth Health",
      html: `
        <h2>Your session is confirmed!</h2>
        <p>Hi ${opts.name},</p>
        <p>Your Zoom info session with Ruth Health is scheduled for:</p>
        <p><strong>Date:</strong> ${opts.date}<br/><strong>Time:</strong> ${opts.time}</p>
        ${opts.zoomLink ? `<p><a href="${opts.zoomLink}">Join Zoom Meeting</a></p>` : ""}
        <p>We look forward to speaking with you.</p>
        <hr/>
        <p style="font-size:12px;color:#666;">Ruth Health — Lagos, Nigeria.</p>
      `,
    });
    logger.info({ messageId: result.messageId }, "Booking confirmation email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send booking confirmation email");
  }
}

export async function sendOrderConfirmation(opts: {
  to: string;
  orderId: number;
  itemName: string;
  totalAmount: number;
  shippingAddress: {
    line1: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  reference: string;
}): Promise<void> {
  try {
    const formattedTotal = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(opts.totalAmount);

    const result = await sendViaBrevo({
      to: [{ email: opts.to }],
      subject: `Order Confirmation #${opts.orderId} — Ruth Health`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your payment was successful and your order is now being processed.</p>
        <p><strong>Order #:</strong> ${opts.orderId}<br/>
        <strong>Item:</strong> ${opts.itemName}<br/>
        <strong>Total:</strong> ${formattedTotal}<br/>
        <strong>Payment reference:</strong> ${opts.reference}</p>
        <p><strong>Shipping to:</strong><br/>
        ${opts.shippingAddress.line1}<br/>
        ${opts.shippingAddress.city}, ${opts.shippingAddress.province}<br/>
        ${opts.shippingAddress.postalCode}, ${opts.shippingAddress.country}</p>
        <p>We'll be in touch when your order ships.</p>
        <hr/>
        <p style="font-size:12px;color:#666;">Ruth Health — Lagos, Nigeria.</p>
      `,
    });
    logger.info(
      { messageId: result.messageId, orderId: opts.orderId },
      "Order confirmation email sent"
    );
  } catch (err) {
    logger.error({ err, orderId: opts.orderId }, "Failed to send order confirmation email");
  }
}

// Sends a detailed internal notification to the site admin(s) whenever a
// payment succeeds, so a paid order is never missed even if the customer
// confirmation email goes unnoticed.
export async function sendAdminPaymentNotification(opts: {
  orderId: number;
  itemName: string;
  itemAmount: number;
  shippingFee: number;
  totalAmount: number;
  customerName?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: {
    line1: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  reference: string;
}): Promise<void> {
  try {
    const admins = getAdminEmails();
    if (admins.length === 0) {
      logger.warn("No admin email configured — skipping admin payment notification");
      return;
    }

    const currency = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

    const paidAt = new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

    const result = await sendViaBrevo({
      fromName: "Ruth Health Orders",
      to: admins.map((email) => ({ email })),
      subject: `💰 New Paid Order #${opts.orderId} — ${currency(opts.totalAmount)}`,
      html: `
        <h2>New payment received</h2>
        <p>A customer has just completed payment. Details below.</p>

        <h3>Order</h3>
        <p>
          <strong>Order #:</strong> ${opts.orderId}<br/>
          <strong>Item:</strong> ${opts.itemName}<br/>
          <strong>Item price:</strong> ${currency(opts.itemAmount)}<br/>
          <strong>Shipping fee:</strong> ${currency(opts.shippingFee)}<br/>
          <strong>Total paid:</strong> ${currency(opts.totalAmount)}<br/>
          <strong>Payment reference:</strong> ${opts.reference}<br/>
          <strong>Paid at:</strong> ${paidAt}
        </p>

        <h3>Customer</h3>
        <p>
          <strong>Name:</strong> ${opts.customerName ?? "Not provided"}<br/>
          <strong>Email:</strong> ${opts.customerEmail}<br/>
          <strong>Phone:</strong> ${opts.customerPhone ?? "Not provided"}
        </p>

        <h3>Shipping / Location</h3>
        <p>
          ${opts.shippingAddress.line1}<br/>
          ${opts.shippingAddress.city}, ${opts.shippingAddress.province}<br/>
          ${opts.shippingAddress.postalCode}, ${opts.shippingAddress.country}
        </p>

        <hr/>
        <p style="font-size:12px;color:#666;">Automated notification — Ruth Health order system.</p>
      `,
    });

    logger.info(
      { messageId: result.messageId, orderId: opts.orderId, admins },
      "Admin payment notification sent"
    );
  } catch (err) {
    logger.error({ err, orderId: opts.orderId }, "Failed to send admin payment notification");
  }
}
