import { Router } from "express";
import { db, coursesTable, courseEnrollmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireAuth, optionalAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/courses", optionalAuth, async (req, res) => {
  try {
    const courses = await db.select().from(coursesTable);
    if (req.user) {
      const enrollments = await db
        .select()
        .from(courseEnrollmentsTable)
        .where(eq(courseEnrollmentsTable.userId, req.user.userId));
      const enrolledIds = new Set(enrollments.map((e) => e.courseId));
      res.json(courses.map((c) => ({ ...c, isEnrolled: enrolledIds.has(c.id) })));
    } else {
      res.json(courses.map((c) => ({ ...c, isEnrolled: false })));
    }
  } catch (err) {
    req.log.error({ err }, "listCourses error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, contentUrl, contentBody } = req.body;
    if (!name || !description) { res.status(400).json({ error: "Missing required fields" }); return; }
    const [course] = await db.insert(coursesTable).values({ name, description, imageUrl: imageUrl ?? null, contentUrl: contentUrl ?? null, contentBody: contentBody ?? null }).returning();
    res.status(201).json({ ...course, isEnrolled: false });
  } catch (err) {
    req.log.error({ err }, "createCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/courses/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Course not found" }); return; }
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await db.select().from(courseEnrollmentsTable).where(and(eq(courseEnrollmentsTable.userId, req.user.userId), eq(courseEnrollmentsTable.courseId, id)));
      isEnrolled = enrollment.length > 0;
    }
    res.json({ ...rows[0], isEnrolled });
  } catch (err) {
    req.log.error({ err }, "getCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, imageUrl, contentUrl, contentBody } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (contentUrl !== undefined) updates.contentUrl = contentUrl;
    if (contentBody !== undefined) updates.contentBody = contentBody;
    const [course] = await db.update(coursesTable).set(updates).where(eq(coursesTable.id, id)).returning();
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    res.json({ ...course, isEnrolled: false });
  } catch (err) {
    req.log.error({ err }, "updateCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(courseEnrollmentsTable).where(eq(courseEnrollmentsTable.courseId, id));
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/enroll", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const existing = await db.select().from(courseEnrollmentsTable).where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)));
    if (existing.length === 0) {
      await db.insert(courseEnrollmentsTable).values({ userId, courseId });
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "enrollCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
