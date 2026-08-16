import nodemailer from "nodemailer";
import { logger } from "./logger.js";

// Configure a transporter — uses SMTP env vars if available, otherwise uses
// nodemailer's built-in test account (ethereal.email) in development.
let transporter: nodemailer.Transporter | null = null;

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

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test account for local dev
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info({ url: "https://ethereal.email" }, "Using Ethereal email test account");
  }

  return transporter;
}

export async function sendBookingConfirmation(opts: {
  to: string;
  name: string;
  date: string;
  time: string;
  zoomLink?: string | null;
}): Promise<void> {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"Ruth Health" <${process.env.SMTP_FROM ?? "noreply@ruthhealth.com"}>`,
      to: opts.to,
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
    logger.info({ messageId: info.messageId }, "Booking confirmation email sent");
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Preview URL");
    }
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
    const t = await getTransporter();
    const formattedTotal = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(opts.totalAmount);

    const info = await t.sendMail({
      from: `"Ruth Health" <${process.env.SMTP_FROM ?? "noreply@ruthhealth.com"}>`,
      to: opts.to,
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
    logger.info({ messageId: info.messageId, orderId: opts.orderId }, "Order confirmation email sent");
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Preview URL");
    }
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

    const t = await getTransporter();
    const currency = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

    const paidAt = new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

    const info = await t.sendMail({
      from: `"Ruth Health Orders" <${process.env.SMTP_FROM ?? "noreply@ruthhealth.com"}>`,
      to: admins.join(","),
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
      { messageId: info.messageId, orderId: opts.orderId, admins },
      "Admin payment notification sent"
    );
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Preview URL");
    }
  } catch (err) {
    logger.error({ err, orderId: opts.orderId }, "Failed to send admin payment notification");
  }
}
