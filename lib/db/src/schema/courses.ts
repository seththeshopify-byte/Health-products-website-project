import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  contentUrl: text("content_url"),
  contentBody: text("content_body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseEnrollmentsTable = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseQuizQuestionsTable = pgTable("course_quiz_questions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  questionHtml: text("question_html").notNull(),
  options: jsonb("options")
    .notNull()
    .$type<Array<{ text: string; isCorrect: boolean }>>(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseQuizAttemptsTable = pgTable("course_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
export type CourseQuizQuestion = typeof courseQuizQuestionsTable.$inferSelect;
export type CourseQuizAttempt = typeof courseQuizAttemptsTable.$inferSelect;
