import { pgTable, serial, integer, text, timestamp, json, boolean } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Existing tables (preserved exactly)
// ---------------------------------------------------------------------------

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  contentUrl: text("content_url"),
  contentBody: text("content_body"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseEnrollmentsTable = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// NEW: Course modules (parts / sections)
// ---------------------------------------------------------------------------

export const courseModulesTable = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  introduction: text("introduction"),        // Rich-text / HTML intro
  contentBody: text("content_body"),         // Main lesson content (HTML)
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// NEW: Media files attached to modules (images / videos)
// ---------------------------------------------------------------------------

export const courseModuleMediaTable = pgTable("course_module_media", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  type: text("type", { enum: ["image", "video"] }).notNull(),
  url: text("url").notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Updated: Quiz questions now support moduleId (default 0 = course-level)
// ---------------------------------------------------------------------------

export const courseQuizQuestionsTable = pgTable("course_quiz_questions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  moduleId: integer("module_id").notNull().default(0),   // ← FIXED: default 0 for backward compat
  questionHtml: text("question_html").notNull(),
  options: json("options").$type<Array<{ text: string; isCorrect: boolean }>>().notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Updated: Quiz attempts now support moduleId (default 0 = course-level)
// ---------------------------------------------------------------------------

export const courseQuizAttemptsTable = pgTable("course_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  moduleId: integer("module_id").notNull().default(0),   // ← FIXED: default 0 for backward compat
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
