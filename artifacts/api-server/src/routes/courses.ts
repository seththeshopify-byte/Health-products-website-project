import { Router } from "express";
import {
  db,
  coursesTable,
  courseEnrollmentsTable,
  courseQuizQuestionsTable,
  courseQuizAttemptsTable,
  courseModulesTable,
  courseModuleMediaTable,
} from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAdmin, requireAuth, optionalAuth } from "../middlewares/requireAuth.js";

const router = Router();

// ---------------------------------------------------------------------------
// COURSES (existing routes preserved)
// ---------------------------------------------------------------------------

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
    const [course] = await db
      .insert(coursesTable)
      .values({ name, description, imageUrl: imageUrl ?? null, contentUrl: contentUrl ?? null, contentBody: contentBody ?? null })
      .returning();
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
      const enrollment = await db
        .select()
        .from(courseEnrollmentsTable)
        .where(and(eq(courseEnrollmentsTable.userId, req.user.userId), eq(courseEnrollmentsTable.courseId, id)));
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
    // Delete module-level data first
    const modules = await db.select().from(courseModulesTable).where(eq(courseModulesTable.courseId, id));
    for (const mod of modules) {
      await db.delete(courseModuleMediaTable).where(eq(courseModuleMediaTable.moduleId, mod.id));
      await db.delete(courseQuizAttemptsTable).where(eq(courseQuizAttemptsTable.moduleId, mod.id));
      await db.delete(courseQuizQuestionsTable).where(eq(courseQuizQuestionsTable.moduleId, mod.id));
    }
    await db.delete(courseModulesTable).where(eq(courseModulesTable.courseId, id));
    // Delete course-level data
    await db.delete(courseQuizAttemptsTable).where(eq(courseQuizAttemptsTable.courseId, id));
    await db.delete(courseQuizQuestionsTable).where(eq(courseQuizQuestionsTable.courseId, id));
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
    const existing = await db
      .select()
      .from(courseEnrollmentsTable)
      .where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)));
    if (existing.length === 0) {
      await db.insert(courseEnrollmentsTable).values({ userId, courseId });
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "enrollCourse error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// MODULES (new)
// ---------------------------------------------------------------------------

router.get("/courses/:id/modules", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const modules = await db
      .select()
      .from(courseModulesTable)
      .where(eq(courseModulesTable.courseId, courseId))
      .orderBy(asc(courseModulesTable.orderIndex));

    const modulesWithMedia = await Promise.all(
      modules.map(async (mod) => {
        const media = await db
          .select()
          .from(courseModuleMediaTable)
          .where(eq(courseModuleMediaTable.moduleId, mod.id))
          .orderBy(asc(courseModuleMediaTable.orderIndex));
        return { ...mod, media };
      })
    );

    res.json(modulesWithMedia);
  } catch (err) {
    req.log.error({ err }, "listModules error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/modules", requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { title, introduction, contentBody, orderIndex } = req.body;
    if (!title) { res.status(400).json({ error: "Title is required" }); return; }
    const [module] = await db
      .insert(courseModulesTable)
      .values({ courseId, title, introduction: introduction ?? null, contentBody: contentBody ?? null, orderIndex: orderIndex ?? 0 })
      .returning();
    res.status(201).json(module);
  } catch (err) {
    req.log.error({ err }, "createModule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/courses/:id/modules/:moduleId", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const { title, introduction, contentBody, orderIndex } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (introduction !== undefined) updates.introduction = introduction;
    if (contentBody !== undefined) updates.contentBody = contentBody;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;
    const [mod] = await db
      .update(courseModulesTable)
      .set(updates)
      .where(eq(courseModulesTable.id, moduleId))
      .returning();
    if (!mod) { res.status(404).json({ error: "Module not found" }); return; }
    res.json(mod);
  } catch (err) {
    req.log.error({ err }, "updateModule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id/modules/:moduleId", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    await db.delete(courseModuleMediaTable).where(eq(courseModuleMediaTable.moduleId, moduleId));
    await db.delete(courseQuizAttemptsTable).where(eq(courseQuizAttemptsTable.moduleId, moduleId));
    await db.delete(courseQuizQuestionsTable).where(eq(courseQuizQuestionsTable.moduleId, moduleId));
    await db.delete(courseModulesTable).where(eq(courseModulesTable.id, moduleId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteModule error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// MODULE MEDIA (new)
// ---------------------------------------------------------------------------

router.post("/courses/:id/modules/:moduleId/media", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const { type, url, orderIndex } = req.body;
    if (!type || !url) { res.status(400).json({ error: "Type and URL are required" }); return; }
    if (type !== "image" && type !== "video") { res.status(400).json({ error: "Type must be image or video" }); return; }
    const [media] = await db
      .insert(courseModuleMediaTable)
      .values({ moduleId, type, url, orderIndex: orderIndex ?? 0 })
      .returning();
    res.status(201).json(media);
  } catch (err) {
    req.log.error({ err }, "createModuleMedia error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id/modules/:moduleId/media/:mediaId", requireAdmin, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);
    await db.delete(courseModuleMediaTable).where(eq(courseModuleMediaTable.id, mediaId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteModuleMedia error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// COURSE-LEVEL QUIZ (existing routes preserved for backward compatibility)
// ---------------------------------------------------------------------------

router.get("/courses/:id/quiz", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(and(eq(courseQuizQuestionsTable.courseId, courseId), eq(courseQuizQuestionsTable.moduleId, 0)))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    const publicQuestions = questions.map((q) => ({
      id: q.id,
      questionHtml: q.questionHtml,
      orderIndex: q.orderIndex,
      options: (q.options as Array<{ text: string; isCorrect: boolean }>).map(({ text }) => ({ text })),
    }));
    res.json(publicQuestions);
  } catch (err) {
    req.log.error({ err }, "getCourseQuiz error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/quiz/submit", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const { answers } = req.body as {
      answers: Array<{ questionId: number; selectedOptionIndex: number }>;
    };
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(and(eq(courseQuizQuestionsTable.courseId, courseId), eq(courseQuizQuestionsTable.moduleId, 0)))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    if (questions.length === 0) {
      res.status(400).json({ error: "No quiz questions found for this course" });
      return;
    }
    let correctCount = 0;
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const options = question.options as Array<{ text: string; isCorrect: boolean }>;
      const selectedOption = options[answer.selectedOptionIndex];
      if (selectedOption?.isCorrect) correctCount++;
    }
    const total = questions.length;
    const passed = correctCount / total >= 0.7;
    await db.insert(courseQuizAttemptsTable).values({ userId, courseId, moduleId: 0, score: correctCount, passed });
    res.json({ score: correctCount, total, passed });
  } catch (err) {
    req.log.error({ err }, "submitCourseQuiz error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/courses/:id/quiz/result", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const attempts = await db
      .select()
      .from(courseQuizAttemptsTable)
      .where(and(eq(courseQuizAttemptsTable.userId, userId), eq(courseQuizAttemptsTable.courseId, courseId), eq(courseQuizAttemptsTable.moduleId, 0)))
      .orderBy(desc(courseQuizAttemptsTable.score));
    if (attempts.length === 0) {
      res.json({ score: 0, total: 0, passed: false });
      return;
    }
    const best = attempts[0];
    const total = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(and(eq(courseQuizQuestionsTable.courseId, courseId), eq(courseQuizQuestionsTable.moduleId, 0)));
    res.json({ score: best.score, total: total.length, passed: best.passed });
  } catch (err) {
    req.log.error({ err }, "getCourseQuizResult error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/courses/:id/quiz/questions", requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(and(eq(courseQuizQuestionsTable.courseId, courseId), eq(courseQuizQuestionsTable.moduleId, 0)))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    res.json(questions);
  } catch (err) {
    req.log.error({ err }, "listCourseQuizQuestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/quiz/questions", requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { questionHtml, options, orderIndex } = req.body;
    if (!questionHtml || !options?.length) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existingCount = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(and(eq(courseQuizQuestionsTable.courseId, courseId), eq(courseQuizQuestionsTable.moduleId, 0)));
    const [question] = await db
      .insert(courseQuizQuestionsTable)
      .values({ courseId, moduleId: 0, questionHtml, options, orderIndex: orderIndex ?? existingCount.length })
      .returning();
    res.status(201).json(question);
  } catch (err) {
    req.log.error({ err }, "createCourseQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/courses/:id/quiz/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const { questionHtml, options, orderIndex } = req.body;
    const updates: Record<string, unknown> = {};
    if (questionHtml !== undefined) updates.questionHtml = questionHtml;
    if (options !== undefined) updates.options = options;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;
    const [question] = await db
      .update(courseQuizQuestionsTable)
      .set(updates)
      .where(eq(courseQuizQuestionsTable.id, questionId))
      .returning();
    if (!question) { res.status(404).json({ error: "Question not found" }); return; }
    res.json(question);
  } catch (err) {
    req.log.error({ err }, "updateCourseQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id/quiz/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await db.delete(courseQuizQuestionsTable).where(eq(courseQuizQuestionsTable.id, questionId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteCourseQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// MODULE QUIZ — user-facing (new)
// ---------------------------------------------------------------------------

router.get("/courses/:id/modules/:moduleId/quiz", requireAuth, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(eq(courseQuizQuestionsTable.moduleId, moduleId))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    const publicQuestions = questions.map((q) => ({
      id: q.id,
      questionHtml: q.questionHtml,
      orderIndex: q.orderIndex,
      options: (q.options as Array<{ text: string; isCorrect: boolean }>).map(({ text }) => ({ text })),
    }));
    res.json(publicQuestions);
  } catch (err) {
    req.log.error({ err }, "getModuleQuiz error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/modules/:moduleId/quiz/submit", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const moduleId = parseInt(req.params.moduleId);
    const userId = req.user!.userId;
    const { answers } = req.body as {
      answers: Array<{ questionId: number; selectedOptionIndex: number }>;
    };
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(eq(courseQuizQuestionsTable.moduleId, moduleId))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    if (questions.length === 0) {
      res.status(400).json({ error: "No quiz questions found for this module" });
      return;
    }
    let correctCount = 0;
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const options = question.options as Array<{ text: string; isCorrect: boolean }>;
      const selectedOption = options[answer.selectedOptionIndex];
      if (selectedOption?.isCorrect) correctCount++;
    }
    const total = questions.length;
    const passed = correctCount / total >= 0.7;
    await db.insert(courseQuizAttemptsTable).values({ userId, courseId, moduleId, score: correctCount, passed });
    res.json({ score: correctCount, total, passed });
  } catch (err) {
    req.log.error({ err }, "submitModuleQuiz error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/courses/:id/modules/:moduleId/quiz/result", requireAuth, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const userId = req.user!.userId;
    const attempts = await db
      .select()
      .from(courseQuizAttemptsTable)
      .where(and(eq(courseQuizAttemptsTable.userId, userId), eq(courseQuizAttemptsTable.moduleId, moduleId)))
      .orderBy(desc(courseQuizAttemptsTable.score));
    if (attempts.length === 0) {
      res.json({ score: 0, total: 0, passed: false });
      return;
    }
    const best = attempts[0];
    const total = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(eq(courseQuizQuestionsTable.moduleId, moduleId));
    res.json({ score: best.score, total: total.length, passed: best.passed });
  } catch (err) {
    req.log.error({ err }, "getModuleQuizResult error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// MODULE QUIZ — admin (new)
// ---------------------------------------------------------------------------

router.get("/courses/:id/modules/:moduleId/quiz/questions", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const questions = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(eq(courseQuizQuestionsTable.moduleId, moduleId))
      .orderBy(courseQuizQuestionsTable.orderIndex);
    res.json(questions);
  } catch (err) {
    req.log.error({ err }, "listModuleQuizQuestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses/:id/modules/:moduleId/quiz/questions", requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const moduleId = parseInt(req.params.moduleId);
    const { questionHtml, options, orderIndex } = req.body;
    if (!questionHtml || !options?.length) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existingCount = await db
      .select()
      .from(courseQuizQuestionsTable)
      .where(eq(courseQuizQuestionsTable.moduleId, moduleId));
    const [question] = await db
      .insert(courseQuizQuestionsTable)
      .values({ courseId, moduleId, questionHtml, options, orderIndex: orderIndex ?? existingCount.length })
      .returning();
    res.status(201).json(question);
  } catch (err) {
    req.log.error({ err }, "createModuleQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/courses/:id/modules/:moduleId/quiz/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const { questionHtml, options, orderIndex } = req.body;
    const updates: Record<string, unknown> = {};
    if (questionHtml !== undefined) updates.questionHtml = questionHtml;
    if (options !== undefined) updates.options = options;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;
    const [question] = await db
      .update(courseQuizQuestionsTable)
      .set(updates)
      .where(eq(courseQuizQuestionsTable.id, questionId))
      .returning();
    if (!question) { res.status(404).json({ error: "Question not found" }); return; }
    res.json(question);
  } catch (err) {
    req.log.error({ err }, "updateModuleQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id/modules/:moduleId/quiz/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await db.delete(courseQuizQuestionsTable).where(eq(courseQuizQuestionsTable.id, questionId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteModuleQuizQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
