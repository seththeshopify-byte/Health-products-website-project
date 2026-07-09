import { Router } from "express";
import { db, usersTable, ordersTable, commissionEventsTable, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth.js";

const router = Router();

// GET /dashboard/summary — admin
router.get("/dashboard/summary", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const orders = await db.select().from(ordersTable);
    const commissions = await db.select().from(commissionEventsTable);

    const totalMembers = users.filter((u) => u.role === "member").length;
    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalCommissionPending = commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const recentOrders = paidOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((o) => ({
        ...o,
        itemAmount: Number(o.itemAmount),
        shippingFee: Number(o.shippingFee),
        totalAmount: Number(o.totalAmount),
      }));

    // Top referrers by commission
    const memberCommissions = new Map<number, number>();
    for (const c of commissions) {
      const prev = memberCommissions.get(c.referringMemberId) ?? 0;
      memberCommissions.set(c.referringMemberId, prev + Number(c.amount));
    }
    const referralCounts = new Map<number, number>();
    for (const c of commissions.filter((c) => c.type === "referral")) {
      referralCounts.set(c.referringMemberId, (referralCounts.get(c.referringMemberId) ?? 0) + 1);
    }

    const topReferrers = users
      .filter((u) => memberCommissions.has(u.id))
      .sort((a, b) => (memberCommissions.get(b.id) ?? 0) - (memberCommissions.get(a.id) ?? 0))
      .slice(0, 5)
      .map((u) => ({
        memberId: u.id,
        memberName: u.name,
        promoCode: u.promoCode,
        totalCommission: memberCommissions.get(u.id) ?? 0,
        referralCount: referralCounts.get(u.id) ?? 0,
      }));

    res.json({ totalMembers, totalOrders, totalRevenue, totalCommissionPending, recentOrders, topReferrers });
  } catch (err) {
    req.log.error({ err }, "getDashboardSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/member — member
router.get("/dashboard/member", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const userRows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const user = userRows[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const commissions = await db.select().from(commissionEventsTable).where(eq(commissionEventsTable.referringMemberId, userId));
    const users = await db.select().from(usersTable);

    const salesCommission = commissions.filter((c) => c.type === "sale").reduce((sum, c) => sum + Number(c.amount), 0);
    const referralCommission = commissions.filter((c) => c.type === "referral").reduce((sum, c) => sum + Number(c.amount), 0);
    const totalCommission = salesCommission + referralCommission;

    const referredMembers = users
      .filter((u) => u.referredByCode === user.promoCode)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        promoCode: u.promoCode,
        referredByCode: u.referredByCode,
        createdAt: u.createdAt,
      }));

    const commissionEvents = commissions.map((c) => ({
      ...c,
      amount: Number(c.amount),
      referringMemberName: user.name,
    }));

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.APP_URL ?? "http://localhost:80";
    const referralLink = `${baseUrl}/register?ref=${user.promoCode}`;

    res.json({
      promoCode: user.promoCode,
      referralLink,
      salesCommission,
      referralCommission,
      totalCommission,
      commissionEvents,
      referredMembers,
    });
  } catch (err) {
    req.log.error({ err }, "getMemberDashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/zoom-link
router.get("/admin/zoom-link", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, "zoom_link"));
    res.json({ zoomLink: rows[0]?.value ?? null });
  } catch (err) {
    req.log.error({ err }, "getZoomLink error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/zoom-link
router.patch("/admin/zoom-link", requireAdmin, async (req, res) => {
  try {
    const { zoomLink } = req.body;
    if (!zoomLink) { res.status(400).json({ error: "zoomLink is required" }); return; }
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "zoom_link"));
    if (existing.length > 0) {
      await db.update(settingsTable).set({ value: zoomLink }).where(eq(settingsTable.key, "zoom_link"));
    } else {
      await db.insert(settingsTable).values({ key: "zoom_link", value: zoomLink });
    }
    res.json({ zoomLink });
  } catch (err) {
    req.log.error({ err }, "updateZoomLink error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
