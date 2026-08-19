import { logger } from "./logger.js";

// Sends an owner-facing WhatsApp alert via Twilio's WhatsApp API whenever a
// payment succeeds. Uses plain fetch() with HTTP Basic Auth — no Twilio SDK
// dependency needed.
//
// Required env vars:
//   TWILIO_ACCOUNT_SID    — starts with "AC..."
//   TWILIO_AUTH_TOKEN     — Twilio auth token
//   TWILIO_WHATSAPP_FROM  — Twilio WhatsApp sender, format: "whatsapp:+17372508034"
//   TWILIO_WHATSAPP_TO    — recipient WhatsApp number, format: "whatsapp:+2348012345678"
//
// Note: while on the Twilio Sandbox, TWILIO_WHATSAPP_TO must be a number
// that has joined the sandbox (sent the "join <code>" message) — otherwise
// Twilio will reject the send with a 63016/63007-type error.

export async function sendWhatsAppPaymentNotification(opts: {
  orderId: number;
  itemName: string;
  totalAmount: number;
  customerName?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  reference: string;
}): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TO;

  if (!accountSid || !authToken || !from || !to) {
    logger.warn(
      "Twilio WhatsApp env vars not fully set — skipping WhatsApp payment notification"
    );
    return;
  }

  try {
    const currency = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

    const body =
      `💰 New Paid Order #${opts.orderId}\n\n` +
      `Item: ${opts.itemName}\n` +
      `Total: ${currency(opts.totalAmount)}\n` +
      `Reference: ${opts.reference}\n\n` +
      `Customer: ${opts.customerName ?? "Not provided"}\n` +
      `Email: ${opts.customerEmail}\n` +
      `Phone: ${opts.customerPhone ?? "Not provided"}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(`Twilio API error (${res.status}): ${JSON.stringify(data)}`);
    }

    logger.info(
      { sid: (data as { sid?: string }).sid, orderId: opts.orderId },
      "WhatsApp payment notification sent"
    );
  } catch (err) {
    logger.error({ err, orderId: opts.orderId }, "Failed to send WhatsApp payment notification");
  }
}
